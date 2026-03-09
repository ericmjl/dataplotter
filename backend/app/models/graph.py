"""Graph types and options."""

from __future__ import annotations

from enum import Enum
from typing import Literal, Any

from pydantic import BaseModel, Field

from backend.app.models.project import GraphId, TableId, AnalysisId, DataMode


class ErrorBarType(str, Enum):
    SEM = "sem"
    SD = "sd"
    CI95 = "ci95"
    NONE = "none"


class GraphOptions(BaseModel):
    title: str | None = None
    x_label: str | None = Field(default=None, alias="xLabel")
    y_label: str | None = Field(default=None, alias="yLabel")
    y2_label: str | None = Field(default=None, alias="y2Label")
    x_scale: Literal["linear", "log"] = "linear"
    y_scale: Literal["linear", "log"] = "linear"
    y2_scale: Literal["linear", "log"] = "linear"
    error_bar_type: str = Field(default="sem", alias="errorBarType")
    show_legend: bool = Field(default=True, alias="showLegend")
    show_line_of_identity: bool = Field(default=False, alias="showLineOfIdentity")
    y_axis2_series_index: int | None = Field(default=None, alias="yAxis2SeriesIndex")
    data_mode: DataMode = Field(default=DataMode.RAW, alias="dataMode")
    annotations: list[dict[str, Any]] | None = None

    model_config = {"populate_by_name": True}


class Graph(BaseModel):
    id: GraphId
    name: str
    table_id: TableId = Field(..., alias="tableId")
    analysis_id: AnalysisId | None = Field(default=None, alias="analysisId")
    graph_type: str = Field(..., alias="graphType")
    options: GraphOptions = Field(default_factory=GraphOptions)

    model_config = {"populate_by_name": True}
