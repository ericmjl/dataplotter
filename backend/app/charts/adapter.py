"""Chart adapter - builds Plotly specs from table data and analysis results."""

from __future__ import annotations

import math
from typing import Any

import numpy as np

from backend.app.models import AnalysisResult


def _col_means(rows: list[list[float | None]], n_cols: int) -> list[float]:
    result = []
    for c in range(n_cols):
        vals = [r[c] for r in rows if r[c] is not None and not math.isnan(r[c])]
        result.append(float(np.mean(vals)) if vals else 0.0)
    return result


def _col_sem(rows: list[list[float | None]], n_cols: int) -> list[float]:
    result = []
    for c in range(n_cols):
        vals = [r[c] for r in rows if r[c] is not None and not math.isnan(r[c])]
        if len(vals) < 2:
            result.append(0.0)
        else:
            mean = float(np.mean(vals))
            variance = sum((v - mean) ** 2 for v in vals) / (len(vals) - 1)
            result.append(math.sqrt(variance) / math.sqrt(len(vals)))
    return result


def _col_sd(rows: list[list[float | None]], n_cols: int) -> list[float]:
    result = []
    for c in range(n_cols):
        vals = [r[c] for r in rows if r[c] is not None and not math.isnan(r[c])]
        if len(vals) < 2:
            result.append(0.0)
        else:
            mean = float(np.mean(vals))
            result.append(math.sqrt(sum((v - mean) ** 2 for v in vals) / (len(vals) - 1)))
    return result


JITTER_WIDTH = 0.22


def _jitter(step: int) -> float:
    t = (step % 11) / 11
    return (t - 0.5) * 2 * JITTER_WIDTH


def _cell_mean(cell: list[float | None]) -> float:
    vals = [v for v in cell if v is not None and not math.isnan(v)]
    return float(np.mean(vals)) if vals else 0.0


