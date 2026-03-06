import { useRef, useCallback } from 'react';
import { exportProject } from '../lib/exportProject';
import { importProject } from '../lib/importProject';
import { parsePrism } from '../io/prism/parsePrism';
import { parsePzfx } from '../io/pzfx/parsePzfx';
import { buildPzfx } from '../io/pzfx/buildPzfx';
import type { Project } from '../types';

const LOCAL_STORAGE_KEY = 'dataplotter-project';

export function useProjectSaveLoad(
  getProject: () => Project,
  setProject: (p: Project) => void
) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveToFile = useCallback(() => {
    const json = exportProject(getProject());
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [getProject]);

  const saveAsPrism = useCallback(() => {
    const pzfx = buildPzfx(getProject());
    const blob = new Blob([pzfx], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project.pzfx';
    a.click();
    URL.revokeObjectURL(url);
  }, [getProject]);

  const loadFromFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        const result = importProject(text);
        if (result.ok) {
          setProject(result.value);
        } else {
          alert(result.error);
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    [setProject]
  );

  const saveToLocalStorage = useCallback(
    (project: Project) => {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, exportProject(project));
      } catch {
        // ignore quota or disabled localStorage
      }
    },
    []
  );

  const loadFromLocalStorage = useCallback(() => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) return;
      const result = importProject(raw);
      if (result.ok) {
        setProject(result.value);
      }
    } catch {
      // ignore
    }
  }, [setProject]);

  const loadPrismRef = useRef<HTMLInputElement>(null);
  const loadAsPrism = useCallback(() => {
    loadPrismRef.current?.click();
  }, []);
  const handlePrismFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const result = await parsePrism(file);
      if (result.ok) {
        setProject(result.value);
      } else {
        alert(result.error);
      }
      e.target.value = '';
    },
    [setProject]
  );

  const loadPzfxRef = useRef<HTMLInputElement>(null);
  const loadAsPzfx = useCallback(() => {
    loadPzfxRef.current?.click();
  }, []);
  const handlePzfxFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const result = parsePzfx(reader.result as ArrayBuffer);
        if (result.ok) {
          setProject(result.value);
          alert('Only table data was imported. Analyses and graphs from the Prism file were not loaded—you can re-run analyses and create graphs here.');
        } else {
          alert(result.error);
        }
      };
      reader.readAsArrayBuffer(file);
      e.target.value = '';
    },
    [setProject]
  );

  return {
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
  };
}
