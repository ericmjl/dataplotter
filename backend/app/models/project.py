"""Data table types and project structure for Dataplotter."""

from __future__ import annotations

from enum import Enum
from typing import Annotated, Literal

from pydantic import BaseModel, Field


class TableFormatId(str, Enum):
    XY = "xy"
    COLUMN = "column"
    GROUPED = "grouped"
    CONTINGENCY = "contingency"
    SURVIVAL = "survival"
    PARTS_OF_WHOLE = "partsOfWhole"
    MULTIPLE_VARIABLES = "multipleVariables"
    NESTED = "nested"


class AnalysisTypeId(str, Enum):
    DESCRIPTIVE = "descriptive"
    UNPAIRED_TTEST = "unpaired_ttest"
    PAIRED_TTEST = "paired_ttest"
    ONE_WAY_ANOVA = "one_way_anova"
    TWO_WAY_ANOVA = "two_way_anova"
    CHI_SQUARE = "chi_square"
    FISHER_EXACT = "fisher_exact"
    KAPLAN_MEIER = "kaplan_meier"
    FRACTION_OF_TOTAL = "fraction_of_total"
    MANN_WHITNEY = "mann_whitney"
    KRUSKAL_WALLIS = "kruskal_wallis"
    ROC_AUC = "roc_auc"
    NORMALITY_TEST = "normality_test"
    LINEAR_REGRESSION = "linear_regression"
    DOSE_RESPONSE_4PL = "dose_response_4pl"
    CORRELATION = "correlation"
    MULTIPLE_REGRESSION = "multiple_regression"
    NESTED_TTEST = "nested_ttest"
    NESTED_ONE_WAY_ANOVA = "nested_one_way_anova"


class GraphTypeId(str, Enum):
    BAR = "bar"
    BOX = "box"
    GROUPED_BAR = "groupedBar"
    SCATTER = "scatter"
    LINE = "line"
    SCATTER_LINE = "scatterLine"
    SURVIVAL = "survival"
    DOSE_RESPONSE = "doseResponse"
    PIE = "pie"
    PARAMETER_BAR = "parameterBar"


TableId = Annotated[str, Field(pattern=r"^[a-zA-Z0-9_-]+$")]
AnalysisId = Annotated[str, Field(pattern=r"^[a-zA-Z0-9_-]+$")]
GraphId = Annotated[str, Field(pattern=r"^[a-zA-Z0-9_-]+$")]
LayoutId = Annotated[str, Field(pattern=r"^[a-zA-Z0-9_-]+$")]


class ColumnTableData(BaseModel):
    column_labels: list[str] = Field(..., alias="columnLabels")
    rows: list[list[float | None]]
    group_labels: list[str] | None = Field(None, alias="groupLabels")
    group_for_column: list[int] | None = Field(None, alias="groupForColumn")

    class Config:
        populate_by_name = True


class XYTableData(BaseModel):
    x_label: str = Field(..., alias="xLabel")
    y_labels: list[str] = Field(..., alias="yLabels")
    x: list[float | None]
    ys: list[list[float | None]]

    class Config:
        populate_by_name = True


class GroupedTableData(BaseModel):
    row_group_labels: list[str] = Field(..., alias="rowGroupLabels")
    col_group_labels: list[str] = Field(..., alias="colGroupLabels")
    cell_values: list[list[list[float | None]]] = Field(..., alias="cellValues")

    class Config:
        populate_by_name = True


class ContingencyTableData(BaseModel):
    row_labels: list[str] = Field(..., alias="rowLabels")
    column_labels: list[str] = Field(..., alias="columnLabels")
    counts: list[list[int]]

    class Config:
        populate_by_name = True


class SurvivalTableData(BaseModel):
    time_label: str = Field(..., alias="timeLabel")
    event_label: str = Field(..., alias="eventLabel")
    subject_labels: list[str] | None = Field(None, alias="subjectLabels")
    group_labels: list[str] | None = Field(None, alias="groupLabels")
    times: list[float]
    events: list[int]
    groups: list[str] | None = None

    class Config:
        populate_by_name = True


class PartsOfWholeTableData(BaseModel):
    labels: list[str]
    values: list[float]

    class Config:
        populate_by_name = True


class MultipleVariablesTableData(BaseModel):
    variable_labels: list[str] = Field(..., alias="variableLabels")
    rows: list[list[float | None]]

    class Config:
        populate_by_name = True


class NestedTableData(BaseModel):
    column_labels: list[str] = Field(..., alias="columnLabels")
    rows: list[list[float | None]]
    group_labels: list[str] | None = Field(None, alias="groupLabels")
    group_for_column: list[int] | None = Field(None, alias="groupForColumn")

    class Config:
        populate_by_name = True


TableData = (
    ColumnTableData
    | XYTableData
    | GroupedTableData
    | ContingencyTableData
    | SurvivalTableData
    | PartsOfWholeTableData
    | MultipleVariablesTableData
    | NestedTableData
)


class TableViewMode(str, Enum):
    RAW = "raw"
    TRANSFORMED = "transformed"


class DataMode(str, Enum):
    RAW = "raw"
    TRANSFORMED = "transformed"


class ColumnTransformation(BaseModel):
    column_key: str = Field(..., alias="columnKey")
    equation: str

    class Config:
        populate_by_name = True


CURRENT_PROJECT_VERSION = 1


class DataTable(BaseModel):
    id: TableId
    name: str
    format: TableFormatId
    data: TableData
    transformations: list[ColumnTransformation] | None = None
    view_mode: TableViewMode | None = Field(None, alias="viewMode")
    table_data_version: int | None = Field(None, alias="tableDataVersion")

    class Config:
        populate_by_name = True


class LayoutItem(BaseModel):
    graph_id: GraphId = Field(..., alias="graphId")
    x: float
    y: float
    width: float
    height: float

    class Config:
        populate_by_name = True


class Layout(BaseModel):
    id: LayoutId
    name: str
    items: list[LayoutItem]


class TableSelection(BaseModel):
    type: Literal["table"] = "table"
    table_id: TableId = Field(..., alias="tableId")


class AnalysisSelection(BaseModel):
    type: Literal["analysis"] = "analysis"
    analysis_id: AnalysisId = Field(..., alias="analysisId")


class GraphSelection(BaseModel):
    type: Literal["graph"] = "graph"
    graph_id: GraphId = Field(..., alias="graphId")


class LayoutSelection(BaseModel):
    type: Literal["layout"] = "layout"
    layout_id: LayoutId = Field(..., alias="layoutId")


SelectionType = Annotated[
    TableSelection | AnalysisSelection | GraphSelection | LayoutSelection | None,
    Field(discriminator="type"),
]


class Project(BaseModel):
    version: int = CURRENT_PROJECT_VERSION
    tables: list[DataTable]
    analyses: list["Analysis"]
    graphs: list["Graph"]
    layouts: list[Layout]
    selection: SelectionType = None


from backend.app.models.analysis import Analysis
from backend.app.models.graph import Graph

Project.model_rebuild()
DataTable.model_rebuild()
