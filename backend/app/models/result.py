"""Analysis result types."""

from __future__ import annotations

from typing import Annotated, Literal, Any

from pydantic import BaseModel, Field


class DescriptiveColumnStats(BaseModel):
    label: str
    n: int
    mean: float
    sem: float
    sd: float
    median: float | None = None
    min_val: float | None = Field(None, alias="min")
    max_val: float | None = Field(None, alias="max")
    q1: float | None = None
    q3: float | None = None
    ci_lower: float | None = Field(None, alias="ciLower")
    ci_upper: float | None = Field(None, alias="ciUpper")
    mean_cr_i_lower: float | None = Field(None, alias="meanCrILower")
    mean_cr_i_upper: float | None = Field(None, alias="meanCrIUpper")
    mean_sd: float | None = Field(None, alias="meanSD")

    class Config:
        populate_by_name = True


class DescriptiveResult(BaseModel):
    type: Literal["descriptive"] = "descriptive"
    by_column: list[DescriptiveColumnStats] = Field(..., alias="byColumn")


class CurvePoint(BaseModel):
    x: list[float]
    y: list[float]
    y_lower: list[float] | None = Field(None, alias="yLower")
    y_upper: list[float] | None = Field(None, alias="yUpper")


class TTestResult(BaseModel):
    type: Literal["unpaired_ttest", "paired_ttest"] = "unpaired_ttest"
    label_a: str = Field(..., alias="labelA")
    label_b: str = Field(..., alias="labelB")
    mean_a: float = Field(..., alias="meanA")
    mean_b: float = Field(..., alias="meanB")
    mean_diff: float = Field(..., alias="meanDiff")
    t: float
    p: float
    df: float
    ci_lower: float = Field(..., alias="ciLower")
    ci_upper: float = Field(..., alias="ciUpper")
    cohens_d: float | None = Field(None, alias="cohensD")


class OneWayAnovaResult(BaseModel):
    type: Literal["one_way_anova"] = "one_way_anova"
    group_means: list[tuple[str, float]] = Field(..., alias="groupMeans")
    f: float
    p: float
    df_between: float = Field(..., alias="dfBetween")
    df_within: float = Field(..., alias="dfWithin")
    ss_between: float = Field(..., alias="ssBetween")
    ss_within: float = Field(..., alias="ssWithin")


class TwoWayAnovaResult(BaseModel):
    type: Literal["two_way_anova"] = "two_way_anova"
    row_factor_f: float = Field(..., alias="rowFactorF")
    row_factor_p: float = Field(..., alias="rowFactorP")
    col_factor_f: float = Field(..., alias="colFactorF")
    col_factor_p: float = Field(..., alias="colFactorP")
    interaction_f: float | None = Field(None, alias="interactionF")
    interaction_p: float | None = Field(None, alias="interactionP")


class ChiSquareResult(BaseModel):
    type: Literal["chi_square"] = "chi_square"
    chi2: float
    p: float
    df: int
    expected: list[list[float]]


class FisherExactResult(BaseModel):
    type: Literal["fisher_exact"] = "fisher_exact"
    p_value: float = Field(..., alias="pValue")
    odds_ratio: float | None = Field(None, alias="oddsRatio")


class KaplanMeierCurve(BaseModel):
    group: str
    time: list[float]
    survival: list[float]
    at_risk: list[int] = Field(..., alias="atRisk")
    events: list[int]


class KaplanMeierResult(BaseModel):
    type: Literal["kaplan_meier"] = "kaplan_meier"
    curves: list[KaplanMeierCurve]
    median_survival: dict[str, float | None] = Field(..., alias="medianSurvival")
    log_rank_p: float | None = Field(None, alias="logRankP")


class FractionOfTotalItem(BaseModel):
    label: str
    value: float
    fraction: float


class FractionOfTotalResult(BaseModel):
    type: Literal["fraction_of_total"] = "fraction_of_total"
    total: float
    fractions: list[FractionOfTotalItem]


class MannWhitneyResult(BaseModel):
    type: Literal["mann_whitney"] = "mann_whitney"
    label_a: str = Field(..., alias="labelA")
    label_b: str = Field(..., alias="labelB")
    u: float
    p: float
    z: float | None = None


class KruskalWallisResult(BaseModel):
    type: Literal["kruskal_wallis"] = "kruskal_wallis"
    h: float
    p: float
    df: int


class RocAucResult(BaseModel):
    type: Literal["roc_auc"] = "roc_auc"
    auc: float
    ci_lower: float | None = Field(None, alias="ciLower")
    ci_upper: float | None = Field(None, alias="ciUpper")


class NormalityTestResult(BaseModel):
    type: Literal["normality_test"] = "normality_test"
    label: str
    w: float
    p: float
    is_normal: bool = Field(..., alias="isNormal")


class LinearRegressionResult(BaseModel):
    type: Literal["linear_regression"] = "linear_regression"
    slope: float
    intercept: float
    r_squared: float = Field(..., alias="rSquared")
    p: float
    slope_ci_lower: float = Field(..., alias="slopeCiLower")
    slope_ci_upper: float = Field(..., alias="slopeCiUpper")
    intercept_ci_lower: float = Field(..., alias="interceptCiLower")
    intercept_ci_upper: float = Field(..., alias="interceptCiUpper")
    curve: CurvePoint | None = None


class DoseResponse4plResult(BaseModel):
    type: Literal["dose_response_4pl"] = "dose_response_4pl"
    bottom: float
    top: float
    ec50: float
    hill_slope: float = Field(..., alias="hillSlope")
    curve: CurvePoint
    r_squared: float | None = Field(None, alias="rSquared")


class CorrelationResult(BaseModel):
    type: Literal["correlation"] = "correlation"
    matrix: list[list[float]]
    labels: list[str]
    method: str = "pearson"


class MultipleRegressionResult(BaseModel):
    type: Literal["multiple_regression"] = "multiple_regression"
    coefficients: dict[str, float]
    intercept: float
    r_squared: float = Field(..., alias="rSquared")
    adj_r_squared: float = Field(..., alias="adjRSquared")
    f_stat: float = Field(..., alias="fStat")
    p: float
    coef_p_values: dict[str, float] = Field(..., alias="coefPValues")


class NestedTtestResult(BaseModel):
    type: Literal["nested_ttest"] = "nested_ttest"
    group_a: str = Field(..., alias="groupA")
    group_b: str = Field(..., alias="groupB")
    mean_a: float = Field(..., alias="meanA")
    mean_b: float = Field(..., alias="meanB")
    t: float
    p: float
    df: float


class NestedOneWayAnovaResult(BaseModel):
    type: Literal["nested_one_way_anova"] = "nested_one_way_anova"
    group_means: list[tuple[str, float]] = Field(..., alias="groupMeans")
    f: float
    p: float
    df_between: float = Field(..., alias="dfBetween")
    df_within: float = Field(..., alias="dfWithin")


AnalysisResult = Annotated[
    DescriptiveResult
    | TTestResult
    | OneWayAnovaResult
    | TwoWayAnovaResult
    | ChiSquareResult
    | FisherExactResult
    | KaplanMeierResult
    | FractionOfTotalResult
    | MannWhitneyResult
    | KruskalWallisResult
    | RocAucResult
    | NormalityTestResult
    | LinearRegressionResult
    | DoseResponse4plResult
    | CorrelationResult
    | MultipleRegressionResult
    | NestedTtestResult
    | NestedOneWayAnovaResult,
    Field(discriminator="type"),
]
