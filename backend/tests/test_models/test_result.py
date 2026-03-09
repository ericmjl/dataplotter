"""Tests for analysis result models."""

import pytest

from backend.app.models import (
    DescriptiveResult,
    DescriptiveColumnStats,
    TTestResult,
    OneWayAnovaResult,
    TwoWayAnovaResult,
    ChiSquareResult,
    FisherExactResult,
    KaplanMeierResult,
    KaplanMeierCurve,
    FractionOfTotalResult,
    MannWhitneyResult,
    KruskalWallisResult,
    RocAucResult,
    NormalityTestResult,
    LinearRegressionResult,
    DoseResponse4plResult,
    CorrelationResult,
    CurvePoint,
)


class TestDescriptiveResult:
    def test_descriptive_result_basic(self):
        result = DescriptiveResult(
            type="descriptive",
            byColumn=[
                DescriptiveColumnStats(
                    label="A",
                    n=10,
                    mean=5.0,
                    sem=0.5,
                    sd=1.5,
                )
            ],
        )
        assert result.type == "descriptive"
        assert len(result.by_column) == 1
        assert result.by_column[0].label == "A"
        assert result.by_column[0].mean == 5.0

    def test_descriptive_result_with_bayesian_fields(self):
        result = DescriptiveResult(
            type="descriptive",
            byColumn=[
                DescriptiveColumnStats(
                    label="B",
                    n=20,
                    mean=10.0,
                    sem=1.0,
                    sd=4.5,
                    meanCrILower=8.5,
                    meanCrIUpper=11.5,
                    meanSD=1.2,
                )
            ],
        )
        assert result.by_column[0].mean_cr_i_lower == 8.5
        assert result.by_column[0].mean_cr_i_upper == 11.5
        assert result.by_column[0].mean_sd == 1.2


class TestTTestResult:
    def test_unpaired_ttest_result(self):
        result = TTestResult(
            type="unpaired_ttest",
            labelA="Control",
            labelB="Treatment",
            meanA=10.0,
            meanB=15.0,
            meanDiff=5.0,
            t=2.5,
            p=0.03,
            df=18,
            ciLower=1.0,
            ciUpper=9.0,
            cohensD=0.8,
        )
        assert result.type == "unpaired_ttest"
        assert result.mean_diff == 5.0
        assert result.p == 0.03
        assert result.cohens_d == 0.8


class TestAnovaResults:
    def test_one_way_anova_result(self):
        result = OneWayAnovaResult(
            type="one_way_anova",
            groupMeans=[("A", 10.0), ("B", 15.0), ("C", 20.0)],
            f=5.5,
            p=0.01,
            dfBetween=2,
            dfWithin=27,
            ssBetween=100.0,
            ssWithin=200.0,
        )
        assert result.f == 5.5
        assert result.p == 0.01
        assert len(result.group_means) == 3

    def test_two_way_anova_result(self):
        result = TwoWayAnovaResult(
            type="two_way_anova",
            rowFactorF=4.5,
            rowFactorP=0.02,
            colFactorF=3.2,
            colFactorP=0.05,
            interactionF=1.5,
            interactionP=0.2,
        )
        assert result.row_factor_f == 4.5
        assert result.col_factor_f == 3.2


class TestChiSquareAndFisher:
    def test_chi_square_result(self):
        result = ChiSquareResult(
            type="chi_square",
            chi2=5.0,
            p=0.025,
            df=1,
            expected=[[10, 10], [10, 10]],
        )
        assert result.chi2 == 5.0
        assert result.p == 0.025

    def test_fisher_exact_result(self):
        result = FisherExactResult(
            type="fisher_exact",
            pValue=0.03,
            oddsRatio=2.5,
        )
        assert result.p_value == 0.03
        assert result.odds_ratio == 2.5


