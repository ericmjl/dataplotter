"""ROC AUC analysis."""

from __future__ import annotations

import numpy as np
from sklearn.metrics import roc_auc_score, roc_curve
from scipy import stats

from backend.app.models import RocAucResult


def run_roc_auc(
    labels: tuple[str, str],
    rows: list[list[float | None]],
    indices: tuple[int, int],
) -> RocAucResult:
    """Run ROC AUC analysis.

    Args:
        labels: Tuple of (score_label, outcome_label)
        rows: Data rows
        indices: Column indices for (score, binary outcome)

    Returns:
        RocAucResult with AUC and confidence interval
    """
    i_score, i_outcome = indices

    scores = []
    outcomes = []
    for row in rows:
        score = row[i_score]
        outcome = row[i_outcome]
        if score is not None and outcome is not None:
            if not np.isnan(score) and not np.isnan(outcome):
                scores.append(score)
                outcomes.append(int(outcome))

    if len(scores) < 10:
        raise ValueError("ROC AUC requires at least 10 observations")

    scores = np.array(scores)
    outcomes = np.array(outcomes)

    auc = roc_auc_score(outcomes, scores)

    n_pos = np.sum(outcomes == 1)
    n_neg = np.sum(outcomes == 0)

    if n_pos > 0 and n_neg > 0:
        se = np.sqrt(auc * (1 - auc) / min(n_pos, n_neg))
        ci_lower = max(0, auc - 1.96 * se)
        ci_upper = min(1, auc + 1.96 * se)
    else:
        ci_lower = None
        ci_upper = None

    return RocAucResult(
        type="roc_auc",
        auc=float(auc),
        ciLower=ci_lower,
        ciUpper=ci_upper,
    )
