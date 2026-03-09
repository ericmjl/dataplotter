"""Kruskal-Wallis H test."""

from __future__ import annotations

import numpy as np
from scipy import stats

from backend.app.models import KruskalWallisResult


def run_kruskal_wallis(
    labels: list[str],
    rows: list[list[float | None]],
) -> KruskalWallisResult:
    """Run Kruskal-Wallis H test.

    Args:
        labels: Column/group labels
        rows: Data rows

    Returns:
        KruskalWallisResult with H statistic and p-value
    """
    groups = []
    n_cols = len(labels)

    for col_idx in range(n_cols):
        values = [r[col_idx] for r in rows if r[col_idx] is not None and not np.isnan(r[col_idx])]
        if values:
            groups.append(values)

    if len(groups) < 2:
        raise ValueError("Kruskal-Wallis requires at least 2 groups with data")

    h_stat, p_value = stats.kruskal(*groups)
    df = len(groups) - 1

    return KruskalWallisResult(
        type="kruskal_wallis",
        h=float(h_stat),
        p=float(p_value),
        df=df,
    )
