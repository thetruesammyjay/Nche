def binary_metrics(true_positive: int, false_positive: int, false_negative: int, true_negative: int) -> dict[str, float]:
    precision = true_positive / max(true_positive + false_positive, 1)
    recall = true_positive / max(true_positive + false_negative, 1)
    f1 = 2 * precision * recall / max(precision + recall, 1e-9)
    false_positive_rate = false_positive / max(false_positive + true_negative, 1)
    return {"precision": precision, "recall": recall, "f1": f1, "false_positive_rate": false_positive_rate}
