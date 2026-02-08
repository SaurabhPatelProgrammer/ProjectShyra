"""
Emotion engine for SHYRA.
Tracks mood and attachment levels to make interactions feel more human.
"""

import json
import os
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, Optional, List
import logging

logger = logging.getLogger(__name__)


@dataclass
class EmotionState:
    """Current emotional state."""
    mood: float = 0.6  # 0 = sad, 0.5 = neutral, 1 = happy
    attachment: float = 0.3  # 0 = stranger, 1 = close friend
    energy: float = 0.7  # 0 = tired, 1 = energetic
    curiosity: float = 0.5  # 0 = bored, 1 = very interested
    
    last_interaction: datetime = field(default_factory=datetime.now)
    interaction_count: int = 0
    
    def to_dict(self) -> dict:
        return {
            "mood": self.mood,
            "attachment": self.attachment,
            "energy": self.energy,
            "curiosity": self.curiosity,
            "last_interaction": self.last_interaction.isoformat(),
            "interaction_count": self.interaction_count
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "EmotionState":
        state = cls(
            mood=data.get("mood", 0.6),
            attachment=data.get("attachment", 0.3),
            energy=data.get("energy", 0.7),
            curiosity=data.get("curiosity", 0.5),
            interaction_count=data.get("interaction_count", 0)
        )
        if "last_interaction" in data:
            state.last_interaction = datetime.fromisoformat(data["last_interaction"])
        return state


class EmotionEngine:
    """
    Manages SHYRA's emotional state.
    Makes her feel more alive and responsive.
    """
    
    # words that affect mood positively
    POSITIVE_TRIGGERS = {
        'love', 'like', 'happy', 'great', 'awesome', 'thanks', 'thank',
        'good', 'best', 'amazing', 'wonderful', 'beautiful', 'nice',
        'pyaar', 'accha', 'badiya', 'khush', 'shukriya', 'dhanyawad'
    }
    
    # words that affect mood negatively
    NEGATIVE_TRIGGERS = {
        'hate', 'angry', 'sad', 'bad', 'stupid', 'idiot', 'shut up',
        'boring', 'worst', 'terrible', 'annoying', 'useless',
        'nafrat', 'bura', 'bakwas', 'bekaar', 'chup', 'pagal'
    }
    
    # words that suggest the user is opening up (builds attachment)
    BONDING_TRIGGERS = {
        'feel', 'think', 'believe', 'personally', 'secret', 'trust',
        'friend', 'help', 'understand', 'really', 'actually',
        'lagta', 'samajh', 'dost', 'madad', 'sachchi', 'dil'
    }
    
    def __init__(self, state_file: str = "data/emotion_state.json"):
        self.state_file = state_file
        self.state = self._load_state()
    
    def _load_state(self) -> EmotionState:
        """Load saved emotional state or create new one."""
        if os.path.exists(self.state_file):
            try:
                with open(self.state_file, 'r') as f:
                    data = json.load(f)
                    return EmotionState.from_dict(data)
            except Exception as e:
                logger.warning(f"couldn't load emotion state: {e}")
        
        return EmotionState()
    
    def save_state(self):
        """Save emotional state to disk."""
        os.makedirs(os.path.dirname(self.state_file) or '.', exist_ok=True)
        with open(self.state_file, 'w') as f:
            json.dump(self.state.to_dict(), f, indent=2)
    
    def process_input(self, text: str, sentiment: str = "neutral") -> Dict:
        """
        Process user input and update emotional state.
        Returns the change summary.
        """
        text_lower = text.lower()
        words = set(text_lower.split())
        
        # track changes
        mood_delta = 0.0
        attachment_delta = 0.0
        curiosity_delta = 0.0
        
        # check for positive triggers
        positive_hits = len(words & self.POSITIVE_TRIGGERS)
        if positive_hits > 0:
            mood_delta += 0.05 * positive_hits
        
        # check for negative triggers
        negative_hits = len(words & self.NEGATIVE_TRIGGERS)
        if negative_hits > 0:
            mood_delta -= 0.08 * negative_hits  # negative hits harder
        
        # check for bonding triggers
        bonding_hits = len(words & self.BONDING_TRIGGERS)
        if bonding_hits > 0:
            attachment_delta += 0.03 * bonding_hits
        
        # questions increase curiosity
        if '?' in text or any(w in text_lower for w in ['kya', 'kyun', 'kaise', 'what', 'why', 'how']):
            curiosity_delta += 0.05
        
        # apply sentiment boost
        if sentiment == "positive":
            mood_delta += 0.05
        elif sentiment == "negative":
            mood_delta -= 0.05
        
        # apply time decay - if it's been a while, mood drifts toward neutral
        hours_since_last = (datetime.now() - self.state.last_interaction).total_seconds() / 3600
        if hours_since_last > 1:
            drift = min(0.1, hours_since_last * 0.02)
            if self.state.mood > 0.5:
                self.state.mood -= drift
            elif self.state.mood < 0.5:
                self.state.mood += drift
        
        # update state with bounds
        self.state.mood = max(0.0, min(1.0, self.state.mood + mood_delta))
        self.state.attachment = max(0.0, min(1.0, self.state.attachment + attachment_delta))
        self.state.curiosity = max(0.0, min(1.0, self.state.curiosity + curiosity_delta))
        
        # update interaction tracking
        self.state.last_interaction = datetime.now()
        self.state.interaction_count += 1
        
        # save after each update
        self.save_state()
        
        return {
            "mood_delta": mood_delta,
            "attachment_delta": attachment_delta,
            "curiosity_delta": curiosity_delta,
            "current_state": self.state.to_dict()
        }
    
    def get_mood_label(self) -> str:
        """Get a human-readable mood label."""
        mood = self.state.mood
        if mood >= 0.8:
            return "ecstatic"
        elif mood >= 0.65:
            return "happy"
        elif mood >= 0.45:
            return "neutral"
        elif mood >= 0.3:
            return "sad"
        else:
            return "upset"
    
    def get_attachment_label(self) -> str:
        """Get a human-readable attachment label."""
        attachment = self.state.attachment
        if attachment >= 0.8:
            return "very_close"
        elif attachment >= 0.6:
            return "friendly"
        elif attachment >= 0.4:
            return "familiar"
        elif attachment >= 0.2:
            return "acquaintance"
        else:
            return "stranger"
    
    def get_response_tone(self) -> str:
        """
        Suggest a tone for the response based on current state.
        The decision engine can use this.
        """
        mood = self.state.mood
        attachment = self.state.attachment
        
        if mood >= 0.7 and attachment >= 0.5:
            return "warm_friendly"
        elif mood >= 0.7:
            return "cheerful"
        elif mood <= 0.3:
            return "subdued"
        elif attachment >= 0.6:
            return "caring"
        else:
            return "professional"
    
    def get_emotion_context(self) -> str:
        """Get emotion info as context for the LLM."""
        return (
            f"Current emotional state - "
            f"Mood: {self.get_mood_label()} ({self.state.mood:.2f}), "
            f"Attachment: {self.get_attachment_label()} ({self.state.attachment:.2f}), "
            f"Suggested tone: {self.get_response_tone()}"
        )
    
    def set_mood(self, value: float):
        """Manually set mood (for testing or external events)."""
        self.state.mood = max(0.0, min(1.0, value))
        self.save_state()
    
    def set_attachment(self, value: float):
        """Manually set attachment level."""
        self.state.attachment = max(0.0, min(1.0, value))
        self.save_state()


# global instance
emotion_engine = EmotionEngine()
