"""Two-way ANOVA analysis."""

from __future__ import annotations

import numpy as np
import pandas as pd
import statsmodels.api as sm
from statsmodels.formula.api import ols

from backend.app.models import TwoWayAnovaResult


def run_two_way_anova(
    row_labels: list[str],
    col_labels: list[str],
    cell_values: list[list[list[float | None]]],
) -> TwoWayAnovaResult:
    """Run two-way ANOVA on grouped data.

    Args:
        row_labels: Row group labels
        col_labels: Column group labels
        cell_values: cell_values[row_idx][col_idx] = list of replicate values

    Returns:
        TwoWayAnovaResult with main effects and interaction
    """
    records = []
    for i, row_label in enumerate(row_labels):
        for j, col_label in enumerate(col_labels):
            for val in cell_values[i][j]:
                if val is not None and not np.isnan(val):
                    records.append(
                        {
                            "row": row_label,
                            "col": col_label,
                            "value": val,
                        }
                    )

    if len(records) < 4:
        raise ValueError("Two-way ANOVA requires sufficient data")

    df = pd.DataFrame(records)

    try:
        model = ols("value ~ C(row) + C(col) + C(row):C(col)", data=df).fit()
        anova_table = sm.stats.anova_lm(model, typ=2)

        row_f = float(anova_table.loc["C(row)", "F"])
        row_p = float(anova_table.loc["C(row)", "PR(>F)"])
        col_f = float(anova_table.loc["C(col)", "F"])
        col_p = float(anova_table.loc["C(col)", "PR(>F)"])

        if "C(row):C(col)" in anova_table.index:
            int_f = float(anova_table.loc["C(row):C(col)", "F"])
            int_p = float(anova_table.loc["C(row):C(col)", "PR(>F)"])
        else:
            int_f = None
            int_p = None

        return TwoWayAnovaResult(
            type="two_way_anova",
            rowFactorF=row_f,
            rowFactorP=row_p,
            colFactorF=col_f,
            colFactorP=col_p,
            interactionF=int_f,
            interactionP=int_p,
        )
    except Exception as e:
        raise ValueError(f"Two-way ANOVA failed: {e}") from e
