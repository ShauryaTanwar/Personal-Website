"""Command-line entry points and an interactive discovery session."""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

from .core import Intent, MovieStore
from .data import download, import_cmu

# Independent of working directory so launching from elsewhere preserves your data.
DEFAULT_HOME = Path(os.environ.get("MOVIE_MOOD_HOME", Path.home() / ".movie_mood"))
HELP = """Commands:
  search <description>       Start a fresh mood search
  refine more X, less Y      Refine the current search (also: without X, avoid X)
  reset                     Remove refinements and repeat the original search
  save <number or ID>        Save a result to your watchlist
  watched <number or ID>     Mark watched; excluded from future results by default
  clear <number or ID>       Remove saved/watched status
  show <number or ID>        Read a full plot (spoilers)
  watchlist / history        List saved / watched movies
  add                       Enter a new movie; searchable immediately
  include-watched on|off     Control whether watched movies appear
  status / help / quit
Bare text starts a search; a follow-up starting more/less/without/avoid refines it.
Refinements are soft preferences, not guaranteed content exclusions.
"""


def display(results, store):
    if not results:
        print("No recommendations. Load movies, add a movie, or include watched results.")
        return
    statuses = store.statuses()
    print("\nPlot excerpts may contain spoilers. Ranked by semantic fit; scores are not percentages.")
    for i, movie in enumerate(results, 1):
        label = statuses.get(movie["id"], "")
        print(f"\n{i}. {movie['title']} ({movie['year'] or 'year unknown'})" + (f" [{label}]" if label else ""))
        print(f"   ID: {movie['id']} | {movie.get('genres') or 'Genres unavailable'}")
        print(f"   Plot evidence: {movie.get('evidence', movie['plot'][:600])}")


def show_intent(intent):
    print(f"\nMood: {intent.query}")
    print("Prefer: " + (", ".join(intent.prefer) or "none"))
    print("Avoid (soft): " + (", ".join(intent.avoid) or "none"))


def ask_movie(store):
    title = input("Title: ")
    year = input("Year (optional): ")
    genres = input("Genres (optional): ")
    language = input("Language (optional): ")
    print("Paste the plot; finish with a blank line (at least 10 words):")
    lines = []
    while True:
        line = input()
        if not line.strip():
            break
        lines.append(line)
    mid, _ = store.add(title, " ".join(lines), year, genres, language)
    print(f"Added {title.strip()} — {mid}. It is searchable now.")


def shell(store):
    print("\nMOVIE MOOD — describe the story you need tonight.")
    print(f"{store.collection.count()} movies | local data: {store.path}")
    print('Type help for commands. Example: search an unlikely friendship on a long journey')
    results, include_watched = [], False
    try:
        intent = store.load_intent()
        print(f"Previous search available for refinement: {intent.query}")
    except ValueError:
        intent = None

    def resolve(value):
        value = value.strip()
        if value.isdigit():
            number = int(value)
            if not 1 <= number <= len(results):
                raise ValueError("Choose a number from the last displayed list, or use a full movie ID.")
            return results[number - 1]["id"]
        if not value:
            raise ValueError("Provide a result number or movie ID.")
        return value

    while True:
        try:
            text = input("\nmood> ").strip()
            if not text:
                continue
            command, _, argument = text.partition(" ")
            command = command.lower()
            if command in {"quit", "exit"}:
                break
            if command == "help":
                print(HELP)
            elif command == "status":
                print(f"Movies: {store.collection.count()} | Saved: {len(store.watchlist())} | Watched: {len(store.watchlist('watched'))}\nData: {store.path}")
            elif command == "add":
                ask_movie(store)
            elif command in {"watchlist", "history"}:
                results = store.watchlist("saved" if command == "watchlist" else "watched")
                display(results, store)
            elif command in {"save", "watched", "clear"}:
                mid = resolve(argument)
                store.set_status(mid, "saved" if command == "save" else command)
                print(f"Updated: {store.get(mid)['title']}")
            elif command == "show":
                movie = store.get(resolve(argument))
                print(f"\n{movie['title']}\n{movie['plot']}")
            elif command == "include-watched":
                if argument not in {"on", "off"}:
                    raise ValueError("Use include-watched on or include-watched off.")
                include_watched = argument == "on"
                print(f"Include watched: {include_watched}. Applies to the next search/refinement.")
            else:
                if command in {"refine", "reset", "more", "less", "without", "avoid", "instead"}:
                    if intent is None:
                        raise ValueError("Start a search before refining it.")
                    # Work on a copy so a failed query cannot replace saved intent.
                    intent = Intent(intent.query, list(intent.prefer), list(intent.avoid))
                    if command == "reset":
                        intent.prefer, intent.avoid = [], []
                    else:
                        intent.refine(argument if command == "refine" else text)
                else:
                    intent = Intent(argument if command == "search" else text)
                show_intent(intent)
                results = store.search(intent, include_watched=include_watched)
                store.save_intent(intent)
                display(results, store)
        except (EOFError, KeyboardInterrupt):
            print("\nGoodbye. Your movies and watchlist are saved.")
            break
        except ValueError as error:
            print(f"Please adjust: {error}")


