"""Fisher's exact test."""

from __future__ import annotations

import numpy as np
from scipy import stats

from backend.app.models import FisherExactResult


def run_fisher_exact(
    counts: list[list[int]],
) -> FisherExactResult:
    """Run Fisher's exact test on a 2x2 contingency table.

    Args:
        counts: 2x2 matrix of counts [[a, b], [c, d]]

    Returns:
        FisherExactResult with p-value and odds ratio
    """
    table = np.array(counts, dtype=int)
    odds_ratio, p_value = stats.fisher_exact(table)

    return FisherExactResult(
        type="fisher_exact",
        pValue=float(p_value),
        oddsRatio=float(odds_ratio),
    )
