"""
Voice perception module.
Handles audio input and converts to text.
Uses whisper for speech-to-text (free and runs locally).
"""

import io
import base64
from dataclasses import dataclass
from typing import Optional, Union
import logging

logger = logging.getLogger(__name__)


@dataclass
class VoiceAnalysis:
    """Result of processing voice input."""
    transcribed_text: str
    language_detected: str
    confidence: float
    duration_seconds: float
    success: bool
    error_message: Optional[str] = None


class VoicePerception:
    """
    Converts voice to text using whisper.
    Lazy loads the model to save memory.
    """
    
    def __init__(self, model_size: str = "base"):
        self.model_size = model_size
        self._model = None
        self._processor = None
    
    def _load_model(self):
        """Load whisper model only when needed."""
        if self._model is not None:
            return
        
        try:
            # using the smaller whisper model - good enough for most cases
            from transformers import WhisperProcessor, WhisperForConditionalGeneration
            
            model_name = f"openai/whisper-{self.model_size}"
            logger.info(f"loading whisper model: {model_name}")
            
            self._processor = WhisperProcessor.from_pretrained(model_name)
            self._model = WhisperForConditionalGeneration.from_pretrained(model_name)
            
            logger.info("whisper model loaded successfully")
        except Exception as e:
            logger.error(f"failed to load whisper: {e}")
            raise
    
    def process_audio(
        self, 
        audio_data: Union[bytes, str],
        sample_rate: int = 16000
    ) -> VoiceAnalysis:
        """
        Process audio input and return transcription.
        
        Args:
            audio_data: raw audio bytes or base64 encoded string
            sample_rate: audio sample rate (default 16000)
        
        Returns:
            VoiceAnalysis with transcription
        """
        try:
            # decode base64 if needed
            if isinstance(audio_data, str):
                audio_data = base64.b64decode(audio_data)
            
            # convert bytes to audio array
            import numpy as np
            import soundfile as sf
            
            # read audio from bytes
            audio_buffer = io.BytesIO(audio_data)
            audio_array, sr = sf.read(audio_buffer)
            
            # resample if needed
            if sr != sample_rate:
                import librosa
                audio_array = librosa.resample(audio_array, orig_sr=sr, target_sr=sample_rate)
            
            # make sure model is loaded
            self._load_model()
            
            # process with whisper
            input_features = self._processor(
                audio_array, 
                sampling_rate=sample_rate, 
                return_tensors="pt"
            ).input_features
            
            # generate transcription
            predicted_ids = self._model.generate(input_features)
            transcription = self._processor.batch_decode(
                predicted_ids, 
                skip_special_tokens=True
            )[0]
            
            # calculate duration
            duration = len(audio_array) / sample_rate
            
            return VoiceAnalysis(
                transcribed_text=transcription.strip(),
                language_detected="auto",  # whisper auto-detects
                confidence=0.9,  # whisper doesn't give confidence, so estimate
                duration_seconds=duration,
                success=True
            )
            
        except ImportError as e:
            # handle missing dependencies gracefully
            missing_lib = str(e).split("'")[1] if "'" in str(e) else "unknown"
            return VoiceAnalysis(
                transcribed_text="",
                language_detected="",
                confidence=0.0,
                duration_seconds=0.0,
                success=False,
                error_message=f"missing library: {missing_lib}. install with pip."
            )
        except Exception as e:
            logger.error(f"voice processing failed: {e}")
            return VoiceAnalysis(
                transcribed_text="",
                language_detected="",
                confidence=0.0,
                duration_seconds=0.0,
                success=False,
                error_message=str(e)
            )
    
    def is_available(self) -> bool:
        """Check if voice processing is available."""
        try:
            import transformers
            import soundfile
            return True
        except ImportError:
            return False


# singleton instance
voice_perception = VoicePerception()
