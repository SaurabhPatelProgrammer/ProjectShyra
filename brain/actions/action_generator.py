"""
Action generator for SHYRA.
Turns decisions into executable actions.
"""

import logging
from dataclasses import dataclass
from typing import Optional, Dict, Any, List
from enum import Enum

logger = logging.getLogger(__name__)


class CommandType(Enum):
    """Types of commands shyra can execute."""
    WEB_SEARCH = "web_search"
    OPEN_APP = "open_app"
    SET_REMINDER = "set_reminder"
    PLAY_MUSIC = "play_music"
    TAKE_NOTE = "take_note"
    SYSTEM_CONTROL = "system_control"
    CUSTOM = "custom"


@dataclass
class Action:
    """An action to be executed."""
    command_type: CommandType
    parameters: Dict[str, Any]
    description: str
    requires_confirmation: bool = False
    executable: bool = True
    
    def to_dict(self) -> dict:
        return {
            "command_type": self.command_type.value,
            "parameters": self.parameters,
            "description": self.description,
            "requires_confirmation": self.requires_confirmation,
            "executable": self.executable
        }


class ActionGenerator:
    """
    Generates executable actions from user intent.
    Bridges the gap between understanding and doing.
    """
    
    # patterns for different command types
    COMMAND_PATTERNS = {
        CommandType.WEB_SEARCH: [
            'search', 'google', 'find', 'look up', 'dhundo', 'khojo'
        ],
        CommandType.OPEN_APP: [
            'open', 'launch', 'start', 'kholo', 'chalu karo'
        ],
        CommandType.PLAY_MUSIC: [
            'play', 'music', 'song', 'gaana', 'bajao', 'sunao'
        ],
        CommandType.SET_REMINDER: [
            'remind', 'reminder', 'yaad', 'dilana', 'alert'
        ],
        CommandType.TAKE_NOTE: [
            'note', 'remember', 'save', 'yaad', 'likh lo'
        ],
        CommandType.SYSTEM_CONTROL: [
            'volume', 'brightness', 'shutdown', 'restart', 'sleep',
            'awaz', 'band karo', 'chalu karo'
        ]
    }
    
    def __init__(self):
        # you can add actual implementations for these
        self._handlers = {}
    
    def parse_command(self, text: str, intent_data: Optional[Dict] = None) -> Optional[Action]:
        """
        Parse text and generate an action if it's a command.
        Returns None if no command detected.
        """
        text_lower = text.lower()
        
        # check each command type
        for cmd_type, patterns in self.COMMAND_PATTERNS.items():
            for pattern in patterns:
                if pattern in text_lower:
                    return self._create_action(cmd_type, text, pattern)
        
        return None
    
    def _create_action(
        self, 
        command_type: CommandType, 
        original_text: str,
        trigger: str
    ) -> Action:
        """Create an action based on command type."""
        
        # extract the query/target from the text
        query = self._extract_query(original_text, trigger)
        
        if command_type == CommandType.WEB_SEARCH:
            return Action(
                command_type=command_type,
                parameters={"query": query},
                description=f"Search the web for: {query}",
                requires_confirmation=False
            )
        
        elif command_type == CommandType.OPEN_APP:
            app_name = self._extract_app_name(query)
            return Action(
                command_type=command_type,
                parameters={"app_name": app_name},
                description=f"Open application: {app_name}",
                requires_confirmation=False
            )
        
        elif command_type == CommandType.PLAY_MUSIC:
            return Action(
                command_type=command_type,
                parameters={"query": query},
                description=f"Play music: {query}",
                requires_confirmation=False
            )
        
        elif command_type == CommandType.SET_REMINDER:
            return Action(
                command_type=command_type,
                parameters={"reminder_text": query, "time": None},
                description=f"Set reminder: {query}",
                requires_confirmation=True  # always confirm reminders
            )
        
        elif command_type == CommandType.TAKE_NOTE:
            return Action(
                command_type=command_type,
                parameters={"note_content": query},
                description=f"Save note: {query[:50]}...",
                requires_confirmation=False
            )
        
        elif command_type == CommandType.SYSTEM_CONTROL:
            return Action(
                command_type=command_type,
                parameters={"command": query},
                description=f"System control: {query}",
                requires_confirmation=True  # always confirm system changes
            )
        
        else:
            return Action(
                command_type=CommandType.CUSTOM,
                parameters={"raw_text": original_text},
                description=f"Custom action: {original_text[:50]}",
                requires_confirmation=True
            )
    
    def _extract_query(self, text: str, trigger: str) -> str:
        """Extract the actual query from the command."""
        # find where the trigger word is and get everything after
        text_lower = text.lower()
        idx = text_lower.find(trigger)
        
        if idx != -1:
            query = text[idx + len(trigger):].strip()
            # remove common filler words
            for filler in ['for', 'about', 'ke baare mein', 'ke liye']:
                if query.lower().startswith(filler):
                    query = query[len(filler):].strip()
            return query
        
        return text
    
    def _extract_app_name(self, query: str) -> str:
        """Extract app name from open command."""
        # common app mappings
        app_aliases = {
            'browser': 'chrome',
            'chrome': 'chrome',
            'firefox': 'firefox',
            'notepad': 'notepad',
            'calculator': 'calc',
            'spotify': 'spotify',
            'youtube': 'youtube',
            'whatsapp': 'whatsapp',
        }
        
        query_lower = query.lower().strip()
        return app_aliases.get(query_lower, query_lower)
    
    def execute_action(self, action: Action) -> Dict[str, Any]:
        """
        Execute an action and return the result.
        This is where you'd hook up actual integrations.
        """
        logger.info(f"executing action: {action.command_type.value}")
        
        # for now, just return what would happen
        # in production, you'd add real implementations here
        
        result = {
            "success": True,
            "action_type": action.command_type.value,
            "description": action.description,
            "executed": False,  # set to True when actually executing
            "message": f"Action queued: {action.description}"
        }
        
        # you can add actual handlers here
        if action.command_type == CommandType.WEB_SEARCH:
            # could open browser to search
            result["url"] = f"https://www.google.com/search?q={action.parameters.get('query', '')}"
        
        elif action.command_type == CommandType.TAKE_NOTE:
            # could save to a file or database
            result["note_saved"] = True
        
        return result
    
    def get_available_commands(self) -> List[Dict]:
        """List all available command types."""
        return [
            {
                "type": cmd_type.value,
                "triggers": patterns,
                "description": f"Handles {cmd_type.value.replace('_', ' ')} commands"
            }
            for cmd_type, patterns in self.COMMAND_PATTERNS.items()
        ]


# ready to use
action_generator = ActionGenerator()
