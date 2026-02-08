"""
Text perception module.
Handles text input processing and understanding.
"""

import re
from dataclasses import dataclass
from typing import Optional, List
from enum import Enum


class Intent(Enum):
    """What the user is trying to do."""
    GREETING = "greeting"
    QUESTION = "question"
    COMMAND = "command"
    STATEMENT = "statement"
    FAREWELL = "farewell"
    EMOTIONAL = "emotional"
    UNKNOWN = "unknown"


@dataclass
class TextAnalysis:
    """Result of analyzing text input."""
    original_text: str
    cleaned_text: str
    intent: Intent
    keywords: List[str]
    is_question: bool
    sentiment_hint: str  # "positive", "negative", "neutral"
    detected_entities: List[str]


class TextPerception:
    """
    Handles understanding text input.
    Nothing fancy, just practical stuff that works.
    """
    
    def __init__(self):
        # common greeting patterns - works for both english and hindi
        self.greeting_patterns = [
            r'\b(hi|hello|hey|namaste|namaskar|kaise ho|kya hal)\b',
            r'\b(good morning|good evening|good night|shubh)\b',
        ]
        
        # farewell patterns
        self.farewell_patterns = [
            r'\b(bye|goodbye|alvida|phir milenge|see you|tata)\b',
        ]
        
        # command patterns - when user wants shyra to do something
        self.command_patterns = [
            r'\b(please|karo|kar do|bata do|batao|tell me|show me|find|search|open)\b',
        ]
        
        # emotional words to detect mood
        self.positive_words = {'happy', 'good', 'great', 'awesome', 'love', 'khush', 'accha', 'badiya', 'mast'}
        self.negative_words = {'sad', 'bad', 'angry', 'hate', 'dukhi', 'bura', 'upset', 'frustrated'}
    
    def analyze(self, text: str) -> TextAnalysis:
        """
        Main function to analyze incoming text.
        Returns everything we can figure out about it.
        """
        if not text or not text.strip():
            return TextAnalysis(
                original_text=text,
                cleaned_text="",
                intent=Intent.UNKNOWN,
                keywords=[],
                is_question=False,
                sentiment_hint="neutral",
                detected_entities=[]
            )
        
        cleaned = self._clean_text(text)
        intent = self._detect_intent(cleaned)
        keywords = self._extract_keywords(cleaned)
        is_question = self._is_question(cleaned)
        sentiment = self._detect_sentiment(cleaned)
        entities = self._extract_entities(cleaned)
        
        return TextAnalysis(
            original_text=text,
            cleaned_text=cleaned,
            intent=intent,
            keywords=keywords,
            is_question=is_question,
            sentiment_hint=sentiment,
            detected_entities=entities
        )
    
    def _clean_text(self, text: str) -> str:
        """Basic cleanup - remove extra spaces, normalize."""
        # lowercase for easier matching
        text = text.lower().strip()
        # collapse multiple spaces
        text = re.sub(r'\s+', ' ', text)
        return text
    
    def _detect_intent(self, text: str) -> Intent:
        """Figure out what the user wants."""
        # check greetings first
        for pattern in self.greeting_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                return Intent.GREETING
        
        # check farewells
        for pattern in self.farewell_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                return Intent.FAREWELL
        
        # check commands
        for pattern in self.command_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                return Intent.COMMAND
        
        # is it a question?
        if self._is_question(text):
            return Intent.QUESTION
        
        # check if it's emotional venting
        words = set(text.split())
        if words & (self.positive_words | self.negative_words):
            return Intent.EMOTIONAL
        
        return Intent.STATEMENT
    
    def _is_question(self, text: str) -> bool:
        """Check if the text is a question."""
        # obvious check
        if text.strip().endswith('?'):
            return True
        
        # question words in english and hindi
        question_words = [
            'what', 'who', 'where', 'when', 'why', 'how', 'which',
            'kya', 'kaun', 'kahan', 'kab', 'kyun', 'kaise', 'kitna'
        ]
        
        first_word = text.split()[0] if text.split() else ""
        return first_word in question_words
    
    def _detect_sentiment(self, text: str) -> str:
        """Quick and dirty sentiment detection."""
        words = set(text.lower().split())
        
        positive_count = len(words & self.positive_words)
        negative_count = len(words & self.negative_words)
        
        if positive_count > negative_count:
            return "positive"
        elif negative_count > positive_count:
            return "negative"
        return "neutral"
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Pull out important words."""
        # remove common stop words
        stop_words = {
            'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
            'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her',
            'main', 'tum', 'aap', 'woh', 'hum', 'ye', 'hai', 'hain', 'tha',
            'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
            'ka', 'ki', 'ke', 'ko', 'se', 'mein', 'par', 'ne'
        }
        
        words = text.split()
        keywords = [w for w in words if w not in stop_words and len(w) > 2]
        return keywords[:10]  # limit to top 10
    
    def _extract_entities(self, text: str) -> List[str]:
        """
        Extract named entities (basic version).
        For production, you'd use spacy or something fancier.
        """
        entities = []
        
        # look for capitalized words (potential names/places)
        # this is super basic - just shows the pattern
        words = text.split()
        for word in words:
            if word[0].isupper() and len(word) > 1:
                entities.append(word)
        
        return entities


# easy to use instance
text_perception = TextPerception()
