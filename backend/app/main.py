"""FastAPI main application entry point."""

from __future__ import annotations

import random
from pathlib import Path
from typing import TYPE_CHECKING

from fastapi import FastAPI, Request, Form
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

if TYPE_CHECKING:
    from backend.app.models import Project

BASE_DIR = Path(__file__).resolve().parent.parent.parent
TEMPLATES_DIR = BASE_DIR / "frontend" / "templates"
STATIC_DIR = BASE_DIR / "frontend" / "static"

app = FastAPI(title="Dataplotter")
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))

_project: Project | None = None


def get_project() -> Project:
    from backend.app.models import Project

    global _project
    if _project is None:
        _project = Project(tables=[], analyses=[], graphs=[], layouts=[])
    return _project


def set_project(project: Project):
    global _project
    _project = project


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    project = get_project()
    return templates.TemplateResponse(
        "base.html",
        {"request": request, "project": project},
    )


@app.get("/partials/sidebar")
async def sidebar(request: Request):
    project = get_project()
    return templates.TemplateResponse(
        "partials/sidebar.html",
        {"request": request, "project": project},
    )


def _get_main_content_html(request: Request, project: Project) -> str:
    """Render the main content area to HTML string based on current selection."""
    from backend.app.models import TableSelection, AnalysisSelection, GraphSelection

    selection = project.selection
    if selection is None:
        return templates.get_template("partials/empty.html").render({"request": request})

    if isinstance(selection, TableSelection):
        table = next((t for t in project.tables if t.id == selection.table_id), None)
        if table:
            return templates.get_template("partials/table_view.html").render(
                {"request": request, "table": table, "project": project}
            )
    elif isinstance(selection, AnalysisSelection):
        analysis = next((a for a in project.analyses if a.id == selection.analysis_id), None)
        if analysis:
            table = next((t for t in project.tables if t.id == analysis.table_id), None)
            return templates.get_template("partials/analysis_panel.html").render(
                {"request": request, "analysis": analysis, "table": table, "project": project}
            )
    elif isinstance(selection, GraphSelection):
        graph = next((g for g in project.graphs if g.id == selection.graph_id), None)
        if graph:
            table = next((t for t in project.tables if t.id == graph.table_id), None)
            analysis = None
            if graph.analysis_id:
                analysis = next((a for a in project.analyses if a.id == graph.analysis_id), None)
            return templates.get_template("partials/graph_view.html").render(
                {
                    "request": request,
                    "graph": graph,
                    "table": table,
                    "analysis": analysis,
                    "project": project,
                }
            )

    return templates.get_template("partials/empty.html").render({"request": request})


@app.get("/partials/content")
async def content(request: Request):
    project = get_project()
    html = _get_main_content_html(request, project)
    return HTMLResponse(content=html)


@app.get("/tables/new", response_class=HTMLResponse)
async def new_table_dialog(request: Request):
    return templates.TemplateResponse(
        "partials/new_table_dialog.html",
        {"request": request},
    )


@app.post("/tables")
async def create_table(
    request: Request,
    name: str = Form(...),
    format: str = Form(...),
    dataSource: str = Form("enter"),
):
    from nanoid import generate
    from backend.app.models import DataTable, TableFormatId, ColumnTableData, XYTableData
    from backend.app.lib.sample_data import get_sample_for_format

    table_id = generate()
    use_sample = dataSource == "tutorial"
    sample = get_sample_for_format(format) if use_sample else None

    if sample is not None:
        sample_name, data = sample
        table_name = sample_name
    else:
        table_name = name
        if format == "column":
            data = ColumnTableData(
                columnLabels=["A", "B"], rows=[], groupLabels=None, groupForColumn=None
            )
        elif format == "xy":
            data = XYTableData(xLabel="X", yLabels=["Y"], x=[], ys=[[]])
        else:
            data = ColumnTableData(
                columnLabels=["A"], rows=[], groupLabels=None, groupForColumn=None
            )

    table = DataTable(
        id=table_id,
        name=table_name,
        format=TableFormatId(format),
        data=data,
        transformations=None,
        viewMode=None,
        tableDataVersion=None,
    )

    project = get_project()
    tables = project.tables + [table]
    from backend.app.models import Project, TableSelection

    set_project(
        Project(
            version=project.version,
            tables=tables,
            analyses=project.analyses,
            graphs=project.graphs,
            layouts=project.layouts,
            selection=TableSelection(tableId=table_id),
        )
    )

    from starlette.responses import HTMLResponse

    table_html = templates.get_template("partials/table_view.html").render(
        {"request": request, "table": table, "project": get_project()}
    )
    sidebar_html = templates.get_template("partials/sidebar.html").render(
        {"request": request, "project": get_project()}
    )

    combined_html = (
        table_html + '<div id="sidebar" hx-swap-oob="outerHTML">' + sidebar_html + "</div>"
    )

    return HTMLResponse(content=combined_html)


