import React, { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export type RegionOption = { id: string; label: string; count: number };

export function RegionFilter({ label, moreLabel, options, value, onChange, attrName, pin }: {
  label: string;
  moreLabel: string;
  options: RegionOption[];
  value: string;
  onChange: (id: string) => void;
  attrName: 'data-region' | 'data-party-region';
  pin?: string;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const pinned = pin ? options.find(option => option.id === pin) : undefined;
  const pool = pinned ? options.filter(option => option.id !== pin) : options;
  const head = pool.slice(0, 5);
  const rest = pool.slice(5);
  const selectedRest = rest.find(option => option.id === value);
  const shown = selectedRest ? [...head, selectedRest] : head;
  const menu = rest.filter(option => option.id !== selectedRest?.id);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const chip = (option: RegionOption) => (
    <button key={option.id} type="button" className="wa-chip button-xsm" {...{ [attrName]: option.id }} aria-pressed={value === option.id} onClick={() => { onChange(option.id); setOpen(false); }}>
      {option.label}<span className="caption-4">{option.count}</span>
    </button>
  );

  return <div className="hl-regions" ref={root}>
    <label className="hl-region-select">
      <span>{label}</span>
      <select aria-label={label} value={value} onChange={event => onChange(event.target.value)}>
        {options.map(option => <option key={option.id} value={option.id}>{option.label} {option.count}</option>)}
      </select>
    </label>
    <div className="hl-region-chips" role="group" aria-label={label}>
      {shown.map(chip)}
      {pinned && chip(pinned)}
      {menu.length > 0 && <div className="hl-region-more">
        <button type="button" className="wa-chip button-xsm hl-region-more-btn" aria-expanded={open} aria-controls={menuId} onClick={() => setOpen(current => !current)}>
          {moreLabel}<ChevronDown aria-hidden="true" />
        </button>
        <div id={menuId} className="hl-region-menu" hidden={!open} role="group" aria-label={moreLabel}>
          {menu.map(chip)}
        </div>
      </div>}
    </div>
  </div>;
}
