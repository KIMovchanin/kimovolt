import React, { useEffect, useRef, useState } from 'react';
import { SANDBOX_PRESETS } from '@kimovolt/content';
import {
  parseAndValidateCircuitJson,
  type CircuitComponent,
  type CircuitDocument,
  type ComponentType,
  type MultimeterMode,
  type PinRef,
  type SignalGeneratorConfig,
} from '@kimovolt/simulation';
import { KeyboardShortcutsDialog } from '../components/ui/KeyboardShortcutsDialog';
import { useSimulation } from '../hooks/useSimulation';
import { useApp } from '../state/AppStore';
import { CircuitCanvas, type OverlayOptions } from '../workbench/CircuitCanvas';
import { ComponentInspector } from '../workbench/ComponentInspector';
import { DiagnosticConsole } from '../workbench/DiagnosticConsole';
import { MultimeterWidget } from '../workbench/MultimeterWidget';
import { OscilloscopeWidget } from '../workbench/OscilloscopeWidget';
import { WhatIfPanel } from '../workbench/WhatIfPanel';

const PALETTE_ITEMS: Array<{ type: ComponentType; labelRu: string; labelEn: string }> = [
  { type: 'voltage_source', labelRu: 'Источник DC', labelEn: 'DC Source' },
  { type: 'battery', labelRu: 'Батарея 9V', labelEn: '9V Battery' },
  { type: 'ground', labelRu: 'GND (0V)', labelEn: 'GND (0V)' },
  { type: 'resistor', labelRu: 'Резистор', labelEn: 'Resistor' },
  { type: 'potentiometer', labelRu: 'Потенциометр', labelEn: 'Potentiometer' },
  { type: 'led', labelRu: 'Светодиод', labelEn: 'LED' },
  { type: 'diode', labelRu: 'Диод', labelEn: 'Diode' },
  { type: 'switch_spst', labelRu: 'Выключатель', labelEn: 'Switch' },
  { type: 'pushbutton', labelRu: 'Кнопка', labelEn: 'Button' },
  { type: 'fuse', labelRu: 'Предохранитель', labelEn: 'Fuse' },
  { type: 'voltmeter', labelRu: 'Вольтметр', labelEn: 'Voltmeter' },
  { type: 'ammeter', labelRu: 'Амперметр', labelEn: 'Ammeter' },
  { type: 'logic_input', labelRu: 'Лог. вход', labelEn: 'Logic In' },
  { type: 'logic_gate', labelRu: 'Вентиль AND', labelEn: 'AND Gate' },
  { type: 'logic_output', labelRu: 'Лог. выход', labelEn: 'Logic Out' },
];