@app.post("/tables/{table_id}/data")
async def update_table_data(request: Request, table_id: str, data: dict):
    from backend.app.models import (
        Project,
        DataTable,
        TableFormatId,
        ColumnTableData,
        XYTableData,
        Analysis,
    )

    project = get_project()
    tables = []
    for t in project.tables:
        if t.id == table_id:
            if t.format == TableFormatId.COLUMN:
                tables.append(
                    DataTable(
                        id=t.id,
                        name=t.name,
                        format=t.format,
                        data=ColumnTableData(**data),
                        transformations=t.transformations,
                        view_mode=t.view_mode,
                        table_data_version=(t.table_data_version or 0) + 1,
                    )
                )
            elif t.format == TableFormatId.XY:
                tables.append(
                    DataTable(
                        id=t.id,
                        name=t.name,
                        format=t.format,
                        data=XYTableData(**data),
                        transformations=t.transformations,
                        view_mode=t.view_mode,
                        table_data_version=(t.table_data_version or 1) + 1,
                    )
                )
            else:
                tables.append(t)
        else:
            tables.append(t)

    analyses = []
    for a in project.analyses:
        if a.table_id == table_id:
            analyses.append(
                Analysis(
                    id=a.id,
                    table_id=a.table_id,
                    type=a.type,
                    options=a.options,
                    result=None,
                    error=None,
                )
            )
        else:
            analyses.append(a)

    set_project(
        Project(
            version=project.version,
            tables=tables,
            analyses=analyses,
            graphs=project.graphs,
            layouts=project.layouts,
            selection=project.selection,
        )
    )

    return HTMLResponse(content="ok")


@app.post("/analyses")
async def create_analysis(
    request: Request,
    table_id: str = Form(...),
    analysis_type: str = Form(...),
    options: str = Form(default="{}"),
):
    import json
    from nanoid import generate
    from backend.app.models import Analysis, Project, AnalysisSelection

    opts = json.loads(options) if options else {}
    opts["type"] = analysis_type

    analysis_id = generate()
    analysis = Analysis(
        id=analysis_id,
        table_id=table_id,
        type=analysis_type,
        options=opts,
    )

    project = get_project()
    set_project(
        Project(
            version=project.version,
            tables=project.tables,
            analyses=project.analyses + [analysis],
            graphs=project.graphs,
            layouts=project.layouts,
            selection=AnalysisSelection(analysisId=analysis_id),
        )
    )

    return templates.TemplateResponse(
        "partials/analysis_panel.html",
        {
            "request": request,
            "analysis": analysis,
            "table": next((t for t in get_project().tables if t.id == table_id), None),
            "project": get_project(),
        },
    )


