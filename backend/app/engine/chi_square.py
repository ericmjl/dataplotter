"""Chi-square test."""

from __future__ import annotations

import numpy as np
from scipy import stats

from backend.app.models import ChiSquareResult


def run_chi_square(
    row_labels: list[str],
    col_labels: list[str],
    counts: list[list[int]],
) -> ChiSquareResult:
    """Run chi-square test of independence.

    Args:
        row_labels: Row category labels
        col_labels: Column category labels
        counts: Observed counts matrix

    Returns:
        ChiSquareResult with chi2 statistic and p-value
    """
    observed = np.array(counts, dtype=float)
    chi2, p, dof, expected = stats.chi2_contingency(observed)

    return ChiSquareResult(
        type="chi_square",
        chi2=float(chi2),
        p=float(p),
        df=int(dof),
        expected=expected.tolist(),
    )
