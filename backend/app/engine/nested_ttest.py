"""Nested t-test analysis."""

from __future__ import annotations

import numpy as np
from scipy import stats

from backend.app.models import NestedTtestResult


def run_nested_ttest(
    labels: list[str],
    rows: list[list[float | None]],
    group_labels: tuple[str, str],
    group_for_column: list[int],
) -> NestedTtestResult:
    """Run nested t-test.

    Args:
        labels: Subcolumn labels
        rows: Data rows
        group_labels: Names of the two groups
        group_for_column: Group index for each subcolumn

    Returns:
        NestedTtestResult with test statistics
    """
    group_a_idx = 0
    group_b_idx = 1

    subcols_a = [i for i, g in enumerate(group_for_column) if g == group_a_idx]
    subcols_b = [i for i, g in enumerate(group_for_column) if g == group_b_idx]

    means_a = []
    means_b = []

    for row in rows:
        vals_a = [row[i] for i in subcols_a if row[i] is not None and not np.isnan(row[i])]
        vals_b = [row[i] for i in subcols_b if row[i] is not None and not np.isnan(row[i])]

        if vals_a:
            means_a.append(np.mean(vals_a))
        if vals_b:
            means_b.append(np.mean(vals_b))

    if len(means_a) < 2 or len(means_b) < 2:
        raise ValueError("Nested t-test requires at least 2 observations per group")

    mean_a = float(np.mean(means_a))
    mean_b = float(np.mean(means_b))

    t_stat, p_value = stats.ttest_ind(means_a, means_b)
    df = len(means_a) + len(means_b) - 2

    return NestedTtestResult(
        type="nested_ttest",
        groupA=group_labels[0],
        groupB=group_labels[1],
        meanA=mean_a,
        meanB=mean_b,
        t=float(t_stat),
        p=float(p_value),
        df=float(df),
    )
