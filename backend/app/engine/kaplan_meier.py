"""Kaplan-Meier survival analysis."""

from __future__ import annotations

import numpy as np
from lifelines import KaplanMeierFitter
from lifelines.statistics import multivariate_logrank_test

from backend.app.models import KaplanMeierResult, KaplanMeierCurve, SurvivalTableData


def run_kaplan_meier(
    data: SurvivalTableData,
) -> KaplanMeierResult:
    """Run Kaplan-Meier survival analysis.

    Args:
        data: Survival table data with times, events, and optional groups

    Returns:
        KaplanMeierResult with survival curves
    """
    times = np.array(data.times)
    events = np.array(data.events)
    groups = data.groups

    if groups:
        unique_groups = sorted(set(groups))
    else:
        unique_groups = ["All"]
        groups = ["All"] * len(times)

    curves = []
    median_survival = {}

    for group_name in unique_groups:
        mask = np.array([g == group_name for g in groups])
        group_times = times[mask]
        group_events = events[mask]

        if len(group_times) == 0:
            continue

        kmf = KaplanMeierFitter()
        kmf.fit(group_times, group_events)

        timeline = kmf.survival_function_.index.tolist()
        survival_probs = kmf.survival_function_["KM_estimate"].tolist()

        at_risk = []
        event_counts = []
        for t in timeline:
            at_risk.append(int(np.sum(group_times >= t)))
            event_counts.append(int(np.sum((group_times == t) & (group_events == 1))))

        median = kmf.median_survival_time_
        median_survival[group_name] = float(median) if not np.isnan(median) else None

        curves.append(
            KaplanMeierCurve(
                group=group_name,
                time=timeline,
                survival=survival_probs,
                atRisk=at_risk,
                events=event_counts,
            )
        )

    log_rank_p = None
    if len(unique_groups) > 1 and groups:
        try:
            results = multivariate_logrank_test(times, groups, events)
            log_rank_p = float(results.p_value)
        except Exception:
            pass

    return KaplanMeierResult(
        type="kaplan_meier",
        curves=curves,
        medianSurvival=median_survival,
        logRankP=log_rank_p,
    )
