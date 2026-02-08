# SHYRA Brain 🧠

AI Brain for the SHYRA assistant. Built with Python, 100% free and open-source tools.

## What's Inside

```
brain/
├── main.py                 # run this to start
├── api/
│   └── brain_api.py        # FastAPI endpoints
├── perception/
│   ├── text.py             # text understanding
│   ├── voice.py            # speech-to-text (whisper)
│   └── vision.py           # image understanding (BLIP)
├── memory/
│   ├── short_term.py       # conversation context
│   └── long_term.py        # vector store (FAISS)
├── emotion/
│   └── emotion_engine.py   # mood & attachment tracking
├── decision/
│   └── decision_engine.py  # response generation (Ollama/HuggingFace)
├── language/
│   └── bilingual.py        # Hindi/English support
├── actions/
│   └── action_generator.py # command execution
├── config/
│   └── settings.py         # all configuration
└── requirements.txt
```

## Quick Start

### 1. Install Dependencies

```bash
cd brain
pip install -r requirements.txt
```

### 2. Set Up LLM

**Option A: HuggingFace (Default - No setup needed)**
- Works out of the box.
- Models download automatically on the first search (needs internet once).
- No external software needed.

**Option B: Ollama (Optional - Faster)**
- Recommended if you have a GPU.
- Install Ollama from https://ollama.ai
- Run `ollama pull mistral`
- Change `provider` to `"ollama"` in `config/settings.py`

### 3. Run the Brain

```bash
python -m brain.main
```

Server starts at `http://localhost:8000`

## API Endpoints

### Main Processing
```
POST /process
{
  "type": "text",           # "text", "voice", or "vision"
  "content": "hello shyra",  # text, base64 audio, or base64 image
  "session_id": "optional"
}
```

### Response Format
```json
{
  "response_text": "Hello! How can I help you today?",
  "emotion": "cheerful",
  "language": "en",
  "action": null,
  "mood_score": 0.7,
  "attachment_score": 0.4,
  "session_id": "session_123",
  "timestamp": "2024-01-01T12:00:00"
}
```

### Other Endpoints
- `GET /health` - health check
- `GET /emotion/state` - current emotional state
- `POST /memory/add` - add to long-term memory
- `GET /memory/search?query=xyz` - search memories
- `GET /conversation/history` - get chat history
- `POST /conversation/clear` - start fresh

## Configuration

Edit `config/settings.py` or use environment variables:

```bash
# LLM settings
export LLM_PROVIDER=ollama          # or "huggingface"
export OLLAMA_MODEL=mistral
export OLLAMA_BASE_URL=http://localhost:11434

# API settings
export API_HOST=0.0.0.0
export API_PORT=8000
export DEBUG=true
```

## Features

- **Multi-modal input**: text, voice, and images
- **Bilingual**: Hindi and English auto-detection
- **Memory**: short-term (conversation) + long-term (FAISS vector store)
- **Emotions**: mood and attachment tracking
- **Actions**: can recognize and queue commands
- **Fast**: uses Ollama for local inference

## Testing

```bash
# simple test with curl
curl -X POST http://localhost:8000/process \
  -H "Content-Type: application/json" \
  -d '{"type": "text", "content": "hello shyra, kaise ho?"}'
```

## Notes

- first request might be slow (model loading)
- voice/vision features need extra dependencies installed
- for production, run with `DEBUG=false`
- faiss index saves to `data/faiss_index/`

## Free Tools Used

- FastAPI - web framework
- Ollama / HuggingFace - LLM
- FAISS - vector search
- Whisper - speech-to-text
- BLIP - image captioning
- sentence-transformers - embeddings

---

made with ❤️ for SHYRA
