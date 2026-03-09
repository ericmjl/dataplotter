"""Tests for project models."""

import pytest
from pydantic import ValidationError

from backend.app.models import (
    ColumnTableData,
    XYTableData,
    GroupedTableData,
    ContingencyTableData,
    SurvivalTableData,
    PartsOfWholeTableData,
    MultipleVariablesTableData,
    NestedTableData,
    DataTable,
    TableFormatId,
    TableViewMode,
    ColumnTransformation,
    TableSelection,
    AnalysisSelection,
    GraphSelection,
    LayoutSelection,
    Project,
)


class TestColumnTableData:
    def test_valid_column_table_data(self):
        data = ColumnTableData(
            columnLabels=["A", "B", "C"],
            rows=[[1.0, 2.0, 3.0], [4.0, 5.0, 6.0]],
        )
        assert data.column_labels == ["A", "B", "C"]
        assert len(data.rows) == 2

    def test_column_table_with_groups(self):
        data = ColumnTableData(
            columnLabels=["A1", "A2", "B1", "B2"],
            rows=[[1.0, 2.0, 3.0, 4.0]],
            groupLabels=["Group A", "Group B"],
            groupForColumn=[0, 0, 1, 1],
        )
        assert data.group_labels == ["Group A", "Group B"]
        assert data.group_for_column == [0, 0, 1, 1]

    def test_column_table_with_nulls(self):
        data = ColumnTableData(
            columnLabels=["A", "B"],
            rows=[[1.0, None], [None, 2.0]],
        )
        assert data.rows[0][1] is None
        assert data.rows[1][0] is None


class TestXYTableData:
    def test_valid_xy_table_data(self):
        data = XYTableData(
            xLabel="Time",
            yLabels=["Response 1", "Response 2"],
            x=[0.0, 1.0, 2.0],
            ys=[[10.0, 20.0, 30.0], [15.0, 25.0, 35.0]],
        )
        assert data.x_label == "Time"
        assert len(data.y_labels) == 2
        assert len(data.x) == 3

    def test_xy_table_with_nulls(self):
        data = XYTableData(
            xLabel="X",
            yLabels=["Y"],
            x=[0.0, None, 2.0],
            ys=[[1.0, None, 3.0]],
        )
        assert data.x[1] is None
        assert data.ys[0][1] is None


class TestGroupedTableData:
    def test_valid_grouped_table_data(self):
        data = GroupedTableData(
            rowGroupLabels=["Row1", "Row2"],
            colGroupLabels=["Col1", "Col2"],
            cellValues=[[[1.0, 2.0], [3.0, 4.0]], [[5.0, 6.0], [7.0, 8.0]]],
        )
        assert len(data.row_group_labels) == 2
        assert len(data.col_group_labels) == 2
        assert data.cell_values[0][0] == [1.0, 2.0]


class TestContingencyTableData:
    def test_valid_contingency_table_data(self):
        data = ContingencyTableData(
            rowLabels=["Yes", "No"],
            columnLabels=["Treatment", "Control"],
            counts=[[10, 5], [20, 15]],
        )
        assert data.row_labels == ["Yes", "No"]
        assert data.column_labels == ["Treatment", "Control"]
        assert data.counts[0][0] == 10


class TestSurvivalTableData:
    def test_valid_survival_table_data(self):
        data = SurvivalTableData(
            timeLabel="Days",
            eventLabel="Death",
            times=[10.0, 20.0, 30.0, 40.0],
            events=[1, 0, 1, 1],
            groups=["A", "A", "B", "B"],
        )
        assert data.time_label == "Days"
        assert len(data.times) == 4
        assert data.groups == ["A", "A", "B", "B"]


class TestPartsOfWholeTableData:
    def test_valid_parts_of_whole_data(self):
        data = PartsOfWholeTableData(
            labels=["Category A", "Category B", "Category C"],
            values=[30.0, 40.0, 30.0],
        )
        assert sum(data.values) == 100.0


class TestMultipleVariablesTableData:
    def test_valid_multiple_variables_data(self):
        data = MultipleVariablesTableData(
            variableLabels=["Age", "Height", "Weight"],
            rows=[[25, 175, 70], [30, 180, 80]],
        )
        assert len(data.variable_labels) == 3
        assert len(data.rows) == 2


class TestNestedTableData:
    def test_valid_nested_table_data(self):
        data = NestedTableData(
            columnLabels=["Sub1", "Sub2", "Sub3", "Sub4"],
            rows=[[1.0, 2.0, 3.0, 4.0]],
            groupLabels=["Group A", "Group B"],
            groupForColumn=[0, 0, 1, 1],
        )
        assert data.group_labels == ["Group A", "Group B"]
        assert data.group_for_column == [0, 0, 1, 1]


class TestColumnTransformation:
    def test_valid_transformation(self):
        t = ColumnTransformation(columnKey="y-0", equation="log10(y)")
        assert t.column_key == "y-0"
        assert t.equation == "log10(y)"


class TestDataTable:
    def test_column_data_table(self):
        table = DataTable(
            id="table-1",
            name="Test Column Table",
            format=TableFormatId.COLUMN,
            data=ColumnTableData(
                columnLabels=["A", "B"],
                rows=[[1.0, 2.0]],
            ),
        )
        assert table.format == TableFormatId.COLUMN

    def test_xy_data_table(self):
        table = DataTable(
            id="table-2",
            name="Test XY Table",
            format=TableFormatId.XY,
            data=XYTableData(
                xLabel="X",
                yLabels=["Y"],
                x=[1.0, 2.0],
                ys=[[3.0, 4.0]],
            ),
        )
        assert table.format == TableFormatId.XY

    def test_table_with_transformations(self):
        table = DataTable(
            id="table-3",
            name="Transformed Table",
            format=TableFormatId.COLUMN,
            data=ColumnTableData(columnLabels=["A"], rows=[[1.0]]),
            transformations=[ColumnTransformation(columnKey="col-0", equation="y * 2")],
            viewMode=TableViewMode.TRANSFORMED,
        )
        assert table.transformations is not None
        assert table.view_mode == TableViewMode.TRANSFORMED


class TestSelectionTypes:
    def test_table_selection(self):
        sel = TableSelection(tableId="table-1")
        assert sel.type == "table"
        assert sel.table_id == "table-1"

    def test_analysis_selection(self):
        sel = AnalysisSelection(analysisId="analysis-1")
        assert sel.type == "analysis"
        assert sel.analysis_id == "analysis-1"

    def test_graph_selection(self):
        sel = GraphSelection(graphId="graph-1")
        assert sel.type == "graph"
        assert sel.graph_id == "graph-1"

    def test_layout_selection(self):
        sel = LayoutSelection(layoutId="layout-1")
        assert sel.type == "layout"
        assert sel.layout_id == "layout-1"


class TestProject:
    def test_empty_project(self):
        project = Project(tables=[], analyses=[], graphs=[], layouts=[])
        assert project.version == 1
        assert len(project.tables) == 0
        assert project.selection is None

    def test_project_with_table(self):
        table = DataTable(
            id="t1",
            name="Table 1",
            format=TableFormatId.COLUMN,
            data=ColumnTableData(columnLabels=["A"], rows=[]),
        )
        project = Project(
            tables=[table],
            analyses=[],
            graphs=[],
            layouts=[],
            selection=TableSelection(tableId="t1"),
        )
        assert len(project.tables) == 1
        assert project.selection is not None
        assert project.selection.table_id == "t1"
