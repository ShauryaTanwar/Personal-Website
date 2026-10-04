"""Run: python -m pytest tests -q. Network calls are mocked; no API key needed."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import pytest
import app as server

PLACE = {'id':'N123','name':'Kyoto','country':'Japan','region':'Kyoto Prefecture','lat':35.01,'lon':135.76,'label':'Kyoto, Kyoto Prefecture, Japan','kind':'city'}

@pytest.fixture
def client(monkeypatch):
    server.app.config['TESTING']=True
    server.cache.clear();server.riddles.clear();server.rates.clear();server.ai_calls.clear()
    monkeypatch.delenv('OPENAI_API_KEY',raising=False)
    return server.app.test_client()

def test_health_and_missing_key(client):
    assert client.get('/api/health').json['guide_ready'] is False
    r=client.post('/api/chat',json={'message':'Hello'})
    assert r.status_code==503 and 'key' in r.json['error']

def test_invalid_input_and_origin(client):
    assert client.post('/api/chat',json=[]).status_code==400
    assert client.post('/api/chat',json={'message':42}).status_code==400
    assert client.post('/api/search',json={'query':'x'}).status_code==400
    assert client.post('/api/search',json={'query':'Kyoto'},headers={'Origin':'https://evil.example'}).status_code==403
    assert client.post('/api/place',json={'token':'tampered'}).status_code==410
    assert client.post('/api/chat',json={'message':'hello','history':'oops'}).status_code==400

def test_geocoding_results_are_signed(client,monkeypatch):
    monkeypatch.setattr(server,'geocode',lambda q:[PLACE,{**PLACE,'id':'N456','country':'Elsewhere'}])
    r=client.post('/api/search',json={'query':'Kyoto'})
    assert len(r.json['places'])==2
    assert server.verified_place(r.json['places'][0]['token'])==PLACE

def test_clue_does_not_leak_and_requires_correct_guess(client,monkeypatch):
    monkeypatch.setattr(server,'geocode',lambda q:[PLACE])
    monkeypatch.setattr(server,'ai_json',lambda *args:{'action':'riddle','query':'Kyoto Japan','reply':'A mystery awaits.','clue':'Former imperial capital, with a thousand temples.','hints':['In Asia','In Japan','Starts with K'],'aliases':['Kyōto']})
    r=client.post('/api/chat',json={'message':'new mystery','mode':'clue'}).json
    assert 'Japan' not in str(r) and 'Kyoto' not in str(r) and r['places']==[]
    token=r['riddle']
    assert client.post('/api/clue',json={'riddle':token,'action':'guess','guess':'Paris'}).json['solved'] is False
    assert client.post('/api/clue',json={'riddle':token,'action':'hint'}).json['reply']=='In Asia'
    answer=client.post('/api/clue',json={'riddle':token,'action':'guess','guess':'Kyōto'}).json
    assert answer['solved'] is True and answer['place']['name']=='Kyoto'
    assert client.post('/api/clue',json={'riddle':token,'action':'reveal'}).json['solved'] is True
    server.riddles[token]['expires']=0
    assert client.post('/api/clue',json={'riddle':token,'action':'hint'}).status_code==410

def test_free_explore_ambiguity_and_chat(client,monkeypatch):
    monkeypatch.setattr(server,'geocode',lambda q:[PLACE,{**PLACE,'id':'N2'}])
    monkeypatch.setattr(server,'ai_json',lambda *a:{'action':'discover','query':'Kyoto','reply':'Choose a match.'})
    r=client.post('/api/chat',json={'message':'Kyoto','mode':'explore'})
    assert len(r.json['places'])==2
    monkeypatch.setattr(server,'ai_json',lambda *a:{'action':'chat','query':'','reply':'Tell me what you love.'})
    assert client.post('/api/chat',json={'message':'hello'}).json['places']==[]

def test_weather_failure_does_not_lose_summary(client,monkeypatch):
    def fail(p): raise server.APIError('Weather unavailable')
    monkeypatch.setattr(server,'weather',fail)
    monkeypatch.setattr(server,'overview',lambda p:{'summary':'A historic city.','highlights':[]})
    r=client.post('/api/place',json={'token':server.public_place(PLACE)['token']})
    assert r.status_code==200
    assert r.json['weather'] is None and r.json['weather_error']=='Weather unavailable'
    assert r.json['overview']['summary']=='A historic city.'

def test_summary_failure_does_not_lose_weather(client,monkeypatch):
    def fail(p): raise server.APIError('No key')
    monkeypatch.setattr(server,'overview',fail)
    monkeypatch.setattr(server,'weather',lambda p:{'current':{'temperature_2m':20}})
    r=client.post('/api/place',json={'token':server.public_place(PLACE)['token']})
    assert r.status_code==200 and r.json['weather']['current']['temperature_2m']==20
    assert r.json['overview'] is None

def test_rate_limit(client):
    for i in range(60): client.post('/api/search',json={'query':''})
    assert client.post('/api/search',json={'query':''}).status_code==429

def test_ai_budget_and_output_parsing(client,monkeypatch):
    monkeypatch.setenv('OPENAI_API_KEY','test-only')
    monkeypatch.setenv('DAILY_AI_LIMIT','1')
    class Response:
        status_code=200;ok=True
        def json(self): return {'status':'completed','output':[{'content':[{'type':'output_text','text':'{"reply":"hello"}'}]}]}
    monkeypatch.setattr(server.requests,'post',lambda *a,**kw:Response())
    assert server.ai_json('test',{},server.SCHEMA)['reply']=='hello'
    with pytest.raises(server.APIError) as e: server.ai_json('test',{},server.SCHEMA)
    assert e.value.status==429

def test_geocoder_validation_and_cache(client,monkeypatch):
    calls=[]
    def fake(url,params):
        calls.append(1)
        return {'features':[{'properties':{'name':'Kyoto','osm_type':'N','osm_id':123,'country':'Japan'},'geometry':{'coordinates':[135.76,35.01]}},{'properties':{'name':'Impossible'},'geometry':{'coordinates':[0,999]}}]}
    monkeypatch.setattr(server,'get_json',fake)
    assert len(server.geocode('Kyoto'))==1
    assert len(server.geocode('Kyoto'))==1 and len(calls)==1

def test_unicode_answers_do_not_match_empty_strings(client):
    token='test'
    server.riddles[token]={'target':PLACE,'aliases':['京都'],'hints':[],'hint_index':0,'expires':10**12}
    assert client.post('/api/clue',json={'riddle':token,'action':'guess','guess':'東京'}).json['solved'] is False
    assert client.post('/api/clue',json={'riddle':token,'action':'guess','guess':'!!!'}).json['solved'] is False
    assert client.post('/api/clue',json={'riddle':token,'action':'guess','guess':'京都'}).json['solved'] is True

def test_city_fallback(client,monkeypatch):
    def fake(url,params):
        if 'photon' in url:raise server.APIError('Down')
        assert params['name']=='Kyoto'
        return {'results':[{'id':1857910,'name':'Kyoto','country':'Japan','admin1':'Kyoto','latitude':35,'longitude':135}]}
    monkeypatch.setattr(server,'get_json',fake)
    assert server.geocode('Kyoto, Japan')[0]['id']=='G1857910'
