"""
Long-term memory module using FAISS.
Stores and retrieves memories based on semantic similarity.
This is where shyra remembers things across sessions.
"""

import os
import json
import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional, Dict, Any
import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class Memory:
    """A single long-term memory."""
    content: str
    memory_type: str  # "fact", "conversation", "preference", "event"
    timestamp: datetime = field(default_factory=datetime.now)
    importance: float = 0.5  # 0-1, how important is this
    metadata: Dict[str, Any] = field(default_factory=dict)
    memory_id: Optional[str] = None
    
    def to_dict(self) -> dict:
        return {
            "content": self.content,
            "memory_type": self.memory_type,
            "timestamp": self.timestamp.isoformat(),
            "importance": self.importance,
            "metadata": self.metadata,
            "memory_id": self.memory_id
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "Memory":
        return cls(
            content=data["content"],
            memory_type=data["memory_type"],
            timestamp=datetime.fromisoformat(data["timestamp"]),
            importance=data.get("importance", 0.5),
            metadata=data.get("metadata", {}),
            memory_id=data.get("memory_id")
        )


class LongTermMemory:
    """
    Vector-based long-term memory using FAISS.
    Stores embeddings for fast similarity search.
    """
    
    def __init__(
        self, 
        index_path: str = "data/faiss_index",
        embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    ):
        self.index_path = index_path
        self.embedding_model_name = embedding_model
        
        self._embedder = None
        self._index = None
        self._memories: List[Memory] = []
        self._dimension = 384  # all-MiniLM-L6-v2 dimension
        
        self._initialized = False
    
    def _init_embedder(self):
        """Load the sentence transformer model."""
        if self._embedder is not None:
            return
        
        try:
            from sentence_transformers import SentenceTransformer
            logger.info(f"loading embedding model: {self.embedding_model_name}")
            self._embedder = SentenceTransformer(self.embedding_model_name)
            self._dimension = self._embedder.get_sentence_embedding_dimension()
            logger.info(f"embedding dimension: {self._dimension}")
        except Exception as e:
            logger.error(f"failed to load embedder: {e}")
            raise
    
    def _init_faiss(self):
        """Initialize FAISS index."""
        if self._index is not None:
            return
        
        try:
            import faiss
            
            # try to load existing index
            index_file = os.path.join(self.index_path, "index.faiss")
            metadata_file = os.path.join(self.index_path, "memories.json")
            
            if os.path.exists(index_file) and os.path.exists(metadata_file):
                logger.info("loading existing faiss index")
                self._index = faiss.read_index(index_file)
                
                with open(metadata_file, 'r', encoding='utf-8') as f:
                    memories_data = json.load(f)
                    self._memories = [Memory.from_dict(m) for m in memories_data]
            else:
                # create new index
                # using IndexFlatIP for inner product (cosine similarity when normalized)
                logger.info("creating new faiss index")
                self._index = faiss.IndexFlatIP(self._dimension)
            
            self._initialized = True
            
        except ImportError:
            logger.error("faiss not installed. run: pip install faiss-cpu")
            raise
        except Exception as e:
            logger.error(f"failed to init faiss: {e}")
            raise
    
    def initialize(self):
        """Initialize the memory system."""
        self._init_embedder()
        self._init_faiss()
    
    def _embed(self, text: str) -> np.ndarray:
        """Get embedding for text."""
        self._init_embedder()
        embedding = self._embedder.encode([text], normalize_embeddings=True)
        return embedding[0].astype('float32')
    
    def add_memory(
        self, 
        content: str, 
        memory_type: str = "fact",
        importance: float = 0.5,
        metadata: Optional[Dict] = None
    ) -> str:
        """
        Add a new memory to long-term storage.
        Returns the memory_id.
        """
        self.initialize()
        
        # create memory object
        memory_id = f"mem_{len(self._memories)}_{datetime.now().timestamp()}"
        memory = Memory(
            content=content,
            memory_type=memory_type,
            importance=importance,
            metadata=metadata or {},
            memory_id=memory_id
        )
        
        # get embedding and add to index
        embedding = self._embed(content)
        self._index.add(embedding.reshape(1, -1))
        
        # store the memory
        self._memories.append(memory)
        
        logger.info(f"added memory: {memory_id}")
        return memory_id
    
    def search(self, query: str, top_k: int = 5) -> List[Memory]:
        """
        Search for similar memories.
        Returns top_k most relevant memories.
        """
        if not self._initialized:
            self.initialize()
        
        if len(self._memories) == 0:
            return []
        
        # get query embedding
        query_embedding = self._embed(query)
        
        # search faiss
        k = min(top_k, len(self._memories))
        scores, indices = self._index.search(query_embedding.reshape(1, -1), k)
        
        # get matching memories
        results = []
        for i, idx in enumerate(indices[0]):
            if idx >= 0 and idx < len(self._memories):
                memory = self._memories[idx]
                # attach similarity score to metadata
                memory.metadata["similarity_score"] = float(scores[0][i])
                results.append(memory)
        
        return results
    
    def get_relevant_context(self, query: str, max_memories: int = 5) -> str:
        """Get relevant memories formatted as context string."""
        memories = self.search(query, top_k=max_memories)
        
        if not memories:
            return ""
        
        context_parts = ["[Relevant memories:]"]
        for mem in memories:
            score = mem.metadata.get("similarity_score", 0)
            context_parts.append(f"- {mem.content} (relevance: {score:.2f})")
        
        return "\n".join(context_parts)
    
    def save(self):
        """Persist the index and memories to disk."""
        if not self._initialized:
            return
        
        import faiss
        
        # create directory if needed
        os.makedirs(self.index_path, exist_ok=True)
        
        # save faiss index
        index_file = os.path.join(self.index_path, "index.faiss")
        faiss.write_index(self._index, index_file)
        
        # save memories metadata
        metadata_file = os.path.join(self.index_path, "memories.json")
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump([m.to_dict() for m in self._memories], f, ensure_ascii=False, indent=2)
        
        logger.info(f"saved {len(self._memories)} memories to {self.index_path}")
    
    def memory_count(self) -> int:
        """How many memories we have."""
        return len(self._memories)
    
    def clear(self):
        """Clear all memories. Use with caution!"""
        import faiss
        self._index = faiss.IndexFlatIP(self._dimension)
        self._memories = []
        logger.warning("all memories cleared")


# default instance
long_term_memory = LongTermMemory()
