import numpy as np
from movie_mood.embedding import LocalEmbeddings


def test_model_reused_cache_bounded_and_large_batch_safe(monkeypatch):
    calls = []
    instances = []
    class Engine:
        def __init__(self, **kwargs):
            instances.append(self)
        def __call__(self, texts):
            calls.append(list(texts))
            return [np.array([len(text), 1], dtype=np.float32) for text in texts]
    monkeypatch.setattr('chromadb.utils.embedding_functions.ONNXMiniLM_L6_V2', Engine)
    model = LocalEmbeddings(capacity=2)
    result = model(['one', 'one', 'two'])
    assert calls == [['one', 'two']]
    result[0][0] = 999  # Callers cannot corrupt cached values.
    assert model(['one'])[0][0] == 3
    assert len(calls) == 1 and len(instances) == 1
    assert len(model(['one', 'two', 'three', 'four'])) == 4
    assert len(model.cache) == 2
    model(['one'])
    assert calls[-1] == ['one']
