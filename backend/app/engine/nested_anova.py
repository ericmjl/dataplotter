"""Nested one-way ANOVA analysis."""

from __future__ import annotations

import numpy as np
from scipy import stats

from backend.app.models import NestedOneWayAnovaResult


def run_nested_one_way_anova(
    labels: list[str],
    rows: list[list[float | None]],
    group_labels: list[str],
    group_for_column: list[int],
) -> NestedOneWayAnovaResult:
    """Run nested one-way ANOVA.

    Args:
        labels: Subcolumn labels
        rows: Data rows
        group_labels: Group names
        group_for_column: Group index for each subcolumn

    Returns:
        NestedOneWayAnovaResult with test statistics
    """
    unique_groups = sorted(set(group_for_column))

    group_means = []
    group_means_list = []

    for g in unique_groups:
        subcols = [i for i, grp in enumerate(group_for_column) if grp == g]
        means = []

        for row in rows:
            vals = [row[i] for i in subcols if row[i] is not None and not np.isnan(row[i])]
            if vals:
                means.append(np.mean(vals))

        if means:
            group_means.append((group_labels[g], float(np.mean(means))))
            group_means_list.append(means)

    if len(group_means_list) < 2:
        raise ValueError("Nested ANOVA requires at least 2 groups with data")

    f_stat, p_value = stats.f_oneway(*group_means_list)

    n_total = sum(len(m) for m in group_means_list)
    k = len(group_means_list)
    df_between = k - 1
    df_within = n_total - k

    return NestedOneWayAnovaResult(
        type="nested_one_way_anova",
        groupMeans=group_means,
        f=float(f_stat),
        p=float(p_value),
        dfBetween=float(df_between),
        dfWithin=float(df_within),
    )
