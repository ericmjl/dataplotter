import { useEffect, useRef } from 'react';
import { useStore } from './store';
import { Sidebar } from './components/Sidebar';
import { TableView } from './components/TableView';
import { AnalysisPanel } from './components/AnalysisPanel';
import { GraphView } from './components/GraphView';
import { LayoutView } from './components/LayoutView';
import { ChatPanel } from './components/ChatPanel';
import { useProjectSaveLoad } from './hooks/useProjectSaveLoad';
import './App.css';

const AUTOSAVE_DEBOUNCE_MS = 1000;

function App() {
  const project = useStore((s) => s.project);
  const setProject = useStore((s) => s.setProject);
  const {
    saveToFile,
    saveAsPrism,
    loadFromFile,
    fileInputRef,
    handleFileChange,
    saveToLocalStorage,
    loadFromLocalStorage,
    loadAsPrism,
    loadPrismRef,
    handlePrismFileChange,
    loadAsPzfx,
    loadPzfxRef,
    handlePzfxFileChange,
  } = useProjectSaveLoad(() => project, setProject);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      loadFromLocalStorage();
    } catch (e) {
      console.error('Failed to load from localStorage:', e);
    }
  }, [loadFromLocalStorage]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveToLocalStorage(project);
      debounceRef.current = null;
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [project, saveToLocalStorage]);

  const selection = project.selection;
  const mainContent =
    selection?.type === 'analysis' ? (
      <AnalysisPanel />
    ) : selection?.type === 'graph' ? (
      <GraphView />
    ) : selection?.type === 'layout' ? (
      <LayoutView />
    ) : (
      <TableView />
    );

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main-wrap">
        <div className="app-content">
          <header className="app-header">
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} style={{ display: 'none' }} aria-hidden="true" />
            <input ref={loadPrismRef} type="file" accept=".prism" onChange={handlePrismFileChange} style={{ display: 'none' }} aria-hidden="true" />
            <input ref={loadPzfxRef} type="file" accept=".pzfx" onChange={handlePzfxFileChange} style={{ display: 'none' }} aria-hidden="true" />

            <div className="header-group">
              <button type="button" onClick={loadFromFile} aria-label="Open JSON">Open</button>
              <button type="button" onClick={saveToFile} aria-label="Save as JSON">Save</button>
              <button type="button" onClick={saveAsPrism} aria-label="Save as Prism">Save as Prism</button>
            </div>
            <div className="header-group">
              <button type="button" onClick={loadAsPrism} aria-label="Open .prism file">Open .prism</button>
              <button type="button" onClick={loadAsPzfx} aria-label="Open .pzfx file">Open .pzfx</button>
            </div>
          </header>
          {mainContent}
        </div>
        <ChatPanel />
      </div>
    </div>
  );
}

export default App;
