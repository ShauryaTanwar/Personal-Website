import re
from pathlib import Path

import pytest

from movie_mood.core import MovieStore
from movie_mood.web import create_app
from test_app import TestEmbedder


@pytest.fixture
def client(tmp_path):
    app = create_app(tmp_path, TestEmbedder(), {"TESTING": True, "SECRET_KEY": "test-key"})
    return app.test_client()


def post(client, path, **data):
    with client.session_transaction() as state:
        token = state['csrf']
    return client.post(path, data={"csrf": token, **data}, follow_redirects=True)


def test_complete_browser_workflow(client):
    response = client.get('/')
    assert response.status_code == 200
    assert b'Your collection is empty' in response.data
    response = post(client, '/add', title='Orbit <script>alert(1)</script>', year='2026', plot='An astronaut explores distant stars with a loyal crew searching for a new home in space.')
    assert response.status_code == 200
    assert b'Added Orbit &lt;script&gt;' in response.data
    assert b'<script>alert(1)</script>' not in response.data
    # Full plot is behind a closed details element.
    assert b'<details class="full-plot">' in response.data
    movie_id = response.request.path.split('/')[-1]
    response = post(client, '/search', query='space adventure')
    assert b'YOUR SHORTLIST' in response.data
    assert b'Orbit &lt;script&gt;' in response.data
    response = post(client, '/refine', refinement='more adventure, less tragedy')
    assert b'More adventure' in response.data and b'Less tragedy' in response.data
    response = post(client, '/status/' + movie_id, state='saved', return_to='watchlist')
    assert b'In watchlist' in response.data
    response = post(client, '/status/' + movie_id, state='watched', return_to='history')
    assert b'Undo watched' in response.data
    response = post(client, '/search', query='space adventure')
    assert b'No movies to recommend' in response.data
    response = post(client, '/search', query='space adventure', include_watched='on')
    assert b'Orbit &lt;script&gt;' in response.data
    response = post(client, '/status/' + movie_id, state='clear', return_to='history')
    assert b'A fresh start.' in response.data


def test_validation_preserves_intent_and_form(client):
    client.get('/')
    assert post(client, '/search', query='space').status_code == 200
    response = post(client, '/refine', refinement='more adventure, arbitrary text')
    assert response.status_code == 400
    with client.session_transaction() as state:
        assert state['intent']['prefer'] == []
    response = post(client, '/add', title='Keep this title', plot='too short')
    assert response.status_code == 400 and b'Keep this title' in response.data
    response = post(client, '/search', query='')
    assert response.status_code == 400
    with client.session_transaction() as state:
        assert state['intent']['query'] == 'space'


def test_post_protection_and_missing_movie(client):
    client.get('/')
    assert client.post('/add', data={'title': 'forged'}).status_code == 400
    assert client.get('/movie/not-found').status_code == 404
    assert client.get('/static/style.css').status_code == 200
    assert client.get('/static/app.js').status_code == 200
    assert 'frame-ancestors' in client.get('/').headers['Content-Security-Policy']


def test_cli_state_shared_with_web(tmp_path):
    store = MovieStore(tmp_path, TestEmbedder())
    mid, _ = store.add('Shared movie', 'An astronaut explores distant stars with a loyal crew searching for a new home.')
    store.set_status(mid, 'saved')
    store.close()
    app = create_app(tmp_path, TestEmbedder(), {'TESTING': True})
    client = app.test_client()
    assert b'Shared movie' in client.get('/watchlist').data
    response = post(client, '/status/' + mid, state='watched', return_to='history')
    assert response.status_code == 200
    reopened = MovieStore(tmp_path, TestEmbedder())
    assert reopened.statuses()[mid] == 'watched'
    reopened.close()


def test_search_cache_and_live_invalidation(tmp_path, monkeypatch):
    app = create_app(tmp_path, TestEmbedder(), {'TESTING': True})
    client = app.test_client()
    store = MovieStore(tmp_path, TestEmbedder())
    mid, _ = store.add('Orbit', 'An astronaut explores distant stars with a loyal crew searching for a home.')
    calls = []
    original = MovieStore.search
    def counted(self, *args, **kwargs):
        calls.append(1)
        return original(self, *args, **kwargs)
    monkeypatch.setattr(MovieStore, 'search', counted)
    client.get('/')
    post(client, '/search', query='space')
    post(client, '/search', query='space')
    client.get('/')
    assert len(calls) == 1
    post(client, '/status/' + mid, state='saved')
    assert len(calls) == 1  # Saving does not change ranking.
    response = post(client, '/status/' + mid, state='watched')
    assert len(calls) == 2 and b'No movies to recommend' in response.data
    # A CLI addition is visible to the web server immediately.
    store.add('Second voyage', 'A crew explores stars in space and embarks on a daring journey together.')
    response = client.get('/')
    assert len(calls) == 3 and b'Second voyage' in response.data
    post(client, '/refine', refinement='more adventure')
    assert len(calls) == 4
    store.close()
