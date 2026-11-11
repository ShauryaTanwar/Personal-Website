import pytest

from backend.rules import heartbeat_expired, placement_error, size_for


@pytest.mark.parametrize("minutes, expected", [
    (-1, 0), (0, 0), (119, 0), (120, 1), (121, 1),
    (299, 1), (300, 2), (301, 2), (599, 2), (600, 3), (601, 3),
])
def test_growth_thresholds(minutes, expected):
    assert size_for(minutes) == expected


@pytest.mark.parametrize("minutes", [None, "120"])
def test_growth_rejects_non_numeric_minutes(minutes):
    with pytest.raises(TypeError):
        size_for(minutes)


@pytest.mark.parametrize("elapsed, expected", [
    (-1, False), (0, False), (119, False), (120, False), (121, True),
])
def test_heartbeat_grace_boundary(elapsed, expected):
    assert heartbeat_expired(1000 + elapsed, 1000, 120) is expected


def test_heartbeat_uses_supplied_grace():
    assert heartbeat_expired(1011, 1000, 10) is True
    assert heartbeat_expired(1010, 1000, 10) is False


def test_heartbeat_rejects_missing_timestamp():
    with pytest.raises(TypeError):
        heartbeat_expired(1000, None, 120)


def test_empty_garden_accepts_center():
    assert placement_error(0, 0, .4, 4.4, []) is None


@pytest.mark.parametrize("x", [-4, 4])
def test_island_edge_exactly_at_allowance(x):
    assert placement_error(x, 0, 1, 5.35, []) is None


@pytest.mark.parametrize("x", [-4.001, 4.001])
def test_island_edge_just_outside_allowance(x):
    assert placement_error(x, 0, 1, 5.35, []) == "An object is too close to the island edge."


def test_item_radius_counts_toward_edge():
    assert placement_error(4, 0, 1.001, 5.35, []) == "An object is too close to the island edge."


def test_diagonal_edge_uses_euclidean_distance():
    assert placement_error(3, 4, .5, 6, []) is None
    assert placement_error(3, 4, .5, 5.35, []) == "An object is too close to the island edge."


@pytest.mark.parametrize("distance, expected", [
    (.919, "Two objects overlap. Choose another spot."), (.92, None), (.921, None),
])
def test_overlap_tolerance_boundary(distance, expected):
    assert placement_error(distance, 0, .5, 5.35, [(0, 0, .5)]) == expected


def test_overlap_checks_z_coordinate():
    assert placement_error(0, .919, .5, 5.35, [(0, 0, .5)]) == "Two objects overlap. Choose another spot."
    assert placement_error(0, .921, .5, 5.35, [(0, 0, .5)]) is None


def test_overlap_checks_every_existing_object():
    placed = [(3, 0, .5), (0, 0, .5)]
    assert placement_error(0, 0, .5, 5.35, placed) == "Two objects overlap. Choose another spot."
    assert placed == [(3, 0, .5), (0, 0, .5)]


def test_overlap_uses_both_object_radii():
    assert placement_error(1, 0, .4, 5.35, [(0, 0, .8)]) == "Two objects overlap. Choose another spot."


def test_edge_error_precedes_overlap_error():
    assert placement_error(5, 0, .5, 5.35, [(5, 0, .5)]) == "An object is too close to the island edge."


def test_placement_rejects_non_numeric_coordinate():
    with pytest.raises(TypeError):
        placement_error(None, 0, .4, 4.4, [])


def test_placement_rejects_malformed_existing_object():
    with pytest.raises(ValueError):
        placement_error(0, 0, .4, 4.4, [(0, 0)])
