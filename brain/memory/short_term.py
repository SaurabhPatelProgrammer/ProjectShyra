"""
Short-term memory module.
Keeps track of the current conversation.
Think of it like working memory - recent stuff that's easy to access.
"""

from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
from datetime import datetime
from collections import deque
import json


@dataclass
class Message:
    """A single message in the conversation."""
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime = field(default_factory=datetime.now)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> dict:
        return {
            "role": self.role,
            "content": self.content,
            "timestamp": self.timestamp.isoformat(),
            "metadata": self.metadata
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "Message":
        return cls(
            role=data["role"],
            content=data["content"],
            timestamp=datetime.fromisoformat(data["timestamp"]),
            metadata=data.get("metadata", {})
        )


class ShortTermMemory:
    """
    Manages the current conversation context.
    Uses a sliding window to keep memory bounded.
    """
    
    def __init__(self, max_messages: int = 20):
        self.max_messages = max_messages
        self._messages: deque = deque(maxlen=max_messages)
        self._session_id: Optional[str] = None
        self._context: Dict[str, Any] = {}  # for storing session-level info
    
    def add_message(self, role: str, content: str, metadata: Optional[Dict] = None):
        """Add a message to memory."""
        msg = Message(
            role=role,
            content=content,
            metadata=metadata or {}
        )
        self._messages.append(msg)
    
    def add_user_message(self, content: str, **metadata):
        """Shorthand for adding user messages."""
        self.add_message("user", content, metadata)
    
    def add_assistant_message(self, content: str, **metadata):
        """Shorthand for adding assistant messages."""
        self.add_message("assistant", content, metadata)
    
    def get_recent_messages(self, n: Optional[int] = None) -> List[Message]:
        """Get the n most recent messages."""
        if n is None:
            return list(self._messages)
        return list(self._messages)[-n:]
    
    def get_conversation_history(self) -> List[Dict]:
        """Get history in a format ready for LLM."""
        return [msg.to_dict() for msg in self._messages]
    
    def get_context_string(self, max_tokens: int = 2000) -> str:
        """
        Build a context string for the LLM.
        Estimates tokens crudely (1 token ~ 4 chars).
        """
        messages = list(self._messages)
        context_parts = []
        current_length = 0
        max_chars = max_tokens * 4
        
        # go backwards from most recent
        for msg in reversed(messages):
            line = f"{msg.role}: {msg.content}"
            if current_length + len(line) > max_chars:
                break
            context_parts.insert(0, line)
            current_length += len(line)
        
        return "\n".join(context_parts)
    
    def set_context(self, key: str, value: Any):
        """Store session-level context."""
        self._context[key] = value
    
    def get_context(self, key: str, default: Any = None) -> Any:
        """Retrieve session-level context."""
        return self._context.get(key, default)
    
    def clear(self):
        """Clear all memory."""
        self._messages.clear()
        self._context.clear()
    
    def get_last_user_message(self) -> Optional[str]:
        """Get the most recent user message."""
        for msg in reversed(self._messages):
            if msg.role == "user":
                return msg.content
        return None
    
    def get_last_assistant_message(self) -> Optional[str]:
        """Get the most recent assistant message."""
        for msg in reversed(self._messages):
            if msg.role == "assistant":
                return msg.content
        return None
    
    def message_count(self) -> int:
        """How many messages we have."""
        return len(self._messages)
    
    def to_json(self) -> str:
        """Serialize to JSON for persistence."""
        return json.dumps({
            "messages": [m.to_dict() for m in self._messages],
            "context": self._context,
            "session_id": self._session_id
        })
    
    @classmethod
    def from_json(cls, json_str: str, max_messages: int = 20) -> "ShortTermMemory":
        """Restore from JSON."""
        data = json.loads(json_str)
        memory = cls(max_messages=max_messages)
        
        for msg_data in data.get("messages", []):
            msg = Message.from_dict(msg_data)
            memory._messages.append(msg)
        
        memory._context = data.get("context", {})
        memory._session_id = data.get("session_id")
        
        return memory


# default instance for the app
short_term_memory = ShortTermMemory()
