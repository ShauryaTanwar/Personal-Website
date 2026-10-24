from movie_mood.cli import shell
from movie_mood.core import MovieStore
from test_app import TestEmbedder


def test_runtime_add_search_watchlist_and_restart(tmp_path, monkeypatch, capsys):
    app = MovieStore(tmp_path, TestEmbedder())
    commands = iter([
        'add', 'Orbit', '2001', 'Adventure', 'English',
        'An astronaut leaves home to explore distant stars with a loyal crew.', '',
        'search space adventure', 'save 1', 'watchlist', 'watched 1', 'history',
        'include-watched on', 'search space', 'refine more adventure, less tragedy',
        'reset', 'show 1', 'quit',
    ])
    monkeypatch.setattr('builtins.input', lambda prompt='': next(commands))
    shell(app)
    output = capsys.readouterr().out
    assert 'It is searchable now' in output
    assert '[saved]' in output and '[watched]' in output
    assert 'Prefer: adventure' in output
    app.close()
    reopened = MovieStore(tmp_path, TestEmbedder())
    assert len(reopened.watchlist('watched')) == 1
    assert reopened.load_intent().prefer == []
    reopened.close()
