"""
Settings and configuration for SHYRA Brain.
All the knobs and dials live here.
"""

import os
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class LLMSettings:
    """Settings for the language model."""
    
    # use "ollama" or "huggingface" - pick what works for you
    provider: str = "ollama"
    
    # ollama model name - mistral is fast and good enough
    ollama_model: str = "mistral"
    ollama_base_url: str = "http://localhost:11434"
    
    # huggingface model - fallback if ollama isn't running
    hf_model: str = "microsoft/DialoGPT-medium"
    
    # how creative should responses be (0 = boring, 1 = wild)
    temperature: float = 0.7
    
    # max tokens to generate
    max_tokens: int = 512


@dataclass
class MemorySettings:
    """Settings for memory systems."""
    
    # how many recent messages to keep in short-term memory
    short_term_limit: int = 20
    
    # where to save the vector store
    faiss_index_path: str = "data/faiss_index"
    
    # embedding model for long-term memory
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    
    # how many similar memories to fetch
    top_k_memories: int = 5


@dataclass
class EmotionSettings:
    """Settings for the emotion engine."""
    
    # starting mood (0 = sad, 1 = happy)
    default_mood: float = 0.6
    
    # starting attachment level
    default_attachment: float = 0.3
    
    # how fast mood changes
    mood_decay_rate: float = 0.1
    
    # how fast attachment builds up
    attachment_growth_rate: float = 0.05


@dataclass
class LanguageSettings:
    """Settings for bilingual support."""
    
    # default language to respond in
    default_language: str = "auto"  # "en", "hi", or "auto"
    
    # model for language detection
    detection_model: str = "papluca/xlm-roberta-base-language-detection"


@dataclass
class APISettings:
    """Settings for the FastAPI server."""
    
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True
    
    # cors origins - add your frontend urls here
    cors_origins: list = field(default_factory=lambda: ["*"])


@dataclass
class ShyraConfig:
    """Master config that holds everything together."""
    
    llm: LLMSettings = field(default_factory=LLMSettings)
    memory: MemorySettings = field(default_factory=MemorySettings)
    emotion: EmotionSettings = field(default_factory=EmotionSettings)
    language: LanguageSettings = field(default_factory=LanguageSettings)
    api: APISettings = field(default_factory=APISettings)
    
    # shyra's personality - feel free to customize
    assistant_name: str = "SHYRA"
    version: str = "1.0.0"


# global config instance - import this wherever needed
config = ShyraConfig()


def load_config_from_env():
    """
    Override config values from environment variables.
    Useful for production deployments.
    """
    # llm settings
    llm_provider = os.getenv("LLM_PROVIDER")
    if llm_provider:
        config.llm.provider = llm_provider
    
    ollama_model = os.getenv("OLLAMA_MODEL")
    if ollama_model:
        config.llm.ollama_model = ollama_model
    
    ollama_url = os.getenv("OLLAMA_BASE_URL")
    if ollama_url:
        config.llm.ollama_base_url = ollama_url
    
    # api settings
    api_host = os.getenv("API_HOST")
    if api_host:
        config.api.host = api_host
    
    api_port = os.getenv("API_PORT")
    if api_port:
        try:
            config.api.port = int(api_port)
        except ValueError:
            pass
            
    api_debug = os.getenv("DEBUG")
    if api_debug:
        config.api.debug = api_debug.lower() == "true"
    
    return config
