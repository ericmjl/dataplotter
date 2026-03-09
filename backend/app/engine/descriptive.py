"""Descriptive statistics analysis."""

from __future__ import annotations

import math
from typing import Sequence

import numpy as np
from scipy import stats

from backend.app.models import DescriptiveResult, DescriptiveColumnStats


def _compute_stats(values: list[float]) -> dict:
    """Compute descriptive statistics for a list of values."""
    arr = np.array(values)
    n = len(arr)
    mean = float(np.mean(arr))
    sem = float(stats.sem(arr)) if n > 1 else 0.0
    sd = float(np.std(arr, ddof=1)) if n > 1 else 0.0
    median = float(np.median(arr))
    min_val = float(np.min(arr))
    max_val = float(np.max(arr))
    q1 = float(np.percentile(arr, 25))
    q3 = float(np.percentile(arr, 75))
    ci = stats.t.interval(0.95, n - 1, loc=mean, scale=sem) if n > 1 else (mean, mean)

    return {
        "n": n,
        "mean": mean,
        "sem": sem,
        "sd": sd,
        "median": median,
        "min": min_val,
        "max": max_val,
        "q1": q1,
        "q3": q3,
        "ci_lower": ci[0],
        "ci_upper": ci[1],
    }


def _add_bayesian_fields(stats_dict: dict) -> dict:
    """Add Bayesian-style credible interval fields using conjugate Normal-Normal.

    Assumes weak prior: prior mean = sample mean, prior precision -> 0.
    Posterior for mean given known variance uses sample mean with adjusted CI.
    """
    n = stats_dict["n"]
    mean = stats_dict["mean"]
    sd = stats_dict["sd"]

    if n > 1 and sd > 0:
        z = 1.96
        mean_sd = sd / math.sqrt(n)
        stats_dict["mean_cr_i_lower"] = mean - z * mean_sd
        stats_dict["mean_cr_i_upper"] = mean + z * mean_sd
        stats_dict["mean_sd"] = mean_sd
    else:
        stats_dict["mean_cr_i_lower"] = mean
        stats_dict["mean_cr_i_upper"] = mean
        stats_dict["mean_sd"] = 0.0

    return stats_dict


def run_descriptive(
    labels: Sequence[str],
    rows: Sequence[Sequence[float | None]],
    group_labels: Sequence[str] | None = None,
    group_for_column: Sequence[int] | None = None,
) -> DescriptiveResult:
    """Run descriptive statistics on column data.

    Args:
        labels: Column labels
        rows: Data rows (each row is a list of values per column)
        group_labels: Optional group labels for grouping columns
        group_for_column: Group index for each column

    Returns:
        DescriptiveResult with statistics per column or group
    """
    n_cols = len(labels)

    if group_labels and group_for_column and len(group_for_column) == n_cols:
        by_group: dict[int, list[float]] = {}
        for g in range(len(group_labels)):
            by_group[g] = []

        for row in rows:
            for col_idx, val in enumerate(row):
                if val is not None and not math.isnan(val):
                    g = group_for_column[col_idx]
                    by_group[g].append(val)

        column_stats = []
        for g, label in enumerate(group_labels):
            values = by_group.get(g, [])
            if values:
                s = _compute_stats(values)
                s = _add_bayesian_fields(s)
                column_stats.append(
                    DescriptiveColumnStats(
                        label=label,
                        n=s["n"],
                        mean=s["mean"],
                        sem=s["sem"],
                        sd=s["sd"],
                        median=s["median"],
                        min_val=s["min"],
                        max_val=s["max"],
                        q1=s["q1"],
                        q3=s["q3"],
                        ci_lower=s["ci_lower"],
                        ci_upper=s["ci_upper"],
                        mean_cr_i_lower=s["mean_cr_i_lower"],
                        mean_cr_i_upper=s["mean_cr_i_upper"],
                        mean_sd=s["mean_sd"],
                    )
                )
    else:
        by_col: list[list[float]] = [[] for _ in range(n_cols)]
        for row in rows:
            for col_idx, val in enumerate(row):
                if val is not None and not math.isnan(val):
                    by_col[col_idx].append(val)

        column_stats = []
        for col_idx, label in enumerate(labels):
            values = by_col[col_idx]
            if values:
                s = _compute_stats(values)
                s = _add_bayesian_fields(s)
                column_stats.append(
                    DescriptiveColumnStats(
                        label=label,
                        n=s["n"],
                        mean=s["mean"],
                        sem=s["sem"],
                        sd=s["sd"],
                        median=s["median"],
                        min_val=s["min"],
                        max_val=s["max"],
                        q1=s["q1"],
                        q3=s["q3"],
                        ci_lower=s["ci_lower"],
                        ci_upper=s["ci_upper"],
                        mean_cr_i_lower=s["mean_cr_i_lower"],
                        mean_cr_i_upper=s["mean_cr_i_upper"],
                        mean_sd=s["mean_sd"],
                    )
                )

    return DescriptiveResult(type="descriptive", byColumn=column_stats)