def build_plotly_spec(
    graph_type: str,
    table_data: Any,
    analysis_result: AnalysisResult | None,
    graph_options: dict,
) -> dict[str, Any]:
    error_bar_type = graph_options.get("errorBarType", "sem")

    if hasattr(table_data, "counts"):
        return {"traces": []}

    if hasattr(table_data, "times"):
        if graph_type == "survival":
            from backend.app.engine.kaplan_meier import run_kaplan_meier

            km_result = analysis_result
            if km_result is None or km_result.type != "kaplan_meier":
                km_result = run_kaplan_meier(table_data)

            traces = []
            for curve in km_result.curves:
                traces.append(
                    {
                        "x": curve.time,
                        "y": curve.survival,
                        "type": "scatter",
                        "mode": "lines",
                        "name": curve.group,
                        "line": {"shape": "hv"},
                    }
                )
            return {"traces": traces}
        return {"traces": []}

    if hasattr(table_data, "values") and hasattr(table_data, "labels"):
        if graph_type == "pie":
            if analysis_result and analysis_result.type == "fraction_of_total":
                labels = [f.label for f in analysis_result.fractions]
                values = [f.fraction for f in analysis_result.fractions]
            else:
                labels = table_data.labels
                values = table_data.values
            return {"traces": [{"type": "pie", "labels": labels, "values": values}]}
        return {"traces": []}

    if graph_type == "groupedBar" and hasattr(table_data, "cell_values"):
        row_labels = table_data.row_group_labels
        col_labels = table_data.col_group_labels
        x_numeric = list(range(len(col_labels)))

        traces = []
        for i, row_label in enumerate(row_labels):
            y = [_cell_mean(table_data.cell_values[i][j]) for j in range(len(col_labels))]
            traces.append(
                {
                    "type": "bar",
                    "x": x_numeric,
                    "y": y,
                    "name": row_label,
                }
            )

        return {
            "traces": traces,
            "layout": {
                "xaxis": {
                    "type": "linear",
                    "tickvals": x_numeric,
                    "ticktext": col_labels,
                },
            },
        }

    if (
        graph_type == "bar"
        and hasattr(table_data, "column_labels")
        and not hasattr(table_data, "cell_values")
    ):
        labels = table_data.column_labels
        rows = table_data.rows
        group_labels = getattr(table_data, "group_labels", None)
        group_for_column = getattr(table_data, "group_for_column", None)

        has_groups = group_labels and group_for_column and len(group_for_column) == len(labels)

        if has_groups:
            x_labels = group_labels
            n_bars = len(group_labels)
            x_numeric = list(range(n_bars))

            group_means = []
            group_sem = []

            for g in range(len(group_labels)):
                vals = []
                for r in rows:
                    for c, grp_idx in enumerate(group_for_column):
                        if grp_idx == g:
                            v = r[c]
                            if v is not None and not math.isnan(v):
                                vals.append(v)

                if vals:
                    mean = float(np.mean(vals))
                    group_means.append(mean)
                    if len(vals) >= 2:
                        variance = sum((v - mean) ** 2 for v in vals) / (len(vals) - 1)
                        group_sem.append(math.sqrt(variance) / math.sqrt(len(vals)))
                    else:
                        group_sem.append(0.0)
                else:
                    group_means.append(0.0)
                    group_sem.append(0.0)

            y = group_means
            error_array = group_sem if error_bar_type != "none" else None

            hovertext = []
            for i, label in enumerate(x_labels):
                val = y[i]
                err = error_array[i] if error_array else None
                if err is not None and err > 0:
                    hovertext.append(f"{label}: {val:.2f} +/- {err:.2f}")
                else:
                    hovertext.append(f"{label}: {val:.2f}")

            bar_trace = {
                "x": x_numeric,
                "y": y,
                "type": "bar",
                "hovertext": hovertext,
                "name": "Mean",
            }
            if error_array:
                bar_trace["error_y"] = {"type": "data", "array": error_array, "visible": True}

            scatter_x = []
            scatter_y = []
            step = 0
            for g in range(len(group_labels)):
                for r in rows:
                    for c, grp_idx in enumerate(group_for_column):
                        if grp_idx == g:
                            v = r[c]
                            if v is not None and not math.isnan(v):
                                scatter_x.append(g + _jitter(step))
                                scatter_y.append(v)
                                step += 1

            scatter_trace = {
                "x": scatter_x,
                "y": scatter_y,
                "type": "scatter",
                "mode": "markers",
                "name": "Data points",
                "marker": {"size": 6, "opacity": 0.85},
            }

            return {
                "traces": [bar_trace, scatter_trace],
                "layout": {
                    "xaxis": {
                        "type": "linear",
                        "tickvals": x_numeric,
                        "ticktext": x_labels,
                        "range": [-0.6, n_bars - 0.4],
                    },
                },
            }

        n_bars = len(labels)
        x_numeric = list(range(n_bars))

        if (
            analysis_result
            and analysis_result.type == "descriptive"
            and len(analysis_result.by_column) == n_bars
        ):
            y = [col.mean for col in analysis_result.by_column]
            if error_bar_type != "none":
                if error_bar_type == "sem":
                    error_array = [col.sem for col in analysis_result.by_column]
                elif error_bar_type == "sd":
                    error_array = [col.sd for col in analysis_result.by_column]
                else:
                    error_array = [1.96 * col.sem for col in analysis_result.by_column]
            else:
                error_array = None
        else:
            y = _col_means(rows, len(labels))
            if error_bar_type != "none":
                error_array = (
                    _col_sem(rows, len(labels))
                    if error_bar_type == "sem"
                    else _col_sd(rows, len(labels))
                )
            else:
                error_array = None

        hovertext = []
        for i, label in enumerate(labels):
            val = y[i]
            err = error_array[i] if error_array and i < len(error_array) else None
            if err is not None and err > 0:
                hovertext.append(f"{label}: {val:.2f} +/- {err:.2f}")
            else:
                hovertext.append(f"{label}: {val:.2f}")

        bar_trace = {
            "x": x_numeric,
            "y": y,
            "type": "bar",
            "hovertext": hovertext,
            "name": "Mean",
        }
        if error_array:
            bar_trace["error_y"] = {"type": "data", "array": error_array, "visible": True}

        scatter_x = []
        scatter_y = []
        step = 0
        for c in range(len(labels)):
            for r in rows:
                v = r[c]
                if v is not None and not math.isnan(v):
                    scatter_x.append(c + _jitter(step))
                    scatter_y.append(v)
                    step += 1

        scatter_trace = {
            "x": scatter_x,
            "y": scatter_y,
            "type": "scatter",
            "mode": "markers",
            "name": "Data points",
            "marker": {"size": 6, "opacity": 0.85},
        }

        return {
            "traces": [bar_trace, scatter_trace],
            "layout": {
                "xaxis": {
                    "type": "linear",
                    "tickvals": x_numeric,
                    "ticktext": labels,
                    "range": [-0.6, n_bars - 0.4],
                },
            },
        }

    if graph_type in ("scatter", "line", "scatterLine") and hasattr(table_data, "x"):
        traces = []
        x_raw = table_data.x
        x = [v if v is not None and not math.isnan(v) else 0.0 for v in x_raw]
        y2_index = graph_options.get("yAxis2SeriesIndex")

        for s in range(len(table_data.ys)):
            y = [
                v if v is not None and not math.isnan(v) else 0.0 for v in (table_data.ys[s] or [])
            ]
            if graph_type == "scatter":
                mode = "markers"
            elif graph_type == "line":
                mode = "lines"
            else:
                mode = "lines+markers"

            trace = {
                "x": x,
                "y": y,
                "type": "scatter",
                "mode": mode,
                "name": table_data.y_labels[s] if s < len(table_data.y_labels) else f"Y{s + 1}",
            }
            if y2_index == s:
                trace["yaxis"] = "y2"
            traces.append(trace)

        if analysis_result and analysis_result.type == "linear_regression":
            slope = analysis_result.slope
            intercept = analysis_result.intercept
            curve = analysis_result.curve

            if curve and curve.y_lower and curve.y_upper and len(curve.x) > 0:
                band_x = list(curve.x) + list(reversed(curve.x))
                band_y = list(curve.y_upper) + list(reversed(curve.y_lower))
                traces.append(
                    {
                        "x": band_x,
                        "y": band_y,
                        "type": "scatter",
                        "mode": "lines",
                        "name": "95% CrI",
                        "fill": "toself",
                        "fillcolor": "rgba(100, 150, 255, 0.2)",
                        "line": {"width": 0},
                    }
                )
                traces.append(
                    {
                        "x": curve.x,
                        "y": curve.y,
                        "type": "scatter",
                        "mode": "lines",
                        "name": "Fit",
                    }
                )
            else:
                x_min = min(x) if x else 0
                x_max = max(x) if x else 1
                fit_x = [x_min, x_max]
                fit_y = [slope * xi + intercept for xi in fit_x]
                traces.append(
                    {
                        "x": fit_x,
                        "y": fit_y,
                        "type": "scatter",
                        "mode": "lines",
                        "name": "Fit",
                    }
                )

        if graph_options.get("showLineOfIdentity") and x:
            x_min = min(x)
            x_max = max(x)
            span = x_max - x_min or 1
            lo = x_min - span * 0.05
            hi = x_max + span * 0.05
            traces.append(
                {
                    "x": [lo, hi],
                    "y": [lo, hi],
                    "type": "scatter",
                    "mode": "lines",
                    "name": "Line of identity (X=Y)",
                }
            )

        return {"traces": traces}

    if (
        graph_type == "doseResponse"
        and analysis_result
        and analysis_result.type == "dose_response_4pl"
    ):
        curve = analysis_result.curve
        x_raw = table_data.x
        x = [v if v is not None and not math.isnan(v) else 0.0 for v in x_raw]
        y = [v if v is not None and not math.isnan(v) else 0.0 for v in (table_data.ys[0] or [])]

        traces = [
            {
                "x": x,
                "y": y,
                "type": "scatter",
                "mode": "markers",
                "name": table_data.y_labels[0] if table_data.y_labels else "Y",
            }
        ]

        if curve.y_lower and curve.y_upper and len(curve.x) > 0:
            band_x = list(curve.x) + list(reversed(curve.x))
            band_y = list(curve.y_upper) + list(reversed(curve.y_lower))
            traces.append(
                {
                    "x": band_x,
                    "y": band_y,
                    "type": "scatter",
                    "mode": "lines",
                    "name": "95% CrI",
                    "fill": "toself",
                    "fillcolor": "rgba(100, 150, 255, 0.2)",
                    "line": {"width": 0},
                }
            )

        traces.append(
            {
                "x": curve.x,
                "y": curve.y,
                "type": "scatter",
                "mode": "lines",
                "name": "4PL fit",
            }
        )

        return {"traces": traces}

    if graph_type == "doseResponse" and hasattr(table_data, "x"):
        x = [v if v is not None and not math.isnan(v) else 0.0 for v in table_data.x]
        y = [v if v is not None and not math.isnan(v) else 0.0 for v in (table_data.ys[0] or [])]
        return {
            "traces": [
                {
                    "x": x,
                    "y": y,
                    "type": "scatter",
                    "mode": "markers",
                    "name": table_data.y_labels[0] if table_data.y_labels else "Y",
                }
            ]
        }

    return {"traces": []}