class TestKaplanMeierResult:
    def test_kaplan_meier_result(self):
        result = KaplanMeierResult(
            type="kaplan_meier",
            curves=[
                KaplanMeierCurve(
                    group="A",
                    time=[0, 10, 20, 30],
                    survival=[1.0, 0.9, 0.7, 0.5],
                    atRisk=[10, 9, 7, 5],
                    events=[0, 1, 2, 2],
                )
            ],
            medianSurvival={"A": 25.0},
            logRankP=0.05,
        )
        assert len(result.curves) == 1
        assert result.median_survival["A"] == 25.0
        assert result.log_rank_p == 0.05


class TestFractionOfTotalResult:
    def test_fraction_of_total_result(self):
        result = FractionOfTotalResult(
            type="fraction_of_total",
            total=100.0,
            fractions=[
                {"label": "A", "value": 30.0, "fraction": 0.3},
                {"label": "B", "value": 40.0, "fraction": 0.4},
                {"label": "C", "value": 30.0, "fraction": 0.3},
            ],
        )
        assert result.total == 100.0
        assert len(result.fractions) == 3


class TestNonparametricResults:
    def test_mann_whitney_result(self):
        result = MannWhitneyResult(
            type="mann_whitney",
            labelA="A",
            labelB="B",
            u=25.0,
            p=0.04,
            z=2.0,
        )
        assert result.u == 25.0
        assert result.p == 0.04

    def test_kruskal_wallis_result(self):
        result = KruskalWallisResult(
            type="kruskal_wallis",
            h=8.5,
            p=0.014,
            df=2,
        )
        assert result.h == 8.5
        assert result.df == 2


class TestRocAucResult:
    def test_roc_auc_result(self):
        result = RocAucResult(
            type="roc_auc",
            auc=0.85,
            ciLower=0.75,
            ciUpper=0.95,
        )
        assert result.auc == 0.85
        assert result.ci_lower == 0.75


class TestNormalityTestResult:
    def test_normality_test_result(self):
        result = NormalityTestResult(
            type="normality_test",
            label="Column A",
            w=0.95,
            p=0.45,
            isNormal=True,
        )
        assert result.is_normal is True
        assert result.p == 0.45


class TestRegressionResults:
    def test_linear_regression_result(self):
        result = LinearRegressionResult(
            type="linear_regression",
            slope=2.5,
            intercept=1.0,
            rSquared=0.85,
            p=0.001,
            slopeCiLower=2.0,
            slopeCiUpper=3.0,
            interceptCiLower=0.5,
            interceptCiUpper=1.5,
        )
        assert result.slope == 2.5
        assert result.r_squared == 0.85

    def test_linear_regression_with_curve(self):
        result = LinearRegressionResult(
            type="linear_regression",
            slope=2.5,
            intercept=1.0,
            rSquared=0.85,
            p=0.001,
            slopeCiLower=2.0,
            slopeCiUpper=3.0,
            interceptCiLower=0.5,
            interceptCiUpper=1.5,
            curve=CurvePoint(
                x=[0, 10],
                y=[1.0, 26.0],
                yLower=[0.5, 25.0],
                yUpper=[1.5, 27.0],
            ),
        )
        assert result.curve is not None
        assert len(result.curve.x) == 2


class TestDoseResponseResult:
    def test_dose_response_4pl_result(self):
        result = DoseResponse4plResult(
            type="dose_response_4pl",
            bottom=0.0,
            top=100.0,
            ec50=1.0,
            hillSlope=1.0,
            curve=CurvePoint(
                x=[0.001, 0.01, 0.1, 1, 10],
                y=[0.1, 1.0, 9.0, 50.0, 91.0],
            ),
            rSquared=0.95,
        )
        assert result.ec50 == 1.0
        assert result.hill_slope == 1.0


class TestCorrelationResult:
    def test_correlation_result(self):
        result = CorrelationResult(
            type="correlation",
            matrix=[[1.0, 0.8], [0.8, 1.0]],
            labels=["X", "Y"],
            method="pearson",
        )
        assert result.matrix[0][1] == 0.8
        assert result.method == "pearson"