def parser():
    p = argparse.ArgumentParser(description="Local movie discovery by meaning.")
    p.add_argument("--home", type=Path, default=DEFAULT_HOME, help="Persistent app data directory (default: ~/.movie_mood)")
    sub = p.add_subparsers(dest="command")
    d = sub.add_parser("download-data", help="Download and unpack the two CMU corpus files")
    d.add_argument("--output", type=Path, default=Path("data/raw"))
    d = sub.add_parser("import-cmu", help="Embed a deterministic subset of CMU movies; safe to rerun")
    d.add_argument("--source", type=Path, default=Path("data/raw"))
    d.add_argument("--limit", type=int, default=1000)
    d.add_argument("--seed", type=int, default=113)
    d = sub.add_parser("web", help="Launch the local web interface at http://127.0.0.1:5000")
    d.add_argument("--port", type=int, default=5000)
    sub.add_parser("shell", help="Interactive movie discovery")
    sub.add_parser("status", help="Show database counts and storage location")
    for command in ("search", "refine"):
        d = sub.add_parser(command)
        d.add_argument("text")
        d.add_argument("--limit", type=int, default=5)
        d.add_argument("--include-watched", action="store_true")
        d.add_argument("--json", action="store_true", dest="as_json")
    d = sub.add_parser("add")
    d.add_argument("--title", required=True)
    group = d.add_mutually_exclusive_group(required=True)
    group.add_argument("--plot")
    group.add_argument("--plot-file", type=Path)
    d.add_argument("--year", default="")
    d.add_argument("--genres", default="")
    d.add_argument("--language", default="")
    for command in ("save", "watched", "clear", "show"):
        d = sub.add_parser(command)
        d.add_argument("id", help="Full movie ID, e.g. cmu:123")
    d = sub.add_parser("watchlist")
    d.add_argument("--watched", action="store_true")
    return p


def main(argv=None):
    args = parser().parse_args(argv)
    store = None
    try:
        if args.command == "download-data":
            download(args.output)
            return 0
        if args.command == "web":
            if not 1 <= args.port <= 65535:
                raise ValueError("Port must be between 1 and 65535.")
            from .web import run
            run(args.home, args.port)
            return 0
        store = MovieStore(args.home)
        if args.command in {None, "shell"}:
            shell(store)
        elif args.command == "import-cmu":
            import_cmu(store, args.source, args.limit, args.seed)
        elif args.command == "status":
            print(f"Movies: {store.collection.count()}\nSaved: {len(store.watchlist())}\nWatched: {len(store.watchlist('watched'))}\nData: {store.path}")
        elif args.command in {"search", "refine"}:
            intent = Intent(args.text) if args.command == "search" else store.load_intent()
            if args.command == "refine":
                intent.refine(args.text)
            results = store.search(intent, args.limit, args.include_watched)
            store.save_intent(intent)
            if args.as_json:
                print(json.dumps({"intent": {"query": intent.query, "prefer": intent.prefer, "avoid": intent.avoid}, "results": results}, indent=2))
            else:
                show_intent(intent)
                display(results, store)
        elif args.command == "add":
            plot = args.plot_file.read_text(encoding="utf-8") if args.plot_file else args.plot
            mid, _ = store.add(args.title, plot, args.year, args.genres, args.language)
            print(f"Added movie: {mid}. Searchable immediately.")
        elif args.command in {"save", "watched", "clear"}:
            store.set_status(args.id, "saved" if args.command == "save" else args.command)
            print(f"Updated: {store.get(args.id)['title']}")
        elif args.command == "show":
            movie = store.get(args.id)
            print(f"{movie['title']} ({movie['year']})\n{movie['plot']}")
        elif args.command == "watchlist":
            display(store.watchlist("watched" if args.watched else "saved"), store)
        return 0
    except (ValueError, OSError, RuntimeError) as error:
        print(f"Error: {error}\nCheck file paths and permissions. First-time model download needs internet access.", file=sys.stderr)
        return 1
    except ImportError as error:
        print(f"Dependency error: {error}. Reinstall with python -m pip install -e .", file=sys.stderr)
        return 1
    except KeyboardInterrupt:
        print("\nStopped. Completed additions remain saved; rerun import to resume.", file=sys.stderr)
        return 130
    finally:
        if store:
            store.close()
