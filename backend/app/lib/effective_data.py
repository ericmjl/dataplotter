"""Effective table data resolver - handles raw vs transformed data."""

from __future__ import annotations

import math
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from backend.app.models import (
        ColumnTableData,
        XYTableData,
        DataTable,
        TableViewMode,
        ColumnTransformation,
    )


ALLOWED_FUNCTIONS = {
    "log10": lambda x: math.log10(x) if x > 0 else float("nan"),
    "log": lambda x: math.log(x) if x > 0 else float("nan"),
    "ln": lambda x: math.log(x) if x > 0 else float("nan"),
    "sqrt": lambda x: math.sqrt(x) if x >= 0 else float("nan"),
    "abs": abs,
    "exp": math.exp,
    "pow": pow,
    "square": lambda x: x * x,
    "negate": lambda x: -x,
    "reciprocal": lambda x: 1 / x if x != 0 else float("nan"),
}


def evaluate_equation(equation: str, value: float) -> float:
    """Safely evaluate a transformation equation.

    Args:
        equation: Transformation equation (e.g., "log10(y)")
        value: The input value (y)

    Returns:
        Transformed value

    Raises:
        ValueError: If equation is not allowed
    """
    equation = equation.strip().lower()

    if equation in ("y", "x"):
        return value

    for func_name, func in ALLOWED_FUNCTIONS.items():
        patterns = [
            f"{func_name}(y)",
            f"{func_name}(x)",
        ]
        if any(equation == p for p in patterns):
            return func(value)

    if equation.startswith("y * ") or equation.endswith(" * y"):
        try:
            multiplier = float(equation.replace("y", "").replace("*", "").strip())
            return value * multiplier
        except ValueError:
            pass

    if equation.startswith("y + ") or equation.endswith(" + y"):
        try:
            addend = float(equation.replace("y", "").replace("+", "").strip())
            return value + addend
        except ValueError:
            pass

    if equation.startswith("y - ") or equation.endswith(" - y"):
        try:
            subtrahend = float(equation.replace("y", "").replace("-", "").strip())
            return value - subtrahend
        except ValueError:
            pass

    if equation.startswith("y / ") or equation.endswith(" / y"):
        try:
            divisor = float(equation.replace("y", "").replace("/", "").strip())
            return value / divisor if divisor != 0 else float("nan")
        except ValueError:
            pass

    raise ValueError(f"Equation not allowed: {equation}")


def apply_column_transformations(
    data: ColumnTableData,
    transformations: list[ColumnTransformation],
) -> ColumnTableData:
    """Apply transformations to column table data."""
    new_rows = []
    trans_map = {t.column_key: t.equation for t in transformations}

    for row in data.rows:
        new_row = []
        for col_idx, val in enumerate(row):
            col_key = f"col-{col_idx}"
            if col_key in trans_map and val is not None:
                try:
                    new_val = evaluate_equation(trans_map[col_key], val)
                    new_row.append(new_val if math.isfinite(new_val) else None)
                except (ValueError, ZeroDivisionError):
                    new_row.append(None)
            else:
                new_row.append(val)
        new_rows.append(new_row)

    return ColumnTableData(
        columnLabels=data.column_labels,
        rows=new_rows,
        groupLabels=data.group_labels,
        groupForColumn=data.group_for_column,
    )


def apply_xy_transformations(
    data: XYTableData,
    transformations: list[ColumnTransformation],
) -> XYTableData:
    """Apply transformations to XY table data."""
    trans_map = {t.column_key: t.equation for t in transformations}

    new_x = []
    for idx, val in enumerate(data.x):
        if "x" in trans_map and val is not None:
            try:
                new_val = evaluate_equation(trans_map["x"], val)
                new_x.append(new_val if math.isfinite(new_val) else None)
            except (ValueError, ZeroDivisionError):
                new_x.append(None)
        else:
            new_x.append(val)

    new_ys = []
    for series_idx, y_series in enumerate(data.ys):
        col_key = f"y-{series_idx}"
        new_y = []
        for val in y_series:
            if col_key in trans_map and val is not None:
                try:
                    new_val = evaluate_equation(trans_map[col_key], val)
                    new_y.append(new_val if math.isfinite(new_val) else None)
                except (ValueError, ZeroDivisionError):
                    new_y.append(None)
            else:
                new_y.append(val)
        new_ys.append(new_y)

    return XYTableData(
        xLabel=data.x_label,
        yLabels=data.y_labels,
        x=new_x,
        ys=new_ys,
    )


def get_effective_table_data(
    table: DataTable,
    mode: TableViewMode | str = "raw",
):
    """Get effective table data based on view mode.

    Args:
        table: The data table
        mode: "raw" or "transformed"

    Returns:
        Table data (potentially transformed)
    """
    if isinstance(mode, str):
        mode = "raw" if mode == "raw" else "transformed"

    if mode == "raw" or not table.transformations:
        return table.data

    from backend.app.models import ColumnTableData, XYTableData, TableFormatId

    if table.format == TableFormatId.COLUMN and isinstance(table.data, ColumnTableData):
        return apply_column_transformations(table.data, table.transformations)

    if table.format == TableFormatId.XY and isinstance(table.data, XYTableData):
        return apply_xy_transformations(table.data, table.transformations)

    return table.data
