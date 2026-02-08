"""
Decision engine for SHYRA.
This is the brain's core logic - decides what to do and what to say.
"""

import logging
from dataclasses import dataclass
from typing import Optional, List, Dict, Any
from enum import Enum
import requests
import json

logger = logging.getLogger(__name__)


class ActionType(Enum):
    """What kind of action to take."""
    RESPOND = "respond"  # just reply with text
    COMMAND = "command"  # execute a command
    SEARCH = "search"  # search for information
    REMEMBER = "remember"  # store in long-term memory
    CLARIFY = "clarify"  # ask for clarification
    NONE = "none"  # no action needed


@dataclass
class Decision:
    """The decision made by the engine."""
    response_text: str
    emotion: str
    action_type: ActionType
    action_data: Optional[Dict[str, Any]] = None
    confidence: float = 0.8
    language: str = "en"
    
    def to_dict(self) -> dict:
        return {
            "response_text": self.response_text,
            "emotion": self.emotion,
            "action_type": self.action_type.value,
            "action_data": self.action_data,
            "confidence": self.confidence,
            "language": self.language
        }


class DecisionEngine:
    """
    The brain's decision-making center.
    Takes in all the context and figures out what to do.
    """
    
    def __init__(self, config=None):
        # grab config or use defaults
        if config is None:
            from ..config import config
        self.config = config
        
        self._hf_pipeline = None
    
    def _get_ollama_response(self, prompt: str) -> str:
        """Get response from Ollama (local LLM)."""
        try:
            url = f"{self.config.llm.ollama_base_url}/api/generate"
            
            payload = {
                "model": self.config.llm.ollama_model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": self.config.llm.temperature,
                    "num_predict": self.config.llm.max_tokens
                }
            }
            
            response = requests.post(url, json=payload, timeout=60)
            response.raise_for_status()
            
            result = response.json()
            return result.get("response", "").strip()
            
        except requests.exceptions.ConnectionError:
            logger.warning("ollama not running, falling back to huggingface")
            return self._get_hf_response(prompt)
        except Exception as e:
            logger.error(f"ollama failed: {e}")
            return self._get_hf_response(prompt)
    
    def _get_hf_response(self, prompt: str) -> str:
        """Get response from HuggingFace model."""
        try:
            if self._hf_pipeline is None:
                from transformers import pipeline
                logger.info(f"loading hf model: {self.config.llm.hf_model}")
                self._hf_pipeline = pipeline(
                    "text-generation",
                    model=self.config.llm.hf_model,
                    max_new_tokens=self.config.llm.max_tokens
                )
            
            result = self._hf_pipeline(
                prompt,
                max_new_tokens=self.config.llm.max_tokens,
                temperature=self.config.llm.temperature,
                do_sample=True,
                pad_token_id=50256
            )
            
            generated = result[0]["generated_text"]
            # remove the prompt from output
            if generated.startswith(prompt):
                generated = generated[len(prompt):].strip()
            
            return generated
            
        except Exception as e:
            logger.error(f"hf model failed: {e}")
            return "Sorry, I'm having trouble thinking right now. Can you try again?"
    
    def _build_prompt(
        self,
        user_input: str,
        conversation_context: str,
        memory_context: str,
        emotion_context: str,
        detected_language: str
    ) -> str:
        """Build the prompt for the LLM."""
        
        # system prompt that defines shyra's personality
        system = f"""You are SHYRA, a friendly and helpful AI assistant.
You are warm, caring, and genuinely interested in helping.
You can speak both Hindi and English fluently.
You should respond in the same language the user uses.
Keep responses natural and conversational - not too formal.
{emotion_context}
"""
        
        # build the full prompt
        prompt_parts = [system]
        
        if memory_context:
            prompt_parts.append(f"\n{memory_context}")
        
        if conversation_context:
            prompt_parts.append(f"\nRecent conversation:\n{conversation_context}")
        
        prompt_parts.append(f"\nUser: {user_input}")
        prompt_parts.append("\nSHYRA:")
        
        return "\n".join(prompt_parts)
    
    def decide(
        self,
        user_input: str,
        text_analysis=None,
        conversation_context: str = "",
        memory_context: str = "",
        emotion_context: str = "",
        detected_language: str = "en"
    ) -> Decision:
        """
        Main decision-making function.
        Takes all context and returns what to do.
        """
        # figure out if this is a command or just conversation
        action_type = ActionType.RESPOND
        action_data = None
        
        # check for command patterns
        command_triggers = ['open', 'search', 'find', 'play', 'kholo', 'dhundo', 'chalao']
        input_lower = user_input.lower()
        
        for trigger in command_triggers:
            if trigger in input_lower:
                action_type = ActionType.COMMAND
                action_data = {"trigger": trigger, "query": user_input}
                break
        
        # check if we should remember something
        if any(word in input_lower for word in ['remember', 'yaad', 'note', 'important']):
            action_type = ActionType.REMEMBER
            action_data = {"content": user_input}
        
        # build prompt and get response
        prompt = self._build_prompt(
            user_input=user_input,
            conversation_context=conversation_context,
            memory_context=memory_context,
            emotion_context=emotion_context,
            detected_language=detected_language
        )
        
        # try ollama first, fall back to hf
        if self.config.llm.provider == "ollama":
            response_text = self._get_ollama_response(prompt)
        else:
            response_text = self._get_hf_response(prompt)
        
        # clean up response
        response_text = self._clean_response(response_text)
        
        # determine emotion based on response content
        emotion = self._detect_response_emotion(response_text)
        
        return Decision(
            response_text=response_text,
            emotion=emotion,
            action_type=action_type,
            action_data=action_data,
            confidence=0.85,
            language=detected_language
        )
    
    def _clean_response(self, text: str) -> str:
        """Clean up the LLM response."""
        # remove any "User:" or "SHYRA:" artifacts
        lines = text.split('\n')
        cleaned = []
        for line in lines:
            if line.strip().startswith(('User:', 'SHYRA:', 'Human:', 'Assistant:')):
                break
            cleaned.append(line)
        
        text = '\n'.join(cleaned).strip()
        
        # limit length if too long
        if len(text) > 500:
            # try to end at a sentence
            cut_off = text[:500].rfind('.')
            if cut_off > 200:
                text = text[:cut_off + 1]
            else:
                text = text[:500] + "..."
        
        return text
    
    def _detect_response_emotion(self, text: str) -> str:
        """Figure out the emotional tone of the response."""
        text_lower = text.lower()
        
        # check for excitement
        if any(w in text_lower for w in ['!', 'wow', 'amazing', 'great', 'wah']):
            return "excited"
        
        # check for empathy
        if any(w in text_lower for w in ['sorry', 'understand', 'feel', 'samajh']):
            return "empathetic"
        
        # check for curiosity
        if '?' in text:
            return "curious"
        
        return "neutral"


# ready to use instance
decision_engine = DecisionEngine()
