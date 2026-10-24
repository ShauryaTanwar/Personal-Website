"""Local Flask interface. The CLI and web app share the same MovieStore."""
from __future__ import annotations

import hmac
import secrets
from dataclasses import asdict
from collections import OrderedDict
from copy import deepcopy
from threading import RLock
from pathlib import Path

from flask import Flask, abort, flash, g, redirect, render_template, request, session, url_for

from .core import Intent, MovieStore


def create_app(home: Path, embedder=None, test_config=None):
    app = Flask(__name__)
    app.config.update(
        SECRET_KEY=secrets.token_hex(32), MAX_CONTENT_LENGTH=128 * 1024,
        SESSION_COOKIE_HTTPONLY=True, SESSION_COOKIE_SAMESITE="Lax",
        APP_HOME=Path(home), EMBEDDER=embedder,
    )
    if test_config:
        app.config.update(test_config)

    def store():
        if "store" not in g:
            g.store = MovieStore(app.config["APP_HOME"], app.config["EMBEDDER"])
        return g.store

    @app.teardown_appcontext
    def close_store(error=None):
        if "store" in g:
            g.store.close()

    @app.before_request
    def protect_forms():
        if "csrf" not in session:
            session["csrf"] = secrets.token_urlsafe(32)
        if request.method == "POST":
            supplied = request.form.get("csrf", "")
            if not supplied or not hmac.compare_digest(session["csrf"], supplied):
                abort(400, description="This form expired. Reload the page and try again.")

    @app.after_request
    def headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Cache-Control"] = "no-store"
        response.headers["Content-Security-Policy"] = "default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; form-action 'self'; frame-ancestors 'none'; base-uri 'self'"
        return response

    @app.context_processor
    def shared():
        state = store().statuses()
        return dict(csrf=session["csrf"], statuses=state,
                    movie_count=store().collection.count(),
                    saved_count=sum(value == "saved" for value in state.values()),
                    watched_count=sum(value == "watched" for value in state.values()))

    def text(name, limit=500, required=False):
        value = request.form.get(name, "").strip()
        if required and not value:
            raise ValueError(f"Please enter {name.replace('_', ' ')}.")
        if len(value) > limit:
            raise ValueError(f"{name.replace('_', ' ').capitalize()} must be at most {limit} characters.")
        return value

    def current_intent():
        raw = session.get("intent")
        return Intent(**raw) if raw else None

    def remember(intent):
        if len(intent.prefer) + len(intent.avoid) > 20:
            raise ValueError("Please reset preferences before adding more than 20.")
        session["intent"] = asdict(intent)
        store().save_intent(intent)

    # Cache by everything that affects ranking. Check live database state so CLI
    # additions and watched changes invalidate results without restarting Flask.
    result_cache = OrderedDict()
    cache_lock = RLock()

    def recommendations(intent):
        include = session.get("include_watched", False)
        watched = tuple(sorted(mid for mid, state in store().statuses().items() if state == "watched")) if not include else ()
        key = (intent.query, tuple(intent.prefer), tuple(intent.avoid), include,
               store().collection.count(), watched)
        with cache_lock:
            if key in result_cache:
                result_cache.move_to_end(key)
                return deepcopy(result_cache[key])
            results = store().search(intent, include_watched=include)
            result_cache[key] = deepcopy(results)
            if len(result_cache) > 32:
                result_cache.popitem(last=False)
            return results

    def render_discover(intent=None, run=False):
        results = []
        if run and intent:
            results = recommendations(intent)
        return render_template("discover.html", page="discover", intent=intent,
                               results=results, searched=run,
                               include_watched=session.get("include_watched", False))

    @app.get("/")
    def discover():
        return render_discover(current_intent(), run=current_intent() is not None)

    @app.post("/search")
    def search():
        intent = current_intent()
        try:
            intent = Intent(text("query", required=True))
            session["include_watched"] = request.form.get("include_watched") == "on"
            # Validate/query before persisting the new intent.
            results = recommendations(intent)
            remember(intent)
            return render_template("discover.html", page="discover", intent=intent, results=results,
                                   searched=True, include_watched=session["include_watched"])
        except ValueError as error:
            flash(str(error), "error")
            return render_discover(current_intent()), 400

    @app.post("/refine")
    def refine():
        intent = current_intent()
        try:
            if not intent:
                raise ValueError("Start a mood search before refining it.")
            if request.form.get("reset") == "yes":
                intent.prefer, intent.avoid = [], []
            else:
                intent.refine(text("refinement", 300, required=True))
            if len(intent.prefer) + len(intent.avoid) > 20:
                raise ValueError("Please reset preferences before adding more than 20.")
            results = recommendations(intent)
            remember(intent)
            return render_template("discover.html", page="discover", intent=intent, results=results,
                                   searched=True, include_watched=session.get("include_watched", False))
        except ValueError as error:
            flash(str(error), "error")
            return render_discover(current_intent()), 400

    @app.get("/watchlist")
    def watchlist():
        watched = request.args.get("view") == "watched"
        return render_template("watchlist.html", page="watchlist", watched=watched,
                               results=store().watchlist("watched" if watched else "saved"))

    @app.route("/add", methods=["GET", "POST"])
    def add_movie():
        if request.method == "POST":
            try:
                title, plot = text("title", 200, True), text("plot", 50000, True)
                mid, _ = store().add(title, plot, text("year", 4), text("genres", 300), text("language", 100))
                flash(f"Added {title}. It is searchable immediately.", "success")
                return redirect(url_for("movie", movie_id=mid), code=303)
            except ValueError as error:
                flash(str(error), "error")
                return render_template("add.html", page="add"), 400
        return render_template("add.html", page="add")

    @app.get("/movie/<movie_id>")
    def movie(movie_id):
        try:
            item = store().get(movie_id)
        except ValueError:
            abort(404, description="That movie is not in your local collection.")
        return render_template("movie.html", page="", movie=item)

    @app.post("/status/<movie_id>")
    def movie_status(movie_id):
        state = request.form.get("state", "")
        try:
            item = store().get(movie_id)
            store().set_status(movie_id, state)
            messages = {"saved": "Saved to your watchlist", "watched": "Marked as watched", "clear": "Removed saved/watched status"}
            flash(f"{messages[state]}: {item['title']}.", "success")
        except ValueError as error:
            flash(str(error), "error")
        destination = request.form.get("return_to")
        if destination == "movie":
            return redirect(url_for("movie", movie_id=movie_id), code=303)
        if destination in {"watchlist", "history"}:
            return redirect(url_for("watchlist", view="watched" if destination == "history" else "saved"), code=303)
        return redirect(url_for("discover"), code=303)

    @app.errorhandler(400)
    @app.errorhandler(404)
    @app.errorhandler(413)
    def expected_error(error):
        return render_template("error.html", page="", code=error.code,
                               message=error.description), error.code

    @app.errorhandler(500)
    def server_error(error):
        return render_template("error.html", page="", code=500,
                               message="The local operation failed. Check the terminal for details; first-time embedding needs an internet connection."), 500

    return app


def run(home, port=5000):
    app = create_app(home)
    print(f"Movie Mood: http://127.0.0.1:{port} | data: {Path(home).expanduser().resolve()}")
    # One local request at a time avoids overlapping embedding sessions and writes.
    app.run(host="127.0.0.1", port=port, debug=False, use_reloader=False, threaded=False)
