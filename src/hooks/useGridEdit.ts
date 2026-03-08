import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseGridEditOptions {
  /** When true, grid key handling is disabled (e.g. read-only view). */
  readOnly?: boolean;
  /** Return the display string for the cell at (row, col). Used when entering edit and for ARIA. */
  getCellValue: (row: number, col: number) => string;
  /** Apply the edit: persist draft at (row, col) and notify parent. Hook clears edit state after. */
  onCommit: (row: number, col: number, draft: string) => void;
  /** Called when user cancels edit (Escape). Hook clears edit state after. */
  onCancel?: () => void;
}

export interface UseGridEditReturn {
  focusedRow: number;
  setFocusedRow: (v: number | ((prev: number) => number)) => void;
  focusedCol: number;
  setFocusedCol: (v: number | ((prev: number) => number)) => void;
  isEditMode: boolean;
  setIsEditMode: (v: boolean) => void;
  editDraft: string;
  setEditDraft: (v: string) => void;
  gridRef: React.RefObject<HTMLDivElement | null>;
  moveFocus: (dr: number, dc: number) => void;
  handleGridKeyDown: (e: React.KeyboardEvent) => void;
  handleCellKeyDown: (e: React.KeyboardEvent) => void;
  /** Focus cell (row, col) and enter edit mode. Use for double-click. */
  startEditAt: (row: number, col: number) => void;
  /** Commit current cell and exit edit. Use for onBlur. */
  commitCurrentEdit: () => void;
}

/**
 * Shared Excel-like grid interaction: focus, navigate (arrows/Tab), edit (Enter/F2/double-click),
 * commit (Enter/Tab), cancel (Escape). Use for DataGrid (column/XY) and SurvivalDataGrid.
 */
export function useGridEdit(
  numRows: number,
  numCols: number,
  options: UseGridEditOptions
): UseGridEditReturn {
  const { readOnly = false, getCellValue, onCommit, onCancel } = options;

  const [focusedRow, setFocusedRow] = useState(0);
  const [focusedCol, setFocusedCol] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editDraft, setEditDraft] = useState('');
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isEditMode && gridRef.current) gridRef.current.focus();
  }, [isEditMode]);

  const clampR = useCallback((r: number) => Math.max(0, Math.min(numRows - 1, r)), [numRows]);
  const clampC = useCallback((c: number) => Math.max(0, Math.min(numCols - 1, c)), [numCols]);

  const moveFocus = useCallback(
    (dr: number, dc: number) => {
      setFocusedRow((r) => clampR(r + dr));
      setFocusedCol((c) => clampC(c + dc));
    },
    [clampR, clampC]
  );

  const startEditAt = useCallback(
    (row: number, col: number) => {
      setFocusedRow(row);
      setFocusedCol(col);
      setEditDraft(getCellValue(row, col));
      setIsEditMode(true);
    },
    [getCellValue]
  );

  const handleGridKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (readOnly || isEditMode) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveFocus(1, 0);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveFocus(-1, 0);
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        moveFocus(0, -1);
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        moveFocus(0, 1);
        return;
      }
      if (e.key === 'Enter' || e.key === 'F2') {
        e.preventDefault();
        startEditAt(focusedRow, focusedCol);
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        if (e.shiftKey) {
          if (focusedCol > 0) setFocusedCol((c) => c - 1);
          else if (focusedRow > 0) {
            setFocusedRow((r) => r - 1);
            setFocusedCol(numCols - 1);
          }
        } else {
          if (focusedCol < numCols - 1) setFocusedCol((c) => c + 1);
          else if (focusedRow < numRows - 1) {
            setFocusedRow((r) => r + 1);
            setFocusedCol(0);
          }
        }
        return;
      }
    },
    [readOnly, isEditMode, moveFocus, startEditAt, focusedRow, focusedCol, numRows, numCols]
  );

  const handleCellKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel?.();
        setIsEditMode(false);
        setEditDraft('');
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        onCommit(focusedRow, focusedCol, editDraft);
        setIsEditMode(false);
        setEditDraft('');
        moveFocus(1, 0);
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        onCommit(focusedRow, focusedCol, editDraft);
        setIsEditMode(false);
        setEditDraft('');
        if (e.shiftKey) {
          if (focusedCol > 0) setFocusedCol((c) => c - 1);
          else if (focusedRow > 0) {
            setFocusedRow((r) => r - 1);
            setFocusedCol(numCols - 1);
          }
        } else {
          if (focusedCol < numCols - 1) setFocusedCol((c) => c + 1);
          else if (focusedRow < numRows - 1) {
            setFocusedRow((r) => r + 1);
            setFocusedCol(0);
          }
        }
        return;
      }
    },
    [onCommit, onCancel, focusedRow, focusedCol, editDraft, moveFocus, numRows, numCols]
  );

  const commitCurrentEdit = useCallback(() => {
    onCommit(focusedRow, focusedCol, editDraft);
    setIsEditMode(false);
    setEditDraft('');
  }, [onCommit, focusedRow, focusedCol, editDraft]);

  return {
    focusedRow,
    setFocusedRow,
    focusedCol,
    setFocusedCol,
    isEditMode,
    setIsEditMode,
    editDraft,
    setEditDraft,
    gridRef,
    moveFocus,
    handleGridKeyDown,
    handleCellKeyDown,
    startEditAt,
    commitCurrentEdit,
  };
}
