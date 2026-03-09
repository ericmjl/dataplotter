"""Analysis types and options."""

from __future__ import annotations

from typing import Annotated, Any, Literal

from pydantic import BaseModel, Field

from backend.app.models.project import (
    AnalysisId,
    TableId,
    DataMode,
)


class DescriptiveOptions(BaseModel):
    type: Literal["descriptive"] = "descriptive"
    data_mode: DataMode = Field(DataMode.RAW, alias="dataMode")

    class Config:
        populate_by_name = True


class UnpairedTtestOptions(BaseModel):
    type: Literal["unpaired_ttest"] = "unpaired_ttest"
    column_labels: tuple[str, str] = Field(..., alias="columnLabels")
    data_mode: DataMode = Field(DataMode.RAW, alias="dataMode")

    class Config:
        populate_by_name = True


class PairedTtestOptions(BaseModel):
    type: Literal["paired_ttest"] = "paired_ttest"
    column_labels: tuple[str, str] = Field(..., alias="columnLabels")
    data_mode: DataMode = Field(DataMode.RAW, alias="dataMode")

    class Config:
        populate_by_name = True


class OneWayAnovaOptions(BaseModel):
    type: Literal["one_way_anova"] = "one_way_anova"
    data_mode: DataMode = Field(DataMode.RAW, alias="dataMode")

    class Config:
        populate_by_name = True


class TwoWayAnovaOptions(BaseModel):
    type: Literal["two_way_anova"] = "two_way_anova"
    data_mode: DataMode = Field(DataMode.RAW, alias="dataMode")

    class Config:
        populate_by_name = True


class ChiSquareOptions(BaseModel):
    type: Literal["chi_square"] = "chi_square"
    data_mode: DataMode = Field(DataMode.RAW, alias="dataMode")

    class Config:
        populate_by_name = True


class FisherExactOptions(BaseModel):
    type: Literal["fisher_exact"] = "fisher_exact"
    data_mode: DataMode = Field(DataMode.RAW, alias="dataMode")

    class Config:
        populate_by_name = True


class KaplanMeierOptions(BaseModel):
    type: Literal["kaplan_meier"] = "kaplan_meier"
    data_mode: DataMode = Field(DataMode.RAW, alias="dataMode")

    class Config:
        populate_by_name = True


class FractionOfTotalOptions(BaseModel):
    type: Literal["fraction_of_total"] = "fraction_of_total"
    data_mode: DataMode = Field(DataMode.RAW, alias="dataMode")

    class Config:
        populate_by_name = True


class MannWhitneyOptions(BaseModel):
    type: Literal["mann_whitney"] = "mann_whitney"
    column_labels: tuple[str, str] = Field(..., alias="columnLabels")
    data_mode: DataMode = Field(DataMode.RAW, alias="dataMode")

    class Config:
        populate_by_name = True


class KruskalWallisOptions(BaseModel):
    type: Literal["kruskal_wallis"] = "kruskal_wallis"
    data_mode: DataMode = Field(DataMode.RAW, alias="dataMode")

    class Config:
        populate_by_name = True


class RocAucOptions(BaseModel):
    type: Literal["roc_auc"] = "roc_auc"
    column_labels: tuple[str, str] = Field(..., alias="columnLabels")
    data_mode: DataMode = Field(DataMode.RAW, alias="dataMode")

    class Config:
        populate_by_name = True


class NormalityTestOptions(BaseModel):
    type: Literal["normality_test"] = "normality_test"
    column_label: str | None = Field(None, alias="columnLabel")
    data_mode: DataMode = Field(DataMode.RAW, alias="dataMode")

    class Config:
        populate_by_name = True


class LinearRegressionOptions(BaseModel):
    type: Literal["linear_regression"] = "linear_regression"
    y_series_label: str | None = Field(None, alias="ySeriesLabel")
    data_mode: DataMode = Field(DataMode.RAW, alias="dataMode")

    class Config:
        populate_by_name = True


class DoseResponse4plOptions(BaseModel):
    type: Literal["dose_response_4pl"] = "dose_response_4pl"
    log_x: bool = Field(False, alias="logX")
    data_mode: DataMode = Field(DataMode.RAW, alias="dataMode")

    class Config:
        populate_by_name = True


class CorrelationOptions(BaseModel):
    type: Literal["correlation"] = "correlation"
    data_mode: DataMode = Field(DataMode.RAW, alias="dataMode")

    class Config:
        populate_by_name = True


class MultipleRegressionOptions(BaseModel):
    type: Literal["multiple_regression"] = "multiple_regression"
    y_variable_label: str | None = Field(None, alias="yVariableLabel")
    data_mode: DataMode = Field(DataMode.RAW, alias="dataMode")

    class Config:
        populate_by_name = True


class NestedTtestOptions(BaseModel):
    type: Literal["nested_ttest"] = "nested_ttest"
    group_labels: tuple[str, str] | None = Field(None, alias="groupLabels")
    data_mode: DataMode = Field(DataMode.RAW, alias="dataMode")

    class Config:
        populate_by_name = True


class NestedOneWayAnovaOptions(BaseModel):
    type: Literal["nested_one_way_anova"] = "nested_one_way_anova"
    data_mode: DataMode = Field(DataMode.RAW, alias="dataMode")

    class Config:
        populate_by_name = True


AnalysisOptions = Annotated[
    DescriptiveOptions
    | UnpairedTtestOptions
    | PairedTtestOptions
    | OneWayAnovaOptions
    | TwoWayAnovaOptions
    | ChiSquareOptions
    | FisherExactOptions
    | KaplanMeierOptions
    | FractionOfTotalOptions
    | MannWhitneyOptions
    | KruskalWallisOptions
    | RocAucOptions
    | NormalityTestOptions
    | LinearRegressionOptions
    | DoseResponse4plOptions
    | CorrelationOptions
    | MultipleRegressionOptions
    | NestedTtestOptions
    | NestedOneWayAnovaOptions,
    Field(discriminator="type"),
]


class Analysis(BaseModel):
    id: AnalysisId
    table_id: TableId = Field(..., alias="tableId")
    type: str
    options: AnalysisOptions
    result: "AnalysisResult | None" = None
    error: str | None = None

    class Config:
        populate_by_name = True


from backend.app.models.result import AnalysisResult

Analysis.model_rebuild()
