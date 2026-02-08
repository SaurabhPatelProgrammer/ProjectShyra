"""
FastAPI brain API for SHYRA.
This is the main entry point for all requests.
"""

import logging
from datetime import datetime
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# --- request/response models ---

class InputData(BaseModel):
    """Input from client."""
    type: str = Field(..., description="Input type: text, voice, or vision")
    content: str = Field(..., description="The actual content (text, base64 audio, base64 image)")
    session_id: Optional[str] = Field(None, description="Session ID for conversation tracking")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)


class BrainResponse(BaseModel):
    """Response from shyra's brain."""
    response_text: str
    emotion: str
    language: str
    action: Optional[Dict[str, Any]] = None
    mood_score: float
    attachment_score: float
    session_id: str
    timestamp: str
    metadata: Dict[str, Any] = Field(default_factory=dict)


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    version: str
    components: Dict[str, bool]


class MemoryInput(BaseModel):
    """Input for adding a memory."""
    content: str
    memory_type: str = "fact"
    importance: float = 0.5


# --- the api app ---

def create_app() -> FastAPI:
    """Create and configure the FastAPI app."""
    
    app = FastAPI(
        title="SHYRA Brain API",
        description="AI Brain for SHYRA assistant - handles perception, memory, emotion, and decision making",
        version="1.0.0"
    )
    
    # add cors - needed for frontend access
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # tighten this in production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # lazy load components to avoid slow startup
    brain_state = {
        "initialized": False,
        "components": {}
    }
    
    def init_brain():
        """Initialize brain components on first request."""
        if brain_state["initialized"]:
            return
        
        logger.info("initializing shyra brain components...")
        
        try:
            from ..perception import text_perception, voice_perception, vision_perception
            from ..memory import short_term_memory, long_term_memory
            from ..emotion import emotion_engine
            from ..decision import decision_engine
            from ..language import bilingual_engine
            from ..actions import action_generator
            from ..config import config
            
            brain_state["components"] = {
                "text_perception": text_perception,
                "voice_perception": voice_perception,
                "vision_perception": vision_perception,
                "short_term_memory": short_term_memory,
                "long_term_memory": long_term_memory,
                "emotion_engine": emotion_engine,
                "decision_engine": decision_engine,
                "bilingual_engine": bilingual_engine,
                "action_generator": action_generator,
                "config": config
            }
            
            brain_state["initialized"] = True
            logger.info("brain initialized successfully")
            
        except Exception as e:
            logger.error(f"brain init failed: {e}")
            raise
    
    # --- routes ---
    
    @app.get("/", response_model=HealthResponse)
    async def root():
        """Health check endpoint."""
        init_brain()
        return HealthResponse(
            status="online",
            version="1.0.0",
            components={
                "perception": True,
                "memory": True,
                "emotion": True,
                "decision": True,
                "language": True,
                "actions": True
            }
        )
    
    @app.get("/health", response_model=HealthResponse)
    async def health_check():
        """Detailed health check."""
        init_brain()
        c = brain_state["components"]
        
        return HealthResponse(
            status="healthy",
            version="1.0.0",
            components={
                "text_perception": c.get("text_perception") is not None,
                "voice_perception": c.get("voice_perception") is not None,
                "vision_perception": c.get("vision_perception") is not None,
                "short_term_memory": c.get("short_term_memory") is not None,
                "long_term_memory": c.get("long_term_memory") is not None,
                "emotion_engine": c.get("emotion_engine") is not None,
                "decision_engine": c.get("decision_engine") is not None
            }
        )
    
    @app.post("/process", response_model=BrainResponse)
    async def process_input(input_data: InputData):
        """
        Main processing endpoint.
        Takes input, runs it through the brain, returns response.
        """
        init_brain()
        c = brain_state["components"]
        
        try:
            session_id = input_data.session_id or f"session_{datetime.now().timestamp()}"
            text_content = ""
            
            # step 1: perception - understand the input
            if input_data.type == "text":
                text_content = input_data.content
                text_analysis = c["text_perception"].analyze(text_content)
                
            elif input_data.type == "voice":
                voice_result = c["voice_perception"].process_audio(input_data.content)
                if not voice_result.success:
                    raise HTTPException(400, f"Voice processing failed: {voice_result.error_message}")
                text_content = voice_result.transcribed_text
                text_analysis = c["text_perception"].analyze(text_content)
                
            elif input_data.type == "vision":
                vision_result = c["vision_perception"].analyze_image(input_data.content)
                if not vision_result.success:
                    raise HTTPException(400, f"Vision processing failed: {vision_result.error_message}")
                text_content = f"[User shared an image: {vision_result.description}]"
                if vision_result.detected_text:
                    text_content += f" [Text in image: {vision_result.detected_text}]"
                text_analysis = c["text_perception"].analyze(text_content)
                
            else:
                raise HTTPException(400, f"Unknown input type: {input_data.type}")
            
            # step 2: detect language
            lang_detection = c["bilingual_engine"].detect_language(text_content)
            response_language = c["bilingual_engine"].get_response_language(lang_detection.language)
            
            # step 3: update emotion based on input
            emotion_update = c["emotion_engine"].process_input(
                text_content, 
                text_analysis.sentiment_hint
            )
            emotion_context = c["emotion_engine"].get_emotion_context()
            
            # step 4: get relevant memories
            memory_context = ""
            try:
                memory_context = c["long_term_memory"].get_relevant_context(text_content)
            except Exception as e:
                logger.warning(f"memory retrieval failed: {e}")
            
            # step 5: get conversation context
            conversation_context = c["short_term_memory"].get_context_string()
            
            # step 6: make decision and generate response
            decision = c["decision_engine"].decide(
                user_input=text_content,
                text_analysis=text_analysis,
                conversation_context=conversation_context,
                memory_context=memory_context,
                emotion_context=emotion_context,
                detected_language=response_language
            )
            
            # step 7: check for actions
            action_result = None
            if decision.action_type.value != "respond":
                action = c["action_generator"].parse_command(text_content)
                if action:
                    action_result = action.to_dict()
            
            # step 8: update short-term memory
            c["short_term_memory"].add_user_message(text_content)
            c["short_term_memory"].add_assistant_message(decision.response_text)
            
            # step 9: maybe save to long-term memory if important
            if text_analysis.intent.value == "emotional" or "remember" in text_content.lower():
                try:
                    c["long_term_memory"].add_memory(
                        content=text_content,
                        memory_type="conversation",
                        importance=0.7
                    )
                except Exception as e:
                    logger.warning(f"couldn't save memory: {e}")
            
            return BrainResponse(
                response_text=decision.response_text,
                emotion=decision.emotion,
                language=response_language,
                action=action_result,
                mood_score=c["emotion_engine"].state.mood,
                attachment_score=c["emotion_engine"].state.attachment,
                session_id=session_id,
                timestamp=datetime.now().isoformat(),
                metadata={
                    "intent": text_analysis.intent.value,
                    "input_language": lang_detection.language,
                    "keywords": text_analysis.keywords[:5]
                }
            )
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"processing failed: {e}")
            raise HTTPException(500, f"Internal error: {str(e)}")
    
    @app.post("/memory/add")
    async def add_memory(memory: MemoryInput):
        """Add a memory directly."""
        init_brain()
        c = brain_state["components"]
        
        try:
            memory_id = c["long_term_memory"].add_memory(
                content=memory.content,
                memory_type=memory.memory_type,
                importance=memory.importance
            )
            return {"success": True, "memory_id": memory_id}
        except Exception as e:
            raise HTTPException(500, f"Failed to add memory: {e}")
    
    @app.get("/memory/search")
    async def search_memory(query: str, top_k: int = 5):
        """Search long-term memory."""
        init_brain()
        c = brain_state["components"]
        
        try:
            memories = c["long_term_memory"].search(query, top_k=top_k)
            return {
                "query": query,
                "results": [m.to_dict() for m in memories]
            }
        except Exception as e:
            raise HTTPException(500, f"Memory search failed: {e}")
    
    @app.get("/emotion/state")
    async def get_emotion_state():
        """Get current emotional state."""
        init_brain()
        c = brain_state["components"]
        
        return {
            "state": c["emotion_engine"].state.to_dict(),
            "mood_label": c["emotion_engine"].get_mood_label(),
            "attachment_label": c["emotion_engine"].get_attachment_label(),
            "suggested_tone": c["emotion_engine"].get_response_tone()
        }
    
    @app.post("/conversation/clear")
    async def clear_conversation():
        """Clear short-term memory (start fresh conversation)."""
        init_brain()
        c = brain_state["components"]
        
        c["short_term_memory"].clear()
        return {"success": True, "message": "Conversation cleared"}
    
    @app.get("/conversation/history")
    async def get_conversation_history():
        """Get current conversation history."""
        init_brain()
        c = brain_state["components"]
        
        return {
            "messages": c["short_term_memory"].get_conversation_history(),
            "message_count": c["short_term_memory"].message_count()
        }
    
    return app


# create the app instance
app = create_app()
