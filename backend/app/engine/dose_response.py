"""4-Parameter Logistic (4PL) dose-response analysis."""

from __future__ import annotations

import numpy as np
from scipy.optimize import curve_fit
from scipy import stats

from backend.app.models import DoseResponse4plResult, CurvePoint


def _four_pl(x: np.ndarray, bottom: float, top: float, ec50: float, hill: float) -> np.ndarray:
    """4-parameter logistic function."""
    return bottom + (top - bottom) / (1 + (x / ec50) ** hill)


def run_dose_response_4pl(
    x: list[float | None],
    y: list[float | None],
    log_x: bool = False,
) -> DoseResponse4plResult:
    """Run 4PL dose-response curve fitting.

    Args:
        x: Dose/concentration values
        y: Response values
        log_x: Whether to log-transform x values

    Returns:
        DoseResponse4plResult with parameters and fitted curve
    """
    pairs = [(xi, yi) for xi, yi in zip(x, y) if xi is not None and yi is not None and xi > 0]

    if len(pairs) < 4:
        raise ValueError("4PL fitting requires at least 4 data points with positive x values")

    x_arr = np.array([p[0] for p in pairs])
    y_arr = np.array([p[1] for p in pairs])

    if log_x:
        x_fit = np.log10(x_arr)
    else:
        x_fit = x_arr

    y_min, y_max = np.min(y_arr), np.max(y_arr)
    x_median = np.median(x_fit)

    initial_guess = [y_min, y_max, x_median, 1.0]
    bounds = (
        [y_min - abs(y_min), y_min - abs(y_min), 0, -10],
        [y_max + abs(y_max), y_max + abs(y_max), np.max(x_fit) * 10, 10],
    )

    try:
        popt, _ = curve_fit(
            _four_pl,
            x_fit,
            y_arr,
            p0=initial_guess,
            bounds=bounds,
            maxfev=10000,
        )
        bottom, top, ec50, hill_slope = popt
    except Exception as e:
        raise ValueError(f"4PL curve fitting failed: {e}") from e

    y_pred = _four_pl(x_fit, bottom, top, ec50, hill_slope)
    ss_res = np.sum((y_arr - y_pred) ** 2)
    ss_tot = np.sum((y_arr - np.mean(y_arr)) ** 2)
    r_squared = 1 - ss_res / ss_tot if ss_tot > 0 else 0

    x_min, x_max = np.min(x_fit), np.max(x_fit)
    curve_x = np.logspace(np.log10(x_min * 0.1), np.log10(x_max * 10), 100)
    curve_y = _four_pl(curve_x, bottom, top, ec50, hill_slope)

    if log_x:
        curve_x_display = 10**curve_x
    else:
        curve_x_display = curve_x

    curve = CurvePoint(
        x=curve_x_display.tolist(),
        y=curve_y.tolist(),
        yLower=None,
        yUpper=None,
    )

    return DoseResponse4plResult(
        type="dose_response_4pl",
        bottom=float(bottom),
        top=float(top),
        ec50=float(ec50),
        hillSlope=float(hill_slope),
        curve=curve,
        rSquared=float(r_squared),
    )
