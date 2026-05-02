import React, { useState } from 'react';
import type { Preset } from './presets';

interface PresetSelectorProps {
  presets: Preset[];
  onLoad: (preset: Preset) => void;
  onSave: (name: string) => void;
  onDelete: (name: string) => void;
}

export function PresetSelector({ presets, onLoad, onSave, onDelete }: PresetSelectorProps) {
  const [selected, setSelected] = useState<string>('');
  const [saveName, setSaveName] = useState<string>('');

  function handleLoad() {
    const preset = presets.find((p) => p.name === selected);
    if (preset) onLoad(preset);
  }

  function handleSave() {
    const name = saveName.trim();
    if (!name) return;
    onSave(name);
    setSaveName('');
  }

  function handleDelete() {
    if (!selected) return;
    onDelete(selected);
    setSelected('');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', gap: '4px' }}>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          style={{ flex: 1 }}
        >
          <option value="">-- select preset --</option>
          {presets.map((p) => (
            <option key={p.name} value={p.name}>
              {p.name}
            </option>
          ))}
        </select>
        <button onClick={handleLoad} disabled={!selected}>
          Load
        </button>
        <button onClick={handleDelete} disabled={!selected}>
          Delete
        </button>
      </div>
      <div style={{ display: 'flex', gap: '4px' }}>
        <input
          type="text"
          placeholder="preset name"
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
          style={{ flex: 1 }}
        />
        <button onClick={handleSave} disabled={!saveName.trim()}>
          Save as
        </button>
      </div>
    </div>
  );
}
