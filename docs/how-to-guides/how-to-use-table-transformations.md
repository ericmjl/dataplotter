# How to use table transformations

**How-to:** Apply pre-defined transformations to columns, toggle raw vs transformed view, and choose which data analyses and graphs use.

## Add a transformation

1. Select a **Column** or **XY** table in the sidebar.
2. In the table toolbar, click **Transform column…**.
3. In the dialog, choose the **Column** to transform (e.g. the first Y series).
4. Choose a **Transformation** from the dropdown (e.g. **Log (base 10)**, **Square root**, **Ln (natural log)**).
5. Click **Apply**. The table now shows that transformation for that column; you can add more by opening the dialog again and choosing another column.

To **edit** a transformation, open **Transform column…**, select the same column, pick a different transformation, and click **Update**. To **remove** it, select the column, choose **None**, and click **Apply**, or click **Remove**.

## View raw vs transformed in the table

When the table has at least one transformation, the toolbar shows **Raw** and **Transformed**:

- **Raw** — The grid shows the stored data (editable).
- **Transformed** — The grid shows the result of the equations (read-only).

Switching the view does not change the stored data or clear analyses; it only changes what you see.

## Use raw or transformed data in analyses

When the table has transformations, the **Analysis** panel shows a dropdown **Use raw data** / **Use transformed data**:

- **Use raw data** — The analysis runs on the stored values (default).
- **Use transformed data** — The analysis runs on the transformed values (e.g. statistics on log10(y)).

Choose the mode you want and click **Run**. Changing the dropdown does not clear the last result until you run again.

## Use raw or transformed data in graphs

When the table has transformations, the **Graph** toolbar has a dropdown **Use raw data** / **Use transformed data**:

- The chart is built from the selected mode. Switch the dropdown to redraw with the other data.

## Pre-defined transformations

You can apply any of these to a column:

| Transformation   | Description        |
|------------------|--------------------|
| Log (base 10)    | log₁₀(x)           |
| Ln (natural log)| ln(x)              |
| Log₂             | log₂(x)            |
| Square root      | √x                 |
| Square (x²)      | x²                 |
| eˣ               | exponential        |
| Absolute value   | \|x\|              |
| Reciprocal (1/x) | 1/x                |

Values that are invalid for a transform (e.g. log of zero or a negative number) become empty in the transformed view. Changing **raw data** or **transformation definitions** clears analysis results for that table so you can re-run with the new data.
