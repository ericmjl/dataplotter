"""T-test analyses (unpaired and paired)."""

from __future__ import annotations

import math

import numpy as np
from scipy import stats

from backend.app.models import TTestResult


def _cohens_d(group1: list[float], group2: list[float]) -> float:
    """Compute Cohen's d effect size."""
    n1, n2 = len(group1), len(group2)
    var1 = np.var(group1, ddof=1)
    var2 = np.var(group2, ddof=1)
    pooled_std = math.sqrt(((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2))
    if pooled_std == 0:
        return 0.0
    return (np.mean(group1) - np.mean(group2)) / pooled_std


def run_unpaired_ttest(
    labels: tuple[str, str],
    rows: list[list[float | None]],
    indices: tuple[int, int],
) -> TTestResult:
    """Run unpaired (independent samples) t-test.

    Args:
        labels: Tuple of (label_a, label_b)
        rows: Data rows
        indices: Column indices for the two groups

    Returns:
        TTestResult with test statistics
    """
    i1, i2 = indices
    group1 = [r[i1] for r in rows if r[i1] is not None and not math.isnan(r[i1])]
    group2 = [r[i2] for r in rows if r[i2] is not None and not math.isnan(r[i2])]

    if not group1 or not group2:
        raise ValueError("Both groups must have at least one value")

    mean_a = float(np.mean(group1))
    mean_b = float(np.mean(group2))
    mean_diff = mean_a - mean_b

    t_stat, p_value = stats.ttest_ind(group1, group2)
    df = len(group1) + len(group2) - 2

    sem_diff = math.sqrt(
        np.var(group1, ddof=1) / len(group1) + np.var(group2, ddof=1) / len(group2)
    )
    ci_margin = stats.t.ppf(0.975, df) * sem_diff
    ci_lower = mean_diff - ci_margin
    ci_upper = mean_diff + ci_margin

    return TTestResult(
        type="unpaired_ttest",
        labelA=labels[0],
        labelB=labels[1],
        meanA=mean_a,
        meanB=mean_b,
        meanDiff=mean_diff,
        t=float(t_stat),
        p=float(p_value),
        df=float(df),
        ciLower=ci_lower,
        ciUpper=ci_upper,
        cohensD=_cohens_d(group1, group2),
    )


def run_paired_ttest(
    labels: tuple[str, str],
    rows: list[list[float | None]],
    indices: tuple[int, int],
) -> TTestResult:
    """Run paired t-test.

    Args:
        labels: Tuple of (label_a, label_b)
        rows: Data rows
        indices: Column indices for the two conditions

    Returns:
        TTestResult with test statistics
    """
    i1, i2 = indices
    pairs = [
        (r[i1], r[i2])
        for r in rows
        if r[i1] is not None
        and r[i2] is not None
        and not math.isnan(r[i1])
        and not math.isnan(r[i2])
    ]

    if len(pairs) < 2:
        raise ValueError("Need at least 2 paired observations")

    group1 = [p[0] for p in pairs]
    group2 = [p[1] for p in pairs]
    diffs = [p[0] - p[1] for p in pairs]

    mean_a = float(np.mean(group1))
    mean_b = float(np.mean(group2))
    mean_diff = float(np.mean(diffs))

    t_stat, p_value = stats.ttest_rel(group1, group2)
    df = len(pairs) - 1

    sem_diff = stats.sem(diffs)
    ci_margin = stats.t.ppf(0.975, df) * sem_diff
    ci_lower = mean_diff - ci_margin
    ci_upper = mean_diff + ci_margin

    return TTestResult(
        type="paired_ttest",
        labelA=labels[0],
        labelB=labels[1],
        meanA=mean_a,
        meanB=mean_b,
        meanDiff=mean_diff,
        t=float(t_stat),
        p=float(p_value),
        df=float(df),
        ciLower=ci_lower,
        ciUpper=ci_upper,
        cohensD=_cohens_d(group1, group2),
    )
