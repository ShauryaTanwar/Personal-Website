"""One local model per process, with a bounded cache of text embeddings."""
from collections import OrderedDict
from functools import lru_cache
from threading import RLock

import numpy as np


class LocalEmbeddings:
    def __init__(self, capacity=2048):
        from chromadb.utils.embedding_functions import ONNXMiniLM_L6_V2
        # Chroma's DefaultEmbeddingFunction creates a fresh ONNX wrapper on each
        # call. Keep the actual model object so its tokenizer/session stay warm.
        self.model = ONNXMiniLM_L6_V2(preferred_providers=["CPUExecutionProvider"])
        self.capacity = capacity
        self.cache = OrderedDict()
        self.lock = RLock()

    def __call__(self, texts):
        with self.lock:
            missing = list(dict.fromkeys(text for text in texts if text not in self.cache))
            fresh = {}
            for start in range(0, len(missing), 64):
                batch = missing[start:start + 64]
                fresh.update(zip(batch, self.model(batch)))
            # Build output before eviction: requests may exceed cache capacity.
            rows = [np.asarray(fresh[text] if text in fresh else self.cache[text], dtype=np.float32).copy()
                    for text in texts]
            for text, vector in zip(texts, rows):
                self.cache[text] = vector.copy()
                self.cache.move_to_end(text)
                if len(self.cache) > self.capacity:
                    self.cache.popitem(last=False)
            return rows


@lru_cache(maxsize=1)
def local_embeddings():
    return LocalEmbeddings()
