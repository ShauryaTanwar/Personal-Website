"""Measure real local web requests without needing a browser.

Run from the project folder: python benchmark.py [--home PATH]
This reads movies and stores the last search intent; it does not change movies
or watchlist status. Compare results on the same machine and database.
"""
import argparse
import json
from pathlib import Path
from time import perf_counter

from movie_mood.cli import DEFAULT_HOME
from movie_mood.web import create_app

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--home', type=Path, default=DEFAULT_HOME)
parser.add_argument('--query', default='An amnesiac piecing together their identity')
args = parser.parse_args()
client = create_app(args.home, test_config={'TESTING': True}).test_client()
client.get('/')
with client.session_transaction() as state:
    token = state['csrf']
measurements = []
for name in ['first search (includes model startup)', 'same search again', 'return to Discover']:
    start = perf_counter()
    if name == 'return to Discover':
        response = client.get('/')
    else:
        response = client.post('/search', data={'csrf': token, 'query': args.query})
    measurements.append({'operation': name, 'seconds': round(perf_counter() - start, 4), 'status': response.status_code})
print(json.dumps(measurements, indent=2))
