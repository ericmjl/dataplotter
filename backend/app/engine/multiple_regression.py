"""Multiple regression analysis."""

from __future__ import annotations

import numpy as np
import pandas as pd
import statsmodels.api as sm

from backend.app.models import MultipleRegressionResult


def run_multiple_regression(
    labels: list[str],
    rows: list[list[float | None]],
    y_variable_label: str | None = None,
) -> MultipleRegressionResult:
    """Run multiple linear regression.

    Args:
        labels: Variable labels
        rows: Data rows
        y_variable_label: Name of the dependent variable (defaults to last)

    Returns:
        MultipleRegressionResult with coefficients and statistics
    """
    if not labels or not rows:
        raise ValueError("Multiple regression requires data")

    data = []
    for row in rows:
        if all(v is not None and not np.isnan(v) for v in row):
            data.append(row)

    if len(data) < len(labels) + 1:
        raise ValueError("Multiple regression requires more observations than variables")

    df = pd.DataFrame(data, columns=labels)

    if y_variable_label and y_variable_label in labels:
        y_col = y_variable_label
    else:
        y_col = labels[-1]

    x_cols = [l for l in labels if l != y_col]

    X = df[x_cols]
    X = sm.add_constant(X)
    y = df[y_col]

    model = sm.OLS(y, X).fit()

    coefficients = {col: float(model.params[col]) for col in x_cols}
    coef_p_values = {col: float(model.pvalues[col]) for col in x_cols}

    return MultipleRegressionResult(
        type="multiple_regression",
        coefficients=coefficients,
        intercept=float(model.params["const"]),
        rSquared=float(model.rsquared),
        adjRSquared=float(model.rsquared_adj),
        fStat=float(model.fvalue),
        p=float(model.f_pvalue),
        coefPValues=coef_p_values,
    )
