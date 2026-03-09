"""Linear regression analysis."""

from __future__ import annotations

import math

import numpy as np
from scipy import stats

from backend.app.models import LinearRegressionResult, CurvePoint


def run_linear_regression(
    x: list[float | None],
    y: list[float | None],
) -> LinearRegressionResult:
    """Run simple linear regression.

    Args:
        x: X values
        y: Y values

    Returns:
        LinearRegressionResult with slope, intercept, and fit statistics
    """
    pairs = [(xi, yi) for xi, yi in zip(x, y) if xi is not None and yi is not None]

    if len(pairs) < 3:
        raise ValueError("Linear regression requires at least 3 data points")

    x_arr = np.array([p[0] for p in pairs])
    y_arr = np.array([p[1] for p in pairs])

    n = len(pairs)

    slope, intercept, r_value, p_value, std_err = stats.linregress(x_arr, y_arr)
    r_squared = r_value**2

    x_mean = np.mean(x_arr)
    ss_x = np.sum((x_arr - x_mean) ** 2)
    se_slope = std_err

    t_crit = stats.t.ppf(0.975, n - 2)
    slope_ci_lower = slope - t_crit * se_slope
    slope_ci_upper = slope + t_crit * se_slope

    y_pred = slope * x_arr + intercept
    mse = np.sum((y_arr - y_pred) ** 2) / (n - 2)
    se_intercept = np.sqrt(mse * (1 / n + x_mean**2 / ss_x)) if ss_x > 0 else 0

    intercept_ci_lower = intercept - t_crit * se_intercept
    intercept_ci_upper = intercept + t_crit * se_intercept

    x_min, x_max = np.min(x_arr), np.max(x_arr)
    x_range = x_max - x_min
    x_pad = x_range * 0.05 if x_range > 0 else 1

    curve_x = np.linspace(x_min - x_pad, x_max + x_pad, 100)
    curve_y = slope * curve_x + intercept

    se_pred = np.sqrt(mse * (1 / n + (curve_x - x_mean) ** 2 / ss_x)) if ss_x > 0 else np.zeros(100)
    y_lower = curve_y - t_crit * se_pred
    y_upper = curve_y + t_crit * se_pred

    curve = CurvePoint(
        x=curve_x.tolist(),
        y=curve_y.tolist(),
        yLower=y_lower.tolist(),
        yUpper=y_upper.tolist(),
    )

    return LinearRegressionResult(
        type="linear_regression",
        slope=float(slope),
        intercept=float(intercept),
        rSquared=float(r_squared),
        p=float(p_value),
        slopeCiLower=float(slope_ci_lower),
        slopeCiUpper=float(slope_ci_upper),
        interceptCiLower=float(intercept_ci_lower),
        interceptCiUpper=float(intercept_ci_upper),
        curve=curve,
    )
