"""
Vision perception module.
Handles image understanding using free vision models.
"""

import base64
import io
from dataclasses import dataclass
from typing import Optional, Union, List
import logging

logger = logging.getLogger(__name__)


@dataclass
class VisionAnalysis:
    """Result of analyzing an image."""
    description: str
    detected_objects: List[str]
    detected_text: Optional[str]
    confidence: float
    success: bool
    error_message: Optional[str] = None


class VisionPerception:
    """
    Analyzes images using BLIP for captioning.
    Also does basic OCR if text is detected.
    """
    
    def __init__(self):
        self._caption_model = None
        self._caption_processor = None
        self._ocr_reader = None
    
    def _load_caption_model(self):
        """Load BLIP model for image captioning."""
        if self._caption_model is not None:
            return
        
        try:
            from transformers import BlipProcessor, BlipForConditionalGeneration
            
            model_name = "Salesforce/blip-image-captioning-base"
            logger.info(f"loading vision model: {model_name}")
            
            self._caption_processor = BlipProcessor.from_pretrained(model_name)
            self._caption_model = BlipForConditionalGeneration.from_pretrained(model_name)
            
            logger.info("vision model loaded")
        except Exception as e:
            logger.error(f"failed to load vision model: {e}")
            raise
    
    def _load_ocr(self):
        """Load OCR engine for text extraction."""
        if self._ocr_reader is not None:
            return
        
        try:
            import easyocr
            # supports english and hindi out of the box
            self._ocr_reader = easyocr.Reader(['en', 'hi'])
            logger.info("ocr engine loaded")
        except ImportError:
            logger.warning("easyocr not installed, text extraction won't work")
            self._ocr_reader = None
    
    def analyze_image(
        self, 
        image_data: Union[bytes, str],
        extract_text: bool = True
    ) -> VisionAnalysis:
        """
        Analyze an image and describe what's in it.
        
        Args:
            image_data: raw image bytes or base64 string
            extract_text: whether to run OCR
        
        Returns:
            VisionAnalysis with description and detected elements
        """
        try:
            from PIL import Image
            
            # decode base64 if needed
            if isinstance(image_data, str):
                image_data = base64.b64decode(image_data)
            
            # load image
            image = Image.open(io.BytesIO(image_data))
            
            # make sure it's RGB
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # load model and generate caption
            self._load_caption_model()
            
            inputs = self._caption_processor(image, return_tensors="pt")
            output = self._caption_model.generate(**inputs, max_new_tokens=50)
            description = self._caption_processor.decode(output[0], skip_special_tokens=True)
            
            # try to extract text if requested
            detected_text = None
            if extract_text:
                detected_text = self._extract_text(image)
            
            # basic object detection from caption
            # real production would use YOLO or similar
            objects = self._parse_objects_from_caption(description)
            
            return VisionAnalysis(
                description=description,
                detected_objects=objects,
                detected_text=detected_text,
                confidence=0.85,
                success=True
            )
            
        except ImportError as e:
            return VisionAnalysis(
                description="",
                detected_objects=[],
                detected_text=None,
                confidence=0.0,
                success=False,
                error_message=f"missing library for vision: {e}"
            )
        except Exception as e:
            logger.error(f"vision analysis failed: {e}")
            return VisionAnalysis(
                description="",
                detected_objects=[],
                detected_text=None,
                confidence=0.0,
                success=False,
                error_message=str(e)
            )
    
    def _extract_text(self, image) -> Optional[str]:
        """Extract text from image using OCR."""
        try:
            self._load_ocr()
            if self._ocr_reader is None:
                return None
            
            # convert PIL to numpy for easyocr
            import numpy as np
            image_array = np.array(image)
            
            results = self._ocr_reader.readtext(image_array)
            
            # combine all detected text
            texts = [result[1] for result in results if result[2] > 0.5]
            return " ".join(texts) if texts else None
            
        except Exception as e:
            logger.warning(f"ocr failed: {e}")
            return None
    
    def _parse_objects_from_caption(self, caption: str) -> List[str]:
        """
        Extract object names from caption.
        Super basic - just looks for nouns.
        """
        # common objects we might see
        common_objects = {
            'person', 'man', 'woman', 'child', 'dog', 'cat', 'car', 'phone',
            'computer', 'table', 'chair', 'book', 'food', 'tree', 'building',
            'sky', 'water', 'road', 'flower', 'bird', 'laptop', 'cup', 'bottle'
        }
        
        words = caption.lower().split()
        found = [w for w in words if w in common_objects]
        return list(set(found))
    
    def is_available(self) -> bool:
        """Check if vision processing is available."""
        try:
            from PIL import Image
            from transformers import BlipProcessor
            return True
        except ImportError:
            return False


# ready to use instance
vision_perception = VisionPerception()
