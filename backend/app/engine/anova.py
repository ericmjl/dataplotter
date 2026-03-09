"""One-way ANOVA analysis."""

from __future__ import annotations

import math

import numpy as np
from scipy import stats

from backend.app.models import OneWayAnovaResult


def run_one_way_anova(
    labels: list[str],
    rows: list[list[float | None]],
) -> OneWayAnovaResult:
    """Run one-way ANOVA.

    Args:
        labels: Column/group labels
        rows: Data rows

    Returns:
        OneWayAnovaResult with F-statistic and p-value
    """
    groups = []
    group_means = []
    n_cols = len(labels)

    for col_idx in range(n_cols):
        values = [r[col_idx] for r in rows if r[col_idx] is not None and not math.isnan(r[col_idx])]
        if values:
            groups.append(values)
            group_means.append((labels[col_idx], float(np.mean(values))))

    if len(groups) < 2:
        raise ValueError("ANOVA requires at least 2 groups with data")

    f_stat, p_value = stats.f_oneway(*groups)

    all_values = [v for g in groups for v in g]
    grand_mean = np.mean(all_values)
    n_total = len(all_values)
    k = len(groups)

    ss_between = sum(len(g) * (np.mean(g) - grand_mean) ** 2 for g in groups)
    ss_within = sum(sum((x - np.mean(g)) ** 2 for x in g) for g in groups)

    df_between = k - 1
    df_within = n_total - k

    return OneWayAnovaResult(
        type="one_way_anova",
        groupMeans=group_means,
        f=float(f_stat),
        p=float(p_value),
        dfBetween=float(df_between),
        dfWithin=float(df_within),
        ssBetween=float(ss_between),
        ssWithin=float(ss_within),
    )
