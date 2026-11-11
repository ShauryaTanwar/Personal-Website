"""Pure game rules extracted from the API without changing their behavior."""


def size_for(minutes):
    return 3 if minutes > 600 else 2 if minutes >= 300 else 1 if minutes >= 120 else 0


def heartbeat_expired(current_time, last_heartbeat, grace):
    return current_time - last_heartbeat > grace


def placement_error(px, pz, item_radius, island_radius, placed):
    """Return the original edge/overlap error, or None for valid geometry.

    Coordinates are world coordinates. Each placed entry is (x, z, radius).
    Input type and rotation checks remain in the API before this rule is called.
    """
    if (px * px + pz * pz) ** .5 + item_radius > island_radius - .35:
        return "An object is too close to the island edge."
    if any(((px - ox) ** 2 + (pz - oz) ** 2) ** .5 < item_radius + other - .08 for ox, oz, other in placed):
        return "Two objects overlap. Choose another spot."
    return None
