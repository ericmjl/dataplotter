"""Fraction of total analysis."""

from __future__ import annotations

from backend.app.models import FractionOfTotalResult, FractionOfTotalItem


def run_fraction_of_total(
    labels: list[str],
    values: list[float],
) -> FractionOfTotalResult:
    """Calculate fraction of total for parts-of-whole data.

    Args:
        labels: Category labels
        values: Values for each category

    Returns:
        FractionOfTotalResult with fractions
    """
    total = sum(values)

    fractions = []
    for label, value in zip(labels, values):
        fraction = value / total if total > 0 else 0.0
        fractions.append(
            FractionOfTotalItem(
                label=label,
                value=value,
                fraction=fraction,
            )
        )

    return FractionOfTotalResult(
        type="fraction_of_total",
        total=total,
        fractions=fractions,
    )
