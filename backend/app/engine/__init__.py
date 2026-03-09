"""Statistical analysis engine."""

from __future__ import annotations

from typing import TYPE_CHECKING

from backend.app.models import (
    TableFormatId,
    AnalysisTypeId,
    ColumnTableData,
    XYTableData,
    GroupedTableData,
    ContingencyTableData,
    SurvivalTableData,
    PartsOfWholeTableData,
    MultipleVariablesTableData,
    NestedTableData,
    AnalysisResult,
    AnalysisOptions,
)
from backend.app.engine.descriptive import run_descriptive
from backend.app.engine.ttest import run_unpaired_ttest, run_paired_ttest
from backend.app.engine.anova import run_one_way_anova
from backend.app.engine.two_way_anova import run_two_way_anova
from backend.app.engine.chi_square import run_chi_square
from backend.app.engine.fisher_exact import run_fisher_exact
from backend.app.engine.kaplan_meier import run_kaplan_meier
from backend.app.engine.fraction_of_total import run_fraction_of_total
from backend.app.engine.mann_whitney import run_mann_whitney
from backend.app.engine.kruskal_wallis import run_kruskal_wallis
from backend.app.engine.roc_auc import run_roc_auc
from backend.app.engine.normality import run_normality_test
from backend.app.engine.regression import run_linear_regression
from backend.app.engine.dose_response import run_dose_response_4pl
from backend.app.engine.correlation import run_correlation
from backend.app.engine.multiple_regression import run_multiple_regression
from backend.app.engine.nested_ttest import run_nested_ttest
from backend.app.engine.nested_anova import run_nested_one_way_anova

if TYPE_CHECKING:
    pass

TableDataForAnalysis = (
    ColumnTableData
    | XYTableData
    | GroupedTableData
    | ContingencyTableData
    | SurvivalTableData
    | PartsOfWholeTableData
    | MultipleVariablesTableData
    | NestedTableData
)


class AnalysisError(Exception):
    """Raised when analysis fails."""

    pass


