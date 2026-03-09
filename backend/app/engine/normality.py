"""Normality test."""

from __future__ import annotations

import numpy as np
from scipy import stats

from backend.app.models import NormalityTestResult


def run_normality_test(
    label: str,
    values: list[float],
) -> NormalityTestResult:
    """Run Shapiro-Wilk normality test.

    Args:
        label: Column label
        values: Values to test

    Returns:
        NormalityTestResult with W statistic and p-value
    """
    values = [v for v in values if v is not None and not np.isnan(v)]

    if len(values) < 3:
        raise ValueError("Normality test requires at least 3 values")

    if len(values) > 5000:
        values = list(np.random.choice(values, 5000, replace=False))

    w_stat, p_value = stats.shapiro(values)
    is_normal = p_value > 0.05

    return NormalityTestResult(
        type="normality_test",
        label=label,
        w=float(w_stat),
        p=float(p_value),
        isNormal=is_normal,
    )