export const SandboxPage: React.FC = () => {
  const { lang, t, savedCircuits, saveCircuit, deleteSavedCircuit, addNotebookEntry } = useApp();

  const [doc, setDoc] = useState<CircuitDocument>(() => structuredClone(SANDBOX_PRESETS[1]!.circuit));
  const [history, setHistory] = useState<CircuitDocument[]>([]);
  const [redoStack, setRedoStack] = useState<CircuitDocument[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveName, setSaveName] = useState(doc.name);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [importError, setImportError] = useState<string>('');
  const [showScope, setShowScope] = useState(false);
  const [showWhatIf, setShowWhatIf] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const [overlays, setOverlays] = useState<OverlayOptions>({
    showCurrent: true,
    showVoltage: false,
    showPower: false,
    xrayMode: false,
  });

  const [mmMode, setMmMode] = useState<MultimeterMode>('dc_v');
  const [mmPosPin, setMmPosPin] = useState<PinRef | null>(null);
  const [mmNegPin, setMmNegPin] = useState<PinRef | null>(null);
  const [mmPicker, setMmPicker] = useState<'pos' | 'neg' | null>(null);

  const [scopeSig, setScopeSig] = useState<SignalGeneratorConfig>({
    mode: 'pwm',
    amplitudeV: 5,
    frequencyHz: 500,
    dutyCyclePercent: 40,
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { sim, logicSim } = useSimulation(doc, { sandboxMode: true });

  const applyDocChange = (next: CircuitDocument, recordHistory = true) => {
    if (recordHistory) {
      setHistory((prev) => [...prev.slice(-29), doc]);
      setRedoStack([]);
    }
    setDoc(next);
    setSaveStatus('');
  };

  const undo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1]!;
    setHistory((h) => h.slice(0, -1));
    setRedoStack((r) => [doc, ...r]);
    setDoc(prev);
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const nxt = redoStack[0]!;
    setRedoStack((r) => r.slice(1));
    setHistory((h) => [...h, doc]);
    setDoc(nxt);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Check if user opened /lab?preset=<id> from Projects page
  useEffect(() => {
    try {
      const pending = sessionStorage.getItem('kimovolt-open-circuit');
      if (pending) {
        const parsed = parseAndValidateCircuitJson(pending);
        if (parsed.ok) {
          setDoc(parsed.document);
          setSaveName(parsed.document.name);
        }
        sessionStorage.removeItem('kimovolt-open-circuit');
      }
    } catch {
      // ignore
    }
  }, []);

  const addComponent = (type: ComponentType) => {
    const count = doc.components.filter((c) => c.type === type).length + 1;
    const id = `${type.slice(0, 4)}-${Date.now().toString().slice(-4)}`;
    const defaults: Partial<CircuitComponent['params']> =
      type === 'voltage_source'
        ? { voltage: 5 }
        : type === 'battery'
          ? { voltage: 9 }
          : type === 'resistor'
            ? { resistance: 330 }
            : type === 'potentiometer'
              ? { resistance: 10000, wiperPosition: 0.5 }
              : type === 'led'
                ? { color: 'red' }
                : type === 'switch_spst'
                  ? { closed: true }
                  : type === 'pushbutton'
                    ? { pressed: true }
                    : type === 'fuse'
                      ? { ratedCurrent: 0.25 }
                      : type === 'logic_gate'
                        ? { gateKind: 'AND' }
                        : {};

    const newComp: CircuitComponent = {
      id,
      type,
      label: `${type.slice(0, 3).toUpperCase()}${count}`,
      params: defaults,
      position: { x: 6 + (doc.components.length % 6) * 2, y: 4 + (doc.components.length % 4) * 2 },
      rotation: 0,
    };
    applyDocChange({ ...doc, components: [...doc.components, newComp] }, true);
    setSelectedId(id);
  };

  const handleSave = async () => {
    setSaveStatus(lang === 'ru' ? 'Сохранение...' : 'Saving...');
    try {
      const saved = await saveCircuit(saveName, doc, doc.id.startsWith('circ-') ? doc.id : undefined);
      setDoc(saved.document);
      setSaveStatus(lang === 'ru' ? `✓ Сохранено (${new Date(saved.updatedAt).toLocaleTimeString()})` : `✓ Saved`);
    } catch {
      setSaveStatus(lang === 'ru' ? 'Ошибка сохранения' : 'Save failed');
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(doc.name || 'circuit').replace(/[^a-zA-Z0-9_-]/g, '_')}.kimovolt.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError('');
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const res = parseAndValidateCircuitJson(text);
    if (!res.ok) {
      setImportError(`${res.errorCode}: ${res.details}`);
      return;
    }
    applyDocChange(res.document, true);
    setSaveName(res.document.name);
    e.target.value = '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <span className="kv-mono" style={{ fontSize: '0.76rem', color: 'var(--copper)', letterSpacing: '0.1em' }}>
            SANDBOX WORKBENCH // FREE SIMULATION
          </span>
          <h1 id="main-content" tabIndex={-1} style={{ margin: '0.15rem 0 0', fontSize: '1.5rem' }}>
            {lang === 'ru' ? 'Свободная лаборатория' : 'Free Circuit Laboratory'}
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button type="button" className="kv-btn kv-btn-sm" disabled={history.length === 0} onClick={undo}>
            ↶ Undo
          </button>
          <button type="button" className="kv-btn kv-btn-sm" disabled={redoStack.length === 0} onClick={redo}>
            ↷ Redo
          </button>
          <button type="button" className="kv-btn kv-btn-sm" onClick={handleExport}>
            {t.common.exportJson}
          </button>
          <button type="button" className="kv-btn kv-btn-sm" onClick={() => fileInputRef.current?.click()}>
            {t.common.importJson}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.kimovolt.json"
            onChange={handleImportFile}
            className="visually-hidden"
            aria-label="Import circuit JSON"
          />
          <button type="button" className="kv-btn kv-btn-sm" onClick={() => setShortcutsOpen(true)}>
            ? {t.common.shortcuts}
          </button>
        </div>
      </header>

      {importError && (
        <div role="alert" className="kv-panel" style={{ padding: '0.6rem 0.9rem', borderColor: 'var(--coral)', color: 'var(--coral)', fontSize: '0.86rem' }}>
          {importError}
        </div>
      )}

      {/* Presets & Save Toolbar */}
      <div className="kv-panel" style={{ padding: '0.75rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '0.6rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.84rem' }}>
            <span style={{ color: 'var(--muted)' }}>{lang === 'ru' ? 'Шаблон:' : 'Preset:'}</span>
            <select
              className="kv-input"
              style={{ width: 'auto', padding: '0.32rem 0.55rem' }}
              value=""
              onChange={(e) => {
                const p = SANDBOX_PRESETS.find((x) => x.id === e.target.value);
                if (p) {
                  applyDocChange(structuredClone(p.circuit), true);
                  setSaveName(p.circuit.name);
                  setSelectedId(null);
                }
              }}
            >
              <option value="" disabled>
                {lang === 'ru' ? 'Выбрать пример схемы…' : 'Load example preset…'}
              </option>
              {SANDBOX_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title[lang]}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="kv-btn kv-btn-sm"
            onClick={() =>
              applyDocChange(
                {
                  ...doc,
                  viewMode: doc.viewMode === 'schematic' ? 'breadboard' : 'schematic',
                },
                true
              )
            }
          >
            {doc.viewMode === 'schematic' ? t.workbench.breadboardMode : t.workbench.schematicMode}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="text"
            aria-label={lang === 'ru' ? 'Название схемы' : 'Circuit name'}
            className="kv-input"
            style={{ width: '190px', padding: '0.32rem 0.6rem' }}
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
          />
          <button type="button" className="kv-btn kv-btn-primary kv-btn-sm" onClick={handleSave}>
            {t.common.save}
          </button>
          <button
            type="button"
            className="kv-btn kv-btn-sm"
            onClick={() =>
              addNotebookEntry({
                kind: 'circuit',
                title: saveName || doc.name,
                body: `${doc.components.length} components, ${doc.wires.length} wires, P=${sim.totalSuppliedPowerWatts.toFixed(3)} W`,
              })
            }
          >
            + {lang === 'ru' ? 'Заметка' : 'Notebook'}
          </button>
          {saveStatus && (
            <span className="kv-mono" style={{ fontSize: '0.78rem', color: 'var(--green)' }}>
              {saveStatus}
            </span>
          )}
        </div>
      </div>

      {/* Main Sandbox Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '0.9rem', alignItems: 'start' }}>
        {/* Left Palette + Saved List */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <section className="kv-panel" style={{ padding: '0.85rem' }}>
            <div className="kv-mono" style={{ fontSize: '0.76rem', color: 'var(--copper)', fontWeight: 700, marginBottom: '0.55rem' }}>
              {lang === 'ru' ? 'КОМПОНЕНТЫ' : 'COMPONENTS'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
              {PALETTE_ITEMS.map((item) => (
                <button
                  key={item.type}
                  type="button"
                  className="kv-btn kv-btn-sm"
                  style={{ justifyContent: 'flex-start', fontSize: '0.79rem' }}
                  onClick={() => addComponent(item.type)}
                >
                  + {lang === 'ru' ? item.labelRu : item.labelEn}
                </button>
              ))}
            </div>
          </section>

          {savedCircuits.length > 0 && (
            <section className="kv-panel" style={{ padding: '0.85rem' }}>
              <div className="kv-mono" style={{ fontSize: '0.76rem', color: 'var(--cyan)', fontWeight: 700, marginBottom: '0.45rem' }}>
                {lang === 'ru' ? 'СОХРАНЁННЫЕ СХЕМЫ' : 'SAVED CIRCUITS'}
              </div>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                {savedCircuits.map((sc) => (
                  <li key={sc.id} style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="kv-btn kv-btn-sm"
                      style={{ flex: 1, justifyContent: 'flex-start', overflow: 'hidden', textOverflow: 'ellipsis' }}
                      onClick={() => {
                        applyDocChange(structuredClone(sc.document), true);
                        setSaveName(sc.name);
                      }}
                    >
                      {sc.name}
                    </button>
                    <button
                      type="button"
                      className="kv-btn kv-btn-sm"
                      aria-label={`Delete ${sc.name}`}
                      onClick={() => void deleteSavedCircuit(sc.id)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>

        {/* Center Workbench Canvas */}
        <section style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '0.55rem', minInlineSize: 0 }}>
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`kv-btn kv-btn-sm ${overlays.xrayMode ? 'kv-btn-primary' : ''}`}
              onClick={() => setOverlays((o) => ({ ...o, xrayMode: !o.xrayMode }))}
            >
              {t.workbench.xrayMode}
            </button>
            <button
              type="button"
              className={`kv-btn kv-btn-sm ${overlays.showCurrent ? 'kv-btn-cyan' : ''}`}
              onClick={() => setOverlays((o) => ({ ...o, showCurrent: !o.showCurrent }))}
            >
              {t.workbench.currentOverlay}
            </button>
            <button
              type="button"
              className={`kv-btn kv-btn-sm ${overlays.showVoltage ? 'kv-btn-cyan' : ''}`}
              onClick={() => setOverlays((o) => ({ ...o, showVoltage: !o.showVoltage }))}
            >
              {t.workbench.voltageOverlay}
            </button>
            <button
              type="button"
              className={`kv-btn kv-btn-sm ${overlays.showPower ? 'kv-btn-cyan' : ''}`}
              onClick={() => setOverlays((o) => ({ ...o, showPower: !o.showPower }))}
            >
              {t.workbench.powerOverlay}
            </button>
            <button
              type="button"
              className={`kv-btn kv-btn-sm ${showWhatIf ? 'kv-btn-primary' : ''}`}
              onClick={() => setShowWhatIf((v) => !v)}
            >
              {t.workbench.whatIfMode}
            </button>
            <button
              type="button"
              className={`kv-btn kv-btn-sm ${showScope ? 'kv-btn-primary' : ''}`}
              onClick={() => setShowScope((v) => !v)}
            >
              {t.workbench.oscilloscope}
            </button>
          </div>

          <CircuitCanvas
            doc={doc}
            sim={sim}
            logicSim={logicSim}
            overlays={overlays}
            selectedId={selectedId}
            onSelect={(id) => setSelectedId(id)}
            onChangeDoc={applyDocChange}
            probeState={{ activePicker: mmPicker, posPin: mmPosPin, negPin: mmNegPin }}
            onPickProbePin={(role, pin) => {
              if (role === 'pos') setMmPosPin(pin);
              else setMmNegPin(pin);
              setMmPicker(null);
            }}
          />

          {showScope && <OscilloscopeWidget signal={scopeSig} allowModeSelect onChangeSignal={setScopeSig} />}
        </section>

        {/* Right Instruments & Inspector */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <ComponentInspector
            doc={doc}
            selectedId={selectedId}
            simResult={selectedId ? sim.components[selectedId] : undefined}
            onChangeDoc={applyDocChange}
          />
          {showWhatIf && <WhatIfPanel doc={doc} sim={sim} onChangeDoc={applyDocChange} />}
          <MultimeterWidget
            doc={doc}
            sim={sim}
            mode={mmMode}
            onChangeMode={setMmMode}
            posPin={mmPosPin}
            negPin={mmNegPin}
            activePicker={mmPicker}
            onSetActivePicker={setMmPicker}
            onClearProbes={() => {
              setMmPosPin(null);
              setMmNegPin(null);
              setMmPicker(null);
            }}
          />
          <DiagnosticConsole sim={sim} hasLed={doc.components.some((c) => c.type === 'led')} />
        </aside>
      </div>

      <KeyboardShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
};