def run_analysis(
    format_id: TableFormatId,
    analysis_type: AnalysisTypeId,
    table_data: TableDataForAnalysis,
    options: AnalysisOptions,
) -> AnalysisResult:
    """Run a statistical analysis on table data.

    Args:
        format_id: Table format (column, xy, grouped, etc.)
        analysis_type: Type of analysis to run
        table_data: The table data
        options: Analysis-specific options

    Returns:
        AnalysisResult with the analysis output

    Raises:
        AnalysisError: If analysis fails
    """
    if analysis_type == AnalysisTypeId.DESCRIPTIVE:
        if format_id in (TableFormatId.COLUMN, TableFormatId.NESTED):
            if not isinstance(table_data, (ColumnTableData, NestedTableData)):
                raise AnalysisError("Descriptive requires column or nested table")
            return run_descriptive(
                table_data.column_labels,
                table_data.rows,
                table_data.group_labels,
                table_data.group_for_column,
            )
        if format_id == TableFormatId.MULTIPLE_VARIABLES:
            if not isinstance(table_data, MultipleVariablesTableData):
                raise AnalysisError("Descriptive requires multiple variables table")
            return run_descriptive(table_data.variable_labels, table_data.rows, None, None)
        raise AnalysisError(
            "Descriptive analysis requires column, multiple variables, or nested table"
        )

    if analysis_type == AnalysisTypeId.UNPAIRED_TTEST:
        if format_id != TableFormatId.COLUMN:
            raise AnalysisError("Unpaired t-test requires column table")
        if not isinstance(table_data, ColumnTableData):
            raise AnalysisError("Unpaired t-test requires column table")
        col_labels = options.column_labels
        i1 = table_data.column_labels.index(col_labels[0])
        i2 = table_data.column_labels.index(col_labels[1])
        return run_unpaired_ttest(col_labels, table_data.rows, (i1, i2))

    if analysis_type == AnalysisTypeId.PAIRED_TTEST:
        if format_id != TableFormatId.COLUMN:
            raise AnalysisError("Paired t-test requires column table")
        if not isinstance(table_data, ColumnTableData):
            raise AnalysisError("Paired t-test requires column table")
        col_labels = options.column_labels
        i1 = table_data.column_labels.index(col_labels[0])
        i2 = table_data.column_labels.index(col_labels[1])
        return run_paired_ttest(col_labels, table_data.rows, (i1, i2))

    if analysis_type == AnalysisTypeId.ONE_WAY_ANOVA:
        if format_id != TableFormatId.COLUMN:
            raise AnalysisError("One-way ANOVA requires column table")
        if not isinstance(table_data, ColumnTableData):
            raise AnalysisError("One-way ANOVA requires column table")
        return run_one_way_anova(table_data.column_labels, table_data.rows)

    if analysis_type == AnalysisTypeId.TWO_WAY_ANOVA:
        if format_id != TableFormatId.GROUPED:
            raise AnalysisError("Two-way ANOVA requires grouped table")
        if not isinstance(table_data, GroupedTableData):
            raise AnalysisError("Two-way ANOVA requires grouped table")
        return run_two_way_anova(
            table_data.row_group_labels,
            table_data.col_group_labels,
            table_data.cell_values,
        )

    if analysis_type == AnalysisTypeId.CHI_SQUARE:
        if format_id != TableFormatId.CONTINGENCY:
            raise AnalysisError("Chi-square requires contingency table")
        if not isinstance(table_data, ContingencyTableData):
            raise AnalysisError("Chi-square requires contingency table")
        return run_chi_square(table_data.row_labels, table_data.column_labels, table_data.counts)

    if analysis_type == AnalysisTypeId.FISHER_EXACT:
        if format_id != TableFormatId.CONTINGENCY:
            raise AnalysisError("Fisher's exact requires contingency table")
        if not isinstance(table_data, ContingencyTableData):
            raise AnalysisError("Fisher's exact requires contingency table")
        if len(table_data.row_labels) != 2 or len(table_data.column_labels) != 2:
            raise AnalysisError("Fisher's exact requires a 2x2 table")
        return run_fisher_exact(table_data.counts)

    if analysis_type == AnalysisTypeId.KAPLAN_MEIER:
        if format_id != TableFormatId.SURVIVAL:
            raise AnalysisError("Kaplan-Meier requires survival table")
        if not isinstance(table_data, SurvivalTableData):
            raise AnalysisError("Kaplan-Meier requires survival table")
        return run_kaplan_meier(table_data)

    if analysis_type == AnalysisTypeId.FRACTION_OF_TOTAL:
        if format_id != TableFormatId.PARTS_OF_WHOLE:
            raise AnalysisError("Fraction of total requires parts-of-whole table")
        if not isinstance(table_data, PartsOfWholeTableData):
            raise AnalysisError("Fraction of total requires parts-of-whole table")
        return run_fraction_of_total(table_data.labels, table_data.values)

    if analysis_type == AnalysisTypeId.MANN_WHITNEY:
        if format_id != TableFormatId.COLUMN:
            raise AnalysisError("Mann-Whitney requires column table")
        if not isinstance(table_data, ColumnTableData):
            raise AnalysisError("Mann-Whitney requires column table")
        col_labels = options.column_labels
        i1 = table_data.column_labels.index(col_labels[0])
        i2 = table_data.column_labels.index(col_labels[1])
        return run_mann_whitney(col_labels, table_data.rows, (i1, i2))

    if analysis_type == AnalysisTypeId.KRUSKAL_WALLIS:
        if format_id != TableFormatId.COLUMN:
            raise AnalysisError("Kruskal-Wallis requires column table")
        if not isinstance(table_data, ColumnTableData):
            raise AnalysisError("Kruskal-Wallis requires column table")
        return run_kruskal_wallis(table_data.column_labels, table_data.rows)

    if analysis_type == AnalysisTypeId.ROC_AUC:
        if format_id != TableFormatId.COLUMN:
            raise AnalysisError("ROC AUC requires column table")
        if not isinstance(table_data, ColumnTableData):
            raise AnalysisError("ROC AUC requires column table")
        col_labels = options.column_labels
        i0 = table_data.column_labels.index(col_labels[0])
        i1 = table_data.column_labels.index(col_labels[1])
        return run_roc_auc(col_labels, table_data.rows, (i0, i1))

    if analysis_type == AnalysisTypeId.NORMALITY_TEST:
        if format_id != TableFormatId.COLUMN:
            raise AnalysisError("Normality test requires column table")
        if not isinstance(table_data, ColumnTableData):
            raise AnalysisError("Normality test requires column table")
        label = options.column_label or table_data.column_labels[0]
        col_idx = table_data.column_labels.index(label)
        values = [r[col_idx] for r in table_data.rows if r[col_idx] is not None]
        return run_normality_test(label, values)

    if analysis_type == AnalysisTypeId.LINEAR_REGRESSION:
        if format_id != TableFormatId.XY:
            raise AnalysisError("Linear regression requires XY table")
        if not isinstance(table_data, XYTableData):
            raise AnalysisError("Linear regression requires XY table")
        y_idx = 0
        if options.y_series_label:
            y_idx = table_data.y_labels.index(options.y_series_label)
        x = table_data.x
        y = table_data.ys[y_idx] if y_idx < len(table_data.ys) else []
        return run_linear_regression(x, y)

    if analysis_type == AnalysisTypeId.DOSE_RESPONSE_4PL:
        if format_id != TableFormatId.XY:
            raise AnalysisError("4PL dose-response requires XY table")
        if not isinstance(table_data, XYTableData):
            raise AnalysisError("4PL dose-response requires XY table")
        x = table_data.x
        y = table_data.ys[0] if table_data.ys else []
        return run_dose_response_4pl(x, y, options.log_x)

    if analysis_type == AnalysisTypeId.CORRELATION:
        if format_id != TableFormatId.MULTIPLE_VARIABLES:
            raise AnalysisError("Correlation requires multiple variables table")
        if not isinstance(table_data, MultipleVariablesTableData):
            raise AnalysisError("Correlation requires multiple variables table")
        return run_correlation(table_data.variable_labels, table_data.rows)

    if analysis_type == AnalysisTypeId.MULTIPLE_REGRESSION:
        if format_id != TableFormatId.MULTIPLE_VARIABLES:
            raise AnalysisError("Multiple regression requires multiple variables table")
        if not isinstance(table_data, MultipleVariablesTableData):
            raise AnalysisError("Multiple regression requires multiple variables table")
        return run_multiple_regression(
            table_data.variable_labels, table_data.rows, options.y_variable_label
        )

    if analysis_type == AnalysisTypeId.NESTED_TTEST:
        if format_id != TableFormatId.NESTED:
            raise AnalysisError("Nested t-test requires nested table")
        if not isinstance(table_data, NestedTableData):
            raise AnalysisError("Nested t-test requires nested table")
        group_for_column = table_data.group_for_column or [0] * len(table_data.column_labels)
        group_labels = options.group_labels or (
            table_data.group_labels[:2]
            if table_data.group_labels and len(table_data.group_labels) >= 2
            else ("Group 1", "Group 2")
        )
        return run_nested_ttest(
            table_data.column_labels,
            table_data.rows,
            group_labels,
            group_for_column,
        )

    if analysis_type == AnalysisTypeId.NESTED_ONE_WAY_ANOVA:
        if format_id != TableFormatId.NESTED:
            raise AnalysisError("Nested one-way ANOVA requires nested table")
        if not isinstance(table_data, NestedTableData):
            raise AnalysisError("Nested one-way ANOVA requires nested table")
        group_for_column = table_data.group_for_column or list(range(len(table_data.column_labels)))
        group_labels = table_data.group_labels or [
            f"Group {i + 1}" for i in range(len(table_data.column_labels))
        ]
        return run_nested_one_way_anova(
            table_data.column_labels,
            table_data.rows,
            group_labels,
            group_for_column,
        )

    raise AnalysisError(f"Unknown analysis type: {analysis_type}")
