import hashlib

import pytest
from sqlalchemy import select

from backend.app import Item, StudySession, User, create_app


@pytest.fixture
def setup(tmp_path):
    clock = [1_800_000_000.0]
    app = create_app({"TESTING": True, "DATABASE_URL": "sqlite:///" + str(tmp_path / "test.db"),
                      "CLOCK": lambda: clock[0], "TEST_DURATION_SECONDS": 90,
                      "FRONTEND_ORIGIN": "https://example.github.io"})
    return app, app.test_client(), clock


def register(client, username="gardener"):
    result = client.post("/api/register", json={"username": username, "password": "safe-password-123"})
    assert result.status_code == 201
    return {"Authorization": "Bearer " + result.json["token"]}, result.json["user"]["id"]


def test_full_study_and_persistent_garden(setup):
    app, client, clock = setup
    headers, user_id = register(client)
    with app.app_context():
        from backend.app import Base
        from sqlalchemy import create_engine
        engine = create_engine(app.config["DATABASE_URL"])
        with engine.connect() as conn:
            assert conn.execute(select(User.password_hash).where(User.id == user_id)).scalar() != "safe-password-123"
    inventory = client.get("/api/inventory", headers=headers).json["items"]
    assert len(inventory) == 1 and inventory[0]["kind"] == "daisy"
    assert client.post("/api/tutorial/complete", headers=headers, json={}).status_code == 200
    start = client.post("/api/study/start", headers=headers, json={"duration_minutes": 15, "subject": "Calculus"})
    assert start.status_code == 201
    sid = start.json["session"]["id"]
    assert client.post("/api/study/complete", headers=headers, json={"session_id": sid}).status_code == 409
    for _ in range(3):
        clock[0] += 30
        assert client.post("/api/study/heartbeat", headers=headers, json={"session_id": sid}).status_code == 200
    result = client.post("/api/study/complete", headers=headers, json={"session_id": sid})
    assert result.status_code == 200
    assert result.json["total_minutes"] == 15
    assert client.post("/api/study/complete", headers=headers, json={"session_id": sid}).status_code == 409
    items = client.get("/api/inventory", headers=headers).json["items"]
    assert len(items) == 2
    placements = [{"id": items[0]["id"], "x": 0, "z": 0, "rotation": 1},
                  {"id": items[1]["id"], "x": None, "z": None, "rotation": 0}]
    assert client.post("/api/garden/save", headers=headers, json={"items": placements}).status_code == 200
    assert client.get("/api/garden", headers=headers).json["items"][0]["x"] == 0
    assert len(client.get("/api/inventory", headers=headers).json["items"]) == 1
    assert client.get("/api/stats", headers=headers).json["subjects"] == {"Calculus": 15}

    # Recreating the API process must load the same data from disk.
    restarted = create_app({"TESTING": True, "DATABASE_URL": app.config["DATABASE_URL"], "CLOCK": lambda: clock[0]})
    again = restarted.test_client()
    assert again.get("/api/profile", headers=headers).json["user"]["tutorial_completed"] is True
    assert again.get("/api/garden", headers=headers).json["items"][0]["rotation"] == 1
    other, _ = register(again, "neighbor")
    public = again.get(f"/api/users/{user_id}/garden", headers=other)
    assert public.status_code == 200 and len(public.json["items"]) == 1
    assert again.post("/api/garden/save", headers=other, json={"items": placements}).status_code == 400


def test_expiration_cancel_and_invalid_placement(setup):
    app, client, clock = setup
    headers, _ = register(client)
    first = client.post("/api/study/start", headers=headers, json={"duration_minutes": 25}).json["session"]["id"]
    assert client.post("/api/study/start", headers=headers, json={"duration_minutes": 25}).status_code == 409
    clock[0] += 121
    assert client.post("/api/study/complete", headers=headers, json={"session_id": first}).status_code == 409
    assert client.get("/api/profile", headers=headers).json["completed_sessions"] == 0
    second = client.post("/api/study/start", headers=headers, json={"duration_minutes": 25}).json["session"]["id"]
    assert client.post("/api/study/cancel", headers=headers, json={"session_id": second}).status_code == 200
    assert client.post("/api/study/complete", headers=headers, json={"session_id": second}).status_code == 409
    item = client.get("/api/inventory", headers=headers).json["items"][0]
    assert client.post("/api/garden/save", headers=headers, json={"items": [{"id": item["id"], "x": 99, "z": 0, "rotation": 0}]}).status_code == 400
    assert client.get("/api/garden", headers=headers).json["items"] == []


def test_origin_and_token_restrictions(setup):
    _, client, _ = setup
    response = client.options("/api/study/start", headers={"Origin": "https://example.github.io",
                                                      "Access-Control-Request-Headers": "Authorization, Content-Type"})
    assert response.headers.get("Access-Control-Allow-Origin") == "https://example.github.io"
    denied = client.get("/api/profile", headers={"Origin": "https://other.example"})
    assert denied.status_code == 401
    assert "Access-Control-Allow-Origin" not in denied.headers
    assert client.post("/api/register", json={"username": "abc", "password": "short"}).status_code == 400


def test_island_expands_after_lifetime_hours(setup):
    _, client, clock = setup
    headers, _ = register(client)
    for number in range(8):
        sid = client.post("/api/study/start", headers=headers,
                          json={"duration_minutes": 15}).json["session"]["id"]
        clock[0] += 90
        result = client.post("/api/study/complete", headers=headers, json={"session_id": sid})
        assert result.status_code == 200
        assert result.json["island_size"] == (1 if number == 7 else 0)
    assert client.get("/api/profile", headers=headers).json["total_minutes"] == 120
