"""Table registry - defines allowed analyses and graphs per table format."""

from __future__ import annotations

from backend.app.models import (
    TableFormatId,
    AnalysisTypeId,
    GraphTypeId,
)


ALLOWED_ANALYSES: dict[TableFormatId, list[AnalysisTypeId]] = {
    TableFormatId.COLUMN: [
        AnalysisTypeId.DESCRIPTIVE,
        AnalysisTypeId.UNPAIRED_TTEST,
        AnalysisTypeId.PAIRED_TTEST,
        AnalysisTypeId.ONE_WAY_ANOVA,
        AnalysisTypeId.MANN_WHITNEY,
        AnalysisTypeId.KRUSKAL_WALLIS,
        AnalysisTypeId.ROC_AUC,
        AnalysisTypeId.NORMALITY_TEST,
    ],
    TableFormatId.XY: [
        AnalysisTypeId.LINEAR_REGRESSION,
        AnalysisTypeId.DOSE_RESPONSE_4PL,
    ],
    TableFormatId.GROUPED: [
        AnalysisTypeId.TWO_WAY_ANOVA,
    ],
    TableFormatId.CONTINGENCY: [
        AnalysisTypeId.CHI_SQUARE,
        AnalysisTypeId.FISHER_EXACT,
    ],
    TableFormatId.SURVIVAL: [
        AnalysisTypeId.KAPLAN_MEIER,
    ],
    TableFormatId.PARTS_OF_WHOLE: [
        AnalysisTypeId.FRACTION_OF_TOTAL,
    ],
    TableFormatId.MULTIPLE_VARIABLES: [
        AnalysisTypeId.DESCRIPTIVE,
        AnalysisTypeId.CORRELATION,
        AnalysisTypeId.MULTIPLE_REGRESSION,
    ],
    TableFormatId.NESTED: [
        AnalysisTypeId.DESCRIPTIVE,
        AnalysisTypeId.NESTED_TTEST,
        AnalysisTypeId.NESTED_ONE_WAY_ANOVA,
    ],
}

ALLOWED_GRAPHS: dict[TableFormatId, list[GraphTypeId]] = {
    TableFormatId.COLUMN: [
        GraphTypeId.BAR,
        GraphTypeId.BOX,
    ],
    TableFormatId.XY: [
        GraphTypeId.SCATTER,
        GraphTypeId.LINE,
        GraphTypeId.SCATTER_LINE,
        GraphTypeId.DOSE_RESPONSE,
    ],
    TableFormatId.GROUPED: [
        GraphTypeId.GROUPED_BAR,
    ],
    TableFormatId.CONTINGENCY: [],
    TableFormatId.SURVIVAL: [
        GraphTypeId.SURVIVAL,
    ],
    TableFormatId.PARTS_OF_WHOLE: [
        GraphTypeId.PIE,
    ],
    TableFormatId.MULTIPLE_VARIABLES: [
        GraphTypeId.SCATTER,
    ],
    TableFormatId.NESTED: [
        GraphTypeId.BAR,
    ],
}


def get_allowed_analyses(format_id: TableFormatId) -> list[AnalysisTypeId]:
    """Get allowed analysis types for a table format."""
    return ALLOWED_ANALYSES.get(format_id, [])


def get_allowed_graph_types(format_id: TableFormatId) -> list[GraphTypeId]:
    """Get allowed graph types for a table format."""
    return ALLOWED_GRAPHS.get(format_id, [])


def validate_for_analysis(
    format_id: TableFormatId,
    table_data,
    analysis_type: AnalysisTypeId,
) -> dict:
    """Validate that a table can run a given analysis.

    Returns:
        dict with 'valid' bool and optional 'errors' list
    """
    allowed = get_allowed_analyses(format_id)
    if analysis_type not in allowed:
        return {
            "valid": False,
            "errors": [f"Analysis {analysis_type.value} not allowed for {format_id.value} table"],
        }

    return {"valid": True}
