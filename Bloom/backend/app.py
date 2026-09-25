"""Bloom API. SQLite is for local development; Render uses persistent PostgreSQL."""
import hashlib
import hmac
import os
import re
import secrets
import time
from datetime import datetime, timezone
from functools import wraps

from flask import Flask, g, jsonify, request
from sqlalchemy import Boolean, Column, Float, ForeignKey, Integer, String, create_engine, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import declarative_base, sessionmaker
from werkzeug.security import check_password_hash, generate_password_hash

Base = declarative_base()

CATALOG = {
    "daisy": {"name": "Daisy Patch", "tier": "small", "radius": 0.40, "icon": "✿"},
    "tulips": {"name": "Pink Tulips", "tier": "small", "radius": 0.40, "icon": "❀"},
    "mushroom": {"name": "Toadstool", "tier": "small", "radius": 0.38, "icon": "◕"},
    "stones": {"name": "River Stones", "tier": "small", "radius": 0.40, "icon": "◆"},
    "shrub": {"name": "Little Shrub", "tier": "small", "radius": 0.50, "icon": "❋"},
    "lantern": {"name": "Garden Lantern", "tier": "medium", "radius": 0.48, "icon": "✧"},
    "bench": {"name": "Wooden Bench", "tier": "medium", "radius": 0.75, "icon": "▤"},
    "pine": {"name": "Little Pine", "tier": "medium", "radius": 0.68, "icon": "♠"},
    "apple": {"name": "Apple Tree", "tier": "medium", "radius": 0.74, "icon": "♣"},
    "willow": {"name": "Willow Tree", "tier": "large", "radius": 0.95, "icon": "♣"},
    "pond": {"name": "Reflecting Pond", "tier": "large", "radius": 1.08, "icon": "◌"},
    "gazebo": {"name": "Garden Gazebo", "tier": "large", "radius": 1.20, "icon": "⌂"},
}
RADII = (4.4, 5.35, 6.3, 7.25)
GRID = 0.75
HEARTBEAT_GRACE = 120
ALLOWED_MINUTES = (15, 25, 45, 60, 90)


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(String(24), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    tutorial_completed = Column(Boolean, nullable=False, default=False)
    created_at = Column(Float, nullable=False)


class LoginToken(Base):
    __tablename__ = "login_tokens"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    token_hash = Column(String(64), unique=True, nullable=False)
    expires_at = Column(Float, nullable=False)


class StudySession(Base):
    __tablename__ = "study_sessions"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    started_at = Column(Float, nullable=False)
    duration_seconds = Column(Integer, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    subject = Column(String(50), nullable=False)
    last_heartbeat = Column(Float, nullable=False)
    status = Column(String(16), nullable=False, default="active")
    completed_at = Column(Float)


class Item(Base):
    __tablename__ = "items"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    kind = Column(String(24), nullable=False)
    x = Column(Integer)
    z = Column(Integer)
    rotation = Column(Integer, nullable=False, default=0)
    earned_at = Column(Float, nullable=False)


def size_for(minutes):
    return 3 if minutes >= 600 else 2 if minutes >= 300 else 1 if minutes >= 120 else 0


def stamp(seconds):
    return datetime.fromtimestamp(seconds, timezone.utc).isoformat()


def item_json(item):
    return {"id": item.id, "kind": item.kind, "x": item.x, "z": item.z, "rotation": item.rotation}


def session_json(s):
    return {"id": s.id, "started_at": stamp(s.started_at), "duration_seconds": s.duration_seconds,
            "duration_minutes": s.duration_minutes, "subject": s.subject, "status": s.status,
            "server_time": stamp(time.time())}


def reward(minutes):
    # Every catalog item has positive weight at every duration.
    weights = {"small": 72, "medium": 24, "large": 4} if minutes < 30 else (
        {"small": 38, "medium": 49, "large": 13} if minutes < 60 else
        {"small": 19, "medium": 47, "large": 34})
    kinds = list(CATALOG)
    return secrets.SystemRandom().choices(kinds, weights=[weights[CATALOG[k]["tier"]] for k in kinds])[0]


def create_app(test_config=None):
    app = Flask(__name__)
    app.config.update(DATABASE_URL=os.environ.get("DATABASE_URL", "sqlite:///bloom.db"),
                      FRONTEND_ORIGIN=os.environ.get("FRONTEND_ORIGIN", "http://localhost:8000"),
                      BLOOM_ADMIN_USERNAME=os.environ.get("BLOOM_ADMIN_USERNAME", ""),
                      BLOOM_ADMIN_KEY=os.environ.get("BLOOM_ADMIN_KEY", ""),
                      CLOCK=time.time, TEST_DURATION_SECONDS=None, MAX_CONTENT_LENGTH=2 * 1024 * 1024)
    if test_config:
        app.config.update(test_config)
    url = app.config["DATABASE_URL"]
    if url.startswith("postgres://"):
        url = "postgresql+psycopg://" + url[len("postgres://"):]
    elif url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url[len("postgresql://"):]
    engine = create_engine(url, pool_pre_ping=True)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, expire_on_commit=False)

    def now():
        return app.config["CLOCK"]()

    @app.before_request
    def open_db():
        g.db = Session()

    @app.teardown_request
    def close_db(error):
        if hasattr(g, "db"):
            if error:
                g.db.rollback()
            g.db.close()

    @app.after_request
    def cors(response):
        origin = request.headers.get("Origin")
        if origin and origin == app.config["FRONTEND_ORIGIN"].rstrip("/"):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
            response.headers["Vary"] = "Origin"
        return response

    @app.route("/api/<path:path>", methods=["OPTIONS"])
    def options(path):
        return "", 204

    def fail(message, code=400):
        return jsonify(error=message), code

    def body():
        value = request.get_json(silent=True)
        return value if isinstance(value, dict) else {}

    def protected(fn):
        @wraps(fn)
        def wrapped(*args, **kwargs):
            header = request.headers.get("Authorization", "")
            raw = header[7:] if header.startswith("Bearer ") else ""
            if not raw:
                return fail("Please log in.", 401)
            digest = hashlib.sha256(raw.encode()).hexdigest()
            entry = g.db.scalar(select(LoginToken).where(LoginToken.token_hash == digest, LoginToken.expires_at > now()))
            if not entry:
                return fail("Your login expired. Please log in again.", 401)
            g.user = g.db.get(User, entry.user_id)
            g.token = entry
            if not g.user:
                return fail("Please log in.", 401)
            return fn(*args, **kwargs)
        return wrapped

    def make_token(user):
        raw = secrets.token_urlsafe(48)
        g.db.add(LoginToken(user_id=user.id, token_hash=hashlib.sha256(raw.encode()).hexdigest(),
                            expires_at=now() + 30 * 86400))
        g.db.commit()
        return raw

    def totals(user_id):
        count, minutes = g.db.execute(select(func.count(StudySession.id), func.coalesce(func.sum(StudySession.duration_minutes), 0)).where(
            StudySession.user_id == user_id, StudySession.status == "completed")).one()
        return int(count), int(minutes)

    def active(user_id):
        return g.db.scalar(select(StudySession).where(StudySession.user_id == user_id,
                                                  StudySession.status == "active").order_by(StudySession.id.desc()))

    def expire(s):
        if s and now() - s.last_heartbeat > HEARTBEAT_GRACE:
            s.status = "failed"
            g.db.commit()
            return None
        return s

    @app.get("/api/health")
    def health():
        return jsonify(ok=True)

    @app.post("/api/register")
    def register():
        data = body()
        username = str(data.get("username", "")).strip()
        password = data.get("password", "")
        if not re.fullmatch(r"[A-Za-z0-9_]{3,24}", username):
            return fail("Username must be 3–24 letters, numbers, or underscores.")
        if not isinstance(password, str) or len(password) < 8 or len(password) > 128:
            return fail("Password must be 8–128 characters.")
        user = User(username=username, password_hash=generate_password_hash(password), created_at=now())
        try:
            g.db.add(user)
            g.db.flush()
            g.db.add(Item(user_id=user.id, kind="daisy", earned_at=now()))
            g.db.commit()
        except IntegrityError:
            g.db.rollback()
            return fail("That username is taken.", 409)
        return jsonify(token=make_token(user), user={"id": user.id, "username": username}), 201

    @app.post("/api/login")
    def login():
        data = body()
        username = str(data.get("username", "")).strip()
        user = g.db.scalar(select(User).where(User.username == username))
        if not user or not isinstance(data.get("password"), str) or not check_password_hash(user.password_hash, data["password"]):
            return fail("Incorrect username or password.", 401)
        return jsonify(token=make_token(user), user={"id": user.id, "username": user.username})

    @app.post("/api/logout")
    @protected
    def logout():
        g.db.delete(g.token)
        g.db.commit()
        return jsonify(ok=True)

    @app.get("/api/profile")
    @protected
    def profile():
        count, minutes = totals(g.user.id)
        current = expire(active(g.user.id))
        return jsonify(user={"id": g.user.id, "username": g.user.username,
                             "tutorial_completed": g.user.tutorial_completed},
                       total_minutes=minutes, completed_sessions=count, island_size=size_for(minutes),
                       active_session=session_json(current) if current else None, catalog=CATALOG)

    @app.post("/api/tutorial/complete")
    @protected
    def tutorial_complete():
        g.user.tutorial_completed = True
        g.db.commit()
        return jsonify(ok=True)

    @app.post("/api/study/start")
    @protected
    def study_start():
        data = body()
        minutes = data.get("duration_minutes")
        if type(minutes) is not int or minutes not in ALLOWED_MINUTES:
            return fail("Choose a listed study duration.")
        subject = str(data.get("subject") or "Study time").strip()[:50] or "Study time"
        # Locking the user row also serializes two simultaneous starts on PostgreSQL.
        g.db.execute(select(User).where(User.id == g.user.id).with_for_update()).scalar_one()
        current = expire(active(g.user.id))
        if current:
            return fail("You already have a study session in progress.", 409)
        seconds = app.config["TEST_DURATION_SECONDS"] if app.testing and app.config["TEST_DURATION_SECONDS"] else minutes * 60
        s = StudySession(user_id=g.user.id, started_at=now(), duration_seconds=seconds,
                         duration_minutes=minutes, subject=subject, last_heartbeat=now(), status="active")
        g.db.add(s)
        g.db.commit()
        return jsonify(session=session_json(s)), 201

    def owned_session():
        session_id = body().get("session_id")
        if type(session_id) is not int:
            return None
        return g.db.scalar(select(StudySession).where(StudySession.id == session_id,
                                                     StudySession.user_id == g.user.id).with_for_update())

    @app.post("/api/study/heartbeat")
    @protected
    def heartbeat():
        s = owned_session()
        if not s or s.status != "active":
            return fail("This session is no longer active.", 409)
        if not expire(s):
            return fail("Study session expired after a long interruption.", 409)
        s.last_heartbeat = now()
        g.db.commit()
        return jsonify(ok=True, server_time=stamp(now()))

    @app.post("/api/study/cancel")
    @protected
    def cancel():
        s = owned_session()
        if not s or s.status != "active":
            return fail("This session is no longer active.", 409)
        s.status = "canceled"
        g.db.commit()
        return jsonify(ok=True)

    @app.post("/api/study/complete")
    @protected
    def complete():
        s = owned_session()
        if not s or s.status != "active":
            return fail("This session has already ended.", 409)
        if not expire(s):
            return fail("Study session expired after a long interruption.", 409)
        if now() < s.started_at + s.duration_seconds:
            return fail("Study time is still remaining.", 409)
        return award_session(s)

    def award_session(s):
        kind = reward(s.duration_minutes)
        item = Item(user_id=g.user.id, kind=kind, earned_at=now())
        s.status = "completed"
        s.completed_at = now()
        g.db.add(item)
        g.db.commit()
        _, minutes = totals(g.user.id)
        return jsonify(item=item_json(item), island_size=size_for(minutes), total_minutes=minutes)

    @app.post("/api/study/admin-complete")
    @protected
    def admin_complete():
        configured_key = app.config["BLOOM_ADMIN_KEY"]
        provided_key = body().get("admin_key", "")
        if (g.user.username != app.config["BLOOM_ADMIN_USERNAME"]
                or not isinstance(configured_key, str) or len(configured_key) < 5
                or not isinstance(provided_key, str)
                or not hmac.compare_digest(provided_key, configured_key)):
            return fail("Owner shortcut is not configured or the key is incorrect.", 403)
        s = owned_session()
        if not s or s.status != "active":
            return fail("This session has already ended.", 409)
        return award_session(s)

    @app.get("/api/inventory")
    @protected
    def inventory():
        items = g.db.scalars(select(Item).where(Item.user_id == g.user.id, Item.x.is_(None)).order_by(Item.id)).all()
        return jsonify(items=[item_json(item) for item in items])

    @app.get("/api/garden")
    @protected
    def garden():
        _, minutes = totals(g.user.id)
        items = g.db.scalars(select(Item).where(Item.user_id == g.user.id, Item.x.is_not(None)).order_by(Item.id)).all()
        return jsonify(username=g.user.username, island_size=size_for(minutes), total_minutes=minutes,
                       items=[item_json(item) for item in items])

    @app.post("/api/garden/save")
    @protected
    def garden_save():
        data = body()
        moves = data.get("items")
        if not isinstance(moves, list) or len(moves) > 5000:
            return fail("Send a list of up to 5000 objects.")
        all_items = g.db.scalars(select(Item).where(Item.user_id == g.user.id).with_for_update()).all()
        by_id = {item.id: item for item in all_items}
        if len(moves) != len(all_items):
            return fail("Garden save must include all your objects.")
        ids = [move.get("id") for move in moves if isinstance(move, dict)]
        if any(type(item_id) is not int for item_id in ids):
            return fail("Garden contains invalid object IDs.")
        if len(ids) != len(moves) or len(set(ids)) != len(ids) or set(ids) != set(by_id):
            return fail("Garden contains unknown, missing, or duplicate objects.")
        _, minutes = totals(g.user.id)
        radius = RADII[size_for(minutes)]
        placed = []
        normalized = []
        for move in moves:
            item = by_id[move["id"]]
            x, z, rotation = move.get("x"), move.get("z"), move.get("rotation", 0)
            if x is None and z is None:
                normalized.append((item, None, None, 0))
                continue
            if type(x) is not int or type(z) is not int or type(rotation) is not int or not 0 <= rotation < 4:
                return fail("Object placement must use grid coordinates and a quarter turn rotation.")
            px, pz = x * GRID, z * GRID
            r = CATALOG[item.kind]["radius"]
            if (px * px + pz * pz) ** .5 + r > radius - .35:
                return fail("An object is too close to the island edge.")
            if any(((px - ox) ** 2 + (pz - oz) ** 2) ** .5 < r + other - .08 for ox, oz, other in placed):
                return fail("Two objects overlap. Choose another spot.")
            placed.append((px, pz, r))
            normalized.append((item, x, z, rotation))
        for item, x, z, rotation in normalized:
            item.x, item.z, item.rotation = x, z, rotation
        g.db.commit()
        return jsonify(ok=True)

    @app.get("/api/stats")
    @protected
    def stats():
        count, minutes = totals(g.user.id)
        sessions = g.db.scalars(select(StudySession).where(StudySession.user_id == g.user.id,
                                                          StudySession.status == "completed").order_by(StudySession.completed_at.desc())).all()
        subjects = {}
        for s in sessions:
            subjects[s.subject] = subjects.get(s.subject, 0) + s.duration_minutes
        return jsonify(total_minutes=minutes, completed_sessions=count, average_minutes=round(minutes / count, 1) if count else 0,
                       island_size=size_for(minutes), subjects=subjects,
                       recent=[{"subject": s.subject, "minutes": s.duration_minutes,
                                "completed_at": stamp(s.completed_at)} for s in sessions[:8]])

    @app.get("/api/users")
    @protected
    def users():
        others = g.db.scalars(select(User).where(User.id != g.user.id).order_by(User.username).limit(100)).all()
        return jsonify(users=[{"id": u.id, "username": u.username} for u in others])

    @app.get("/api/users/<int:user_id>/garden")
    @protected
    def public_garden(user_id):
        other = g.db.get(User, user_id)
        if not other:
            return fail("Island not found.", 404)
        _, minutes = totals(other.id)
        items = g.db.scalars(select(Item).where(Item.user_id == other.id, Item.x.is_not(None)).order_by(Item.id)).all()
        return jsonify(username=other.username, island_size=size_for(minutes),
                       items=[item_json(item) for item in items])

    return app


app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=5000)
