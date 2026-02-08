"""
Bilingual language support for SHYRA.
Handles Hindi and English detection and response language selection.
"""

import re
import logging
from dataclasses import dataclass
from typing import Optional, Tuple

logger = logging.getLogger(__name__)


@dataclass
class LanguageDetection:
    """Result of language detection."""
    language: str  # "en", "hi", "mixed"
    confidence: float
    hindi_ratio: float
    english_ratio: float


class BilingualEngine:
    """
    Handles language detection and bilingual support.
    Works for Hindi and English - the two languages shyra speaks.
    """
    
    # common hindi words to detect
    HINDI_INDICATORS = {
        # common words
        'hai', 'hain', 'tha', 'thi', 'the', 'ho', 'hoon', 'hun',
        'kya', 'kaise', 'kyun', 'kab', 'kahan', 'kaun', 'kitna',
        'aur', 'ya', 'par', 'lekin', 'magar', 'kyunki', 'isliye',
        'mein', 'main', 'hum', 'tum', 'aap', 'woh', 'yeh', 'ye',
        'nahi', 'nahin', 'mat', 'sirf', 'bas', 'abhi', 'kal',
        'accha', 'theek', 'sahi', 'galat', 'bahut', 'thoda',
        # question words
        'batao', 'bolo', 'karo', 'dekho', 'suno', 'jao', 'aao',
        # greetings
        'namaste', 'namaskar', 'shukriya', 'dhanyawad', 'alvida',
        # common phrases
        'kaise', 'kaisa', 'kaisi', 'kuch', 'sab', 'sabhi'
    }
    
    # devanagari unicode range
    DEVANAGARI_PATTERN = re.compile(r'[\u0900-\u097F]')
    
    def __init__(self):
        self._detection_model = None
        self._use_ml_detection = False
    
    def _load_ml_model(self):
        """Load ML-based language detection (optional, for better accuracy)."""
        if self._detection_model is not None:
            return
        
        try:
            from transformers import pipeline
            self._detection_model = pipeline(
                "text-classification",
                model="papluca/xlm-roberta-base-language-detection"
            )
            self._use_ml_detection = True
            logger.info("ml language detection loaded")
        except Exception as e:
            logger.warning(f"ml detection not available: {e}, using rule-based")
            self._use_ml_detection = False
    
    def detect_language(self, text: str) -> LanguageDetection:
        """
        Detect the language of input text.
        Returns language code and confidence.
        """
        if not text or not text.strip():
            return LanguageDetection(
                language="en",
                confidence=0.5,
                hindi_ratio=0.0,
                english_ratio=0.0
            )
        
        # first check for devanagari script - dead giveaway for hindi
        if self.DEVANAGARI_PATTERN.search(text):
            return LanguageDetection(
                language="hi",
                confidence=0.95,
                hindi_ratio=1.0,
                english_ratio=0.0
            )
        
        # use rule-based detection for romanized text
        return self._rule_based_detection(text)
    
    def _rule_based_detection(self, text: str) -> LanguageDetection:
        """Rule-based detection for romanized hindi/english."""
        words = text.lower().split()
        
        if not words:
            return LanguageDetection("en", 0.5, 0.0, 0.0)
        
        hindi_count = 0
        total_words = len(words)
        
        for word in words:
            # clean punctuation
            clean_word = re.sub(r'[^\w]', '', word)
            if clean_word in self.HINDI_INDICATORS:
                hindi_count += 1
        
        hindi_ratio = hindi_count / total_words
        english_ratio = 1 - hindi_ratio
        
        # decide based on ratio
        if hindi_ratio > 0.3:
            if hindi_ratio > 0.6:
                return LanguageDetection("hi", 0.85, hindi_ratio, english_ratio)
            else:
                return LanguageDetection("mixed", 0.7, hindi_ratio, english_ratio)
        else:
            return LanguageDetection("en", 0.85, hindi_ratio, english_ratio)
    
    def get_response_language(
        self, 
        input_language: str,
        preference: str = "auto"
    ) -> str:
        """
        Decide what language to respond in.
        
        Args:
            input_language: detected input language
            preference: "auto", "en", "hi", or "mixed"
        
        Returns:
            language code for response
        """
        if preference != "auto":
            return preference
        
        # match the user's language
        if input_language in ("hi", "mixed"):
            return "hi"
        return "en"
    
    def translate_keywords(self, text: str, target_lang: str) -> str:
        """
        Light translation of common words.
        Not a full translator, just makes mixed responses smoother.
        """
        # this is intentionally simple - for full translation use a proper API
        translations = {
            "en_to_hi": {
                "yes": "haan",
                "no": "nahi",
                "okay": "theek hai",
                "thanks": "shukriya",
                "hello": "namaste",
                "bye": "alvida",
                "good": "accha",
                "bad": "bura",
                "please": "please",  # commonly used as-is
            },
            "hi_to_en": {
                "haan": "yes",
                "nahi": "no",
                "theek": "okay",
                "shukriya": "thanks",
                "namaste": "hello",
                "alvida": "bye",
                "accha": "good",
            }
        }
        
        # we're not doing full translation here
        # just keeping it simple for now
        return text
    
    def format_response(
        self, 
        response: str, 
        target_lang: str,
        include_emoji: bool = True
    ) -> str:
        """
        Format response for the target language.
        Adds appropriate styling.
        """
        # add some personality based on language
        if target_lang == "hi" and include_emoji:
            # hindi responses might be warmer
            if "?" in response:
                response = response.replace("?", "? 🤔")
        
        return response
    
    def get_greeting(self, language: str) -> str:
        """Get an appropriate greeting for the language."""
        greetings = {
            "en": ["Hello!", "Hi there!", "Hey!"],
            "hi": ["Namaste!", "Hello ji!", "Kaise ho?"],
            "mixed": ["Hey! Kaise ho?", "Hi! Sab theek?"]
        }
        
        import random
        return random.choice(greetings.get(language, greetings["en"]))
    
    def get_farewell(self, language: str) -> str:
        """Get an appropriate farewell for the language."""
        farewells = {
            "en": ["Goodbye!", "See you!", "Take care!"],
            "hi": ["Alvida!", "Phir milenge!", "Dhyan rakhna!"],
            "mixed": ["Bye! Take care!", "Chal phir milte hain!"]
        }
        
        import random
        return random.choice(farewells.get(language, farewells["en"]))


# singleton
bilingual_engine = BilingualEngine()
