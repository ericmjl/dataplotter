"""Sample table data for each implemented format (PRISM-TBL-021, PRISM-TBL-023).

Used when the user selects "Start with sample data" in the new table modal.
Data shapes match the frontend src/data/sample*.ts modules.
"""

from __future__ import annotations

from backend.app.models import (
    ColumnTableData,
    XYTableData,
    GroupedTableData,
    ContingencyTableData,
    SurvivalTableData,
    PartsOfWholeTableData,
)

# Column: Control vs Treated, a few replicates
SAMPLE_COLUMN_DATA = ColumnTableData(
    columnLabels=["Control", "Treated"],
    rows=[
        [10.0, 12.0],
        [11.0, 14.0],
        [9.0, 13.0],
        [10.5, 11.0],
        [11.2, 15.0],
    ],
    groupLabels=None,
    groupForColumn=None,
)
SAMPLE_COLUMN_NAME = "Sample column table"

# XY: Dose vs Response
SAMPLE_XY_DATA = XYTableData(
    xLabel="Dose",
    yLabels=["Response"],
    x=[1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0],
    ys=[
        [2.1, 3.2, 4.5, 5.1, 5.8, 6.2, 6.5, 6.7, 6.9, 7.0],
    ],
)
SAMPLE_XY_NAME = "Sample XY table"

# Grouped: 2x2 (Male/Female x Control/Treated)
SAMPLE_GROUPED_DATA = GroupedTableData(
    rowGroupLabels=["Male", "Female"],
    colGroupLabels=["Control", "Treated"],
    cellValues=[
        [
            [12.0, 14.0, 11.0, 13.0, 12.0],
            [18.0, 20.0, 19.0, 17.0, 21.0],
        ],
        [
            [10.0, 11.0, 12.0, 9.0, 11.0],
            [16.0, 17.0, 18.0, 15.0, 19.0],
        ],
    ],
)
SAMPLE_GROUPED_NAME = "Sample grouped table"

# Contingency: 2x2 (Treatment x Response)
SAMPLE_CONTINGENCY_DATA = ContingencyTableData(
    rowLabels=["Treatment A", "Treatment B"],
    columnLabels=["Response Yes", "Response No"],
    counts=[
        [23, 7],
        [11, 19],
    ],
)
SAMPLE_CONTINGENCY_NAME = "Sample contingency table"

# Survival: time + event, two groups (Drug vs Placebo)
SAMPLE_SURVIVAL_DATA = SurvivalTableData(
    timeLabel="Time (months)",
    eventLabel="Event",
    subjectLabels=None,
    groupLabels=None,
    times=[
        2.0, 4.0, 5.0, 6.0, 8.0, 10.0, 12.0, 14.0, 16.0, 18.0,
        3.0, 5.0, 7.0, 9.0, 11.0, 13.0, 15.0, 17.0,
    ],
    events=[1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0],
    groups=[
        "Drug", "Drug", "Drug", "Drug", "Drug", "Drug", "Drug", "Drug", "Drug", "Drug",
        "Placebo", "Placebo", "Placebo", "Placebo", "Placebo", "Placebo", "Placebo", "Placebo",
    ],
)
SAMPLE_SURVIVAL_NAME = "Sample survival table"

# Parts of whole: labels + values summing to 100
SAMPLE_PARTS_OF_WHOLE_DATA = PartsOfWholeTableData(
    labels=["Category A", "Category B", "Category C", "Category D", "Category E"],
    values=[35.0, 25.0, 20.0, 12.0, 8.0],
)
SAMPLE_PARTS_OF_WHOLE_NAME = "Sample parts of whole"

# Map format id -> (display name, data)
_SAMPLES: dict[str, tuple[str, ColumnTableData | XYTableData | GroupedTableData | ContingencyTableData | SurvivalTableData | PartsOfWholeTableData]] = {
    "column": (SAMPLE_COLUMN_NAME, SAMPLE_COLUMN_DATA),
    "xy": (SAMPLE_XY_NAME, SAMPLE_XY_DATA),
    "grouped": (SAMPLE_GROUPED_NAME, SAMPLE_GROUPED_DATA),
    "contingency": (SAMPLE_CONTINGENCY_NAME, SAMPLE_CONTINGENCY_DATA),
    "survival": (SAMPLE_SURVIVAL_NAME, SAMPLE_SURVIVAL_DATA),
    "partsOfWhole": (SAMPLE_PARTS_OF_WHOLE_NAME, SAMPLE_PARTS_OF_WHOLE_DATA),
}


def get_sample_for_format(format_id: str) -> tuple[str, ColumnTableData | XYTableData | GroupedTableData | ContingencyTableData | SurvivalTableData | PartsOfWholeTableData] | None:
    """Return (name, data) for the format, or None if no sample for that format.

    :param format_id: Table format id (column, xy, grouped, contingency, survival, partsOfWhole).
    :return: (sample_table_name, sample_data) or None.
    """
    return _SAMPLES.get(format_id)
