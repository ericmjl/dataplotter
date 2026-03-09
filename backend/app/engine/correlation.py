"""Correlation analysis."""

from __future__ import annotations

import numpy as np
from scipy import stats

from backend.app.models import CorrelationResult


def run_correlation(
    labels: list[str],
    rows: list[list[float | None]],
) -> CorrelationResult:
    """Compute correlation matrix.

    Args:
        labels: Variable labels
        rows: Data rows (one row per observation, one column per variable)

    Returns:
        CorrelationResult with correlation matrix
    """
    n_vars = len(labels)

    cols = []
    for col_idx in range(n_vars):
        values = [r[col_idx] for r in rows if r[col_idx] is not None and not np.isnan(r[col_idx])]
        cols.append(values)

    min_len = min(len(c) for c in cols) if cols else 0
    if min_len < 3:
        raise ValueError("Correlation requires at least 3 complete observations")

    data = np.array(
        [
            [r[col_idx] if r[col_idx] is not None else np.nan for col_idx in range(n_vars)]
            for r in rows
        ]
    )

    mask = ~np.isnan(data).any(axis=1)
    clean_data = data[mask]

    if len(clean_data) < 3:
        raise ValueError("Correlation requires at least 3 complete observations")

    corr_matrix = np.corrcoef(clean_data.T)

    return CorrelationResult(
        type="correlation",
        matrix=corr_matrix.tolist(),
        labels=labels,
        method="pearson",
    )
