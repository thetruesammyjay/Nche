def anomaly_score(features: dict[str, float]) -> float:
    """Placeholder boundary for the behaviour-only anomaly model."""
    return min(features.get("event_count", 0) / 5, 1.0)
