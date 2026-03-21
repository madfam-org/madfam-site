'use client';

import { useState } from 'react';

const DESIGNS = [
  { name: 'Hex Vase', creator: 'maria_3d', downloads: 1240, from: '#6366f1', to: '#a855f7' },
  { name: 'Lattice Shelf', creator: 'taller_mx', downloads: 890, from: '#059669', to: '#34d399' },
  { name: 'Gear Box', creator: 'fab_studio', downloads: 2100, from: '#d97706', to: '#fbbf24' },
  { name: 'Wave Lamp', creator: 'luz_lab', downloads: 670, from: '#e11d48', to: '#fb7185' },
  { name: 'Snap Joint', creator: 'open_mech', downloads: 1560, from: '#0891b2', to: '#22d3ee' },
  { name: 'Tile Module', creator: 'parametrik', downloads: 430, from: '#7c3aed', to: '#c084fc' },
];

const PARAMS = [
  { label: 'Height', min: 20, max: 200, unit: 'mm', initial: 120 },
  { label: 'Width', min: 10, max: 150, unit: 'mm', initial: 80 },
  { label: 'Wall Thickness', min: 0.4, max: 4, unit: 'mm', initial: 1.6 },
];

export function Yantra4DTaste() {
  const [params, setParams] = useState(PARAMS.map(p => p.initial));

  function handleSlider(index: number, value: number) {
    setParams(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Design gallery */}
      <div className="lg:col-span-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {DESIGNS.map(d => (
            <div
              key={d.name}
              className="group rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Gradient placeholder with geometric shape */}
              <div
                className="h-28 relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${d.from}, ${d.to})` }}
                aria-hidden="true"
              >
                {/* Geometric overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                  <div
                    className="w-16 h-16 border-4 border-white rounded-lg"
                    style={{ transform: 'rotate(45deg)' }}
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                  <div className="w-10 h-10 border-2 border-white rounded-full" />
                </div>
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {d.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">by {d.creator}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {d.downloads.toLocaleString()} downloads
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Parameter sliders */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Customize</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Adjust parameters to generate your variant
        </p>

        <div className="space-y-5">
          {PARAMS.map((p, i) => (
            <div key={p.label}>
              <div className="flex justify-between text-sm mb-1.5">
                <label
                  htmlFor={`param-${i}`}
                  className="font-medium text-gray-700 dark:text-gray-300"
                >
                  {p.label}
                </label>
                <span className="tabular-nums text-gray-900 dark:text-white font-semibold">
                  {params[i]}
                  <span className="text-gray-400 font-normal ml-0.5">{p.unit}</span>
                </span>
              </div>
              <input
                id={`param-${i}`}
                type="range"
                min={p.min}
                max={p.max}
                step={p.max <= 4 ? 0.1 : 1}
                value={params[i]}
                onChange={e => handleSlider(i, parseFloat(e.target.value))}
                className="w-full h-2 rounded-full appearance-none bg-gray-200 dark:bg-gray-700 accent-purple-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
                <span>
                  {p.min}
                  {p.unit}
                </span>
                <span>
                  {p.max}
                  {p.unit}
                </span>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="mt-6 w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          onClick={() => {}}
          aria-label="Export STL (mockup, no action)"
        >
          Export STL
        </button>
        <p className="mt-2 text-[10px] text-gray-400 text-center">
          Preview only -- full export on the platform
        </p>
      </div>
    </div>
  );
}