@app.post("/analyses/{analysis_id}/run")
async def run_analysis(request: Request, analysis_id: str):
    from backend.app.engine import run_analysis
    from backend.app.models import Project

    project = get_project()
    analysis = next((a for a in project.analyses if a.id == analysis_id), None)
    if not analysis:
        return HTMLResponse(content="Analysis not found", status_code=404)

    table = next((t for t in project.tables if t.id == analysis.table_id), None)
    if not table:
        return HTMLResponse(content="Table not found", status_code=404)

    try:
        result = run_analysis(table.format, analysis.type, table.data, analysis.options)
        analyses = [
            Analysis(
                id=a.id,
                table_id=a.table_id,
                type=a.type,
                options=a.options,
                result=result if a.id == analysis_id else a.result,
                error=None if a.id == analysis_id else a.error,
            )
            for a in project.analyses
        ]
        set_project(
            Project(
                version=project.version,
                tables=project.tables,
                analyses=analyses,
                graphs=project.graphs,
                layouts=project.layouts,
                selection=project.selection,
            )
        )
    except Exception as e:
        analyses = [
            Analysis(
                id=a.id,
                table_id=a.table_id,
                type=a.type,
                options=a.options,
                result=a.result,
                error=str(e) if a.id == analysis_id else a.error,
            )
            for a in project.analyses
        ]
        set_project(
            Project(
                version=project.version,
                tables=project.tables,
                analyses=analyses,
                graphs=project.graphs,
                layouts=project.layouts,
                selection=project.selection,
            )
        )

    return templates.TemplateResponse(
        "partials/analysis_panel.html",
        {
            "request": request,
            "analysis": next((a for a in get_project().analyses if a.id == analysis_id)),
            "table": table,
            "project": get_project(),
        },
    )


@app.post("/graphs")
async def create_graph(
    request: Request,
    table_id: str = Form(...),
    graph_type: str = Form(...),
    name: str = Form(default=""),
):
    from nanoid import generate
    from backend.app.models import Graph, Project, GraphSelection, GraphOptions

    graph_id = generate()
    graph_name = name or f"Graph {len(get_project().graphs) + 1}"
    graph = Graph(
        id=graph_id,
        name=graph_name,
        table_id=table_id,
        graph_type=graph_type,
        options=GraphOptions(),
    )

    project = get_project()
    graphs = project.graphs + [graph]
    set_project(
        Project(
            version=project.version,
            tables=project.tables,
            analyses=project.analyses,
            graphs=graphs,
            layouts=project.layouts,
            selection=GraphSelection(graphId=graph_id),
        )
    )

    return templates.TemplateResponse(
        "partials/graph_view.html",
        {
            "request": request,
            "graph": graph,
            "table": next((t for t in get_project().tables if t.id == table_id), None),
            "analysis": None,
            "project": get_project(),
        },
    )


@app.post("/selection")
async def set_selection(
    request: Request, selection_type: str = Form(...), item_id: str = Form(...)
):
    from backend.app.models import Project, TableSelection, AnalysisSelection, GraphSelection

    sel = None
    if selection_type == "table":
        sel = TableSelection(tableId=item_id)
    elif selection_type == "analysis":
        sel = AnalysisSelection(analysisId=item_id)
    elif selection_type == "graph":
        sel = GraphSelection(graphId=item_id)

    project = get_project()
    set_project(
        Project(
            version=project.version,
            tables=project.tables,
            analyses=project.analyses,
            graphs=project.graphs,
            layouts=project.layouts,
            selection=sel,
        )
    )

    project = get_project()
    content_html = _get_main_content_html(request, project)
    sidebar_html = templates.get_template("partials/sidebar.html").render(
        {"request": request, "project": project}
    )
    combined = content_html + '<div id="sidebar" hx-swap-oob="outerHTML">' + sidebar_html + "</div>"
    return HTMLResponse(content=combined)


@app.get("/api/analyses/{table_id}")
async def list_allowed_analyses(table_id: str):
    from backend.app.lib import get_allowed_analyses

    project = get_project()
    table = next((t for t in project.tables if t.id == table_id), None)
    if not table:
        return {"error": "Table not found"}
    return {"analyses": [a.value for a in get_allowed_analyses(table.format)]}


@app.get("/api/graphs/{table_id}")
async def list_allowed_graphs(table_id: str):
    from backend.app.lib import get_allowed_graph_types

    project = get_project()
    table = next((t for t in project.tables if t.id == table_id), None)
    if not table:
        return {"error": "Table not found"}
    return {"graphs": [g.value for g in get_allowed_graph_types(table.format)]}


if __name__ == "__main__":
    import uvicorn

    port = random.randint(8000, 9000)
    print(f"Starting server on http://127.0.0.1:{port}")
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=port, reload=True)
