"""Mann-Whitney U test."""

from __future__ import annotations

import numpy as np
from scipy import stats

from backend.app.models import MannWhitneyResult


def run_mann_whitney(
    labels: tuple[str, str],
    rows: list[list[float | None]],
    indices: tuple[int, int],
) -> MannWhitneyResult:
    """Run Mann-Whitney U test (Wilcoxon rank-sum test).

    Args:
        labels: Tuple of (label_a, label_b)
        rows: Data rows
        indices: Column indices for the two groups

    Returns:
        MannWhitneyResult with U statistic and p-value
    """
    i1, i2 = indices
    group1 = [r[i1] for r in rows if r[i1] is not None and not np.isnan(r[i1])]
    group2 = [r[i2] for r in rows if r[i2] is not None and not np.isnan(r[i2])]

    if not group1 or not group2:
        raise ValueError("Both groups must have at least one value")

    u_stat, p_value = stats.mannwhitneyu(group1, group2, alternative="two-sided")

    n1, n2 = len(group1), len(group2)
    u_mean = n1 * n2 / 2
    u_std = np.sqrt(n1 * n2 * (n1 + n2 + 1) / 12)
    z = (u_stat - u_mean) / u_std if u_std > 0 else 0.0

    return MannWhitneyResult(
        type="mann_whitney",
        labelA=labels[0],
        labelB=labels[1],
        u=float(u_stat),
        p=float(p_value),
        z=float(z),
    )
