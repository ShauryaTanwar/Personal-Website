"""Run isolated one-line mutations and preserve actual pytest output and diffs."""
import difflib
import json
import os
from pathlib import Path
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
source = root / "backend" / "rules.py"
evidence = Path(__file__).resolve().parent
original_bytes = source.read_bytes()
original = original_bytes.decode("utf-8")
mutations = [
    ("growth_boundary", "minutes >= 600", "minutes > 600"),
    ("heartbeat_boundary", "current_time - last_heartbeat > grace", "current_time - last_heartbeat >= grace"),
    ("edge_allowance", "island_radius - .35", "island_radius - .00"),
    ("overlap_boundary", "** .5 < item_radius", "** .5 <= item_radius"),
    ("overlap_z_distance", "(pz - oz) ** 2", "(pz - pz) ** 2"),
]
results = []
env = dict(os.environ, PYTHONDONTWRITEBYTECODE="1")
try:
    for name, before, after in mutations:
        assert original.count(before) == 1, (name, "ambiguous mutation")
        broken = original.replace(before, after, 1)
        source.write_bytes(broken.encode("utf-8"))
        for cached in (root / "backend" / "__pycache__").glob("rules.*.pyc"):
            cached.unlink()
        diff = "".join(difflib.unified_diff(
            original.splitlines(True), broken.splitlines(True),
            fromfile="a/Bloom/backend/rules.py", tofile="b/Bloom/backend/rules.py"))
        (evidence / f"mutation-{name}.diff").write_text(diff, encoding="utf-8")
        run = subprocess.run([sys.executable, "-m", "pytest", "-q"], cwd=root,
                             env=env, capture_output=True, text=True)
        output = run.stdout + run.stderr
        (evidence / f"mutation-{name}.txt").write_text(output, encoding="utf-8")
        failures = [line for line in output.splitlines() if line.startswith("FAILED ")]
        results.append(dict(name=name, before=before, after=after,
                            exit_code=run.returncode, failing_tests=failures))
        print(f"{name}: exit {run.returncode}; {len(failures)} failing tests", flush=True)
        source.write_bytes(original_bytes)
        if run.returncode not in (0, 1):
            raise RuntimeError(f"{name}: infrastructure error, inspect output")
finally:
    source.write_bytes(original_bytes)
    (evidence / "mutations.json").write_text(json.dumps(results, indent=2) + "\n", encoding="utf-8")

restored = subprocess.run([sys.executable, "-m", "pytest", "-q"], cwd=root,
                          env=env, capture_output=True, text=True)
(evidence / "restored-tests.txt").write_text(restored.stdout + restored.stderr, encoding="utf-8")
print(f"Restored suite exit: {restored.returncode}", flush=True)
sys.exit(restored.returncode)
