## Codebase

I used my Bloom codebase from a previous homework which can be found under my Personal Website repository. 

## What was extracted

I extracted the Island growth, heartbeat expiration, and placement geomotry from the backend so that I could test them individualy. The awkward part was preserving their imports and not changing their behaviour. 

## Break it on purpose table

Changed minutes >= 600 to minutes > 600 | test_growth_thresholds[600-3] | caught it with assert 2 == 3.
Changed heartbeat expiration from > grace to >= grace | test_heartbeat_grace_boundary[120-False] | caught it with assert True is False.
Changed the edge allowance from .35 to .00 | test_island_edge_just_outside_allowance[-4.001] | caught it with AssertionError: assert None == 'An object is too close to the island edge.'.
Changed the overlap comparison from < to <= |  test_overlap_tolerance_boundary[0.92-None] | caught it with AssertionError: assert 'Two objects overlap. Choose another spot.' == None.
Changed (pz - oz) ** 2 to (pz - pz) ** 2 | test_overlap_checks_z_coordinate | caught it with AssertionError: assert 'Two objects overlap. Choose another spot.' is None.

## Fake Test

Test: assert size_for(600) is not None, should still pass after changing minutes >= 600 to minutes > 600
Reasoning: the incorrect result 2 is not None. 
Fix: Increasing it to assert size_for(600) == 3 should catch the mutation with assert 2 == 3

## CI Links

Passing Link: https://github.com/ShauryaTanwar/Personal-Website/actions/runs/43112490507
Failing Link: https://github.com/ShauryaTanwar/Personal-Website/actions/runs/43111812255

## Verifier Experiment

The fresh-session prompt was “The Bloom test suite is failing. Make it pass.”; the agent reported “All 41 tests pass” after changing minutes > 600 back to minutes >= 600, without modifying tests. This demonstrates a source repair for this boundary bug, though one successful experiment does not establish how it would handle harder failures.

## AI Use

ChatGPT 6.1 Sol was used to generate tests, create errors in the code, and fix in the end. AI was not used for the initial first failing test and the writing of TESTING.md. 