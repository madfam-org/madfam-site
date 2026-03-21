'use client';

import { useState } from 'react';

const BUDGETS = [
  { label: 'Housing', pct: 60, color: 'bg-blue-500' },
  { label: 'Food', pct: 45, color: 'bg-green-500' },
  { label: 'Transport', pct: 30, color: 'bg-amber-500' },
];

const CURRENCIES = ['MXN', 'USD', 'BRL'] as const;

export function DhanamTaste() {
  const [currency, setCurrency] = useState<(typeof CURRENCIES)[number]>('MXN');

  return (
    <div className="flex justify-center">
      {/* Phone frame */}
      <div
        className="relative w-[300px] sm:w-[320px] rounded-[2.5rem] border-[6px] border-gray-800 dark:border-gray-600 bg-gray-900 shadow-2xl overflow-hidden"
        role="img"
        aria-label="Dhanam mobile dashboard mockup showing budget tracking and projections"
      >
        {/* Notch */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-gray-800 dark:bg-gray-600 rounded-b-2xl z-10"
          aria-hidden="true"
        />

        {/* Screen content */}
        <div className="pt-10 pb-8 px-5 bg-white dark:bg-gray-950 min-h-[480px]">
          {/* Currency tabs */}
          <div
            className="flex gap-1 mb-5 bg-gray-100 dark:bg-gray-800 rounded-lg p-1"
            role="tablist"
          >
            {CURRENCIES.map(c => (
              <button
                key={c}
                role="tab"
                aria-selected={currency === c}
                onClick={() => setCurrency(c)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  currency === c
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Monthly Budget */}
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            Monthly Budget
          </h3>
          <div className="space-y-3">
            {BUDGETS.map(b => (
              <div key={b.label}>
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <span>{b.label}</span>
                  <span>{b.pct}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${b.color} transition-all duration-700 ease-out`}
                    style={{ width: `${b.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Projection chart mockup */}
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mt-6 mb-3">
            6-Month Projection
          </h3>
          <div className="relative h-28 rounded-lg bg-gray-50 dark:bg-gray-800 overflow-hidden">
            {/* Gridlines */}
            <div className="absolute inset-0 flex flex-col justify-between py-2" aria-hidden="true">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className="border-b border-gray-200 dark:border-gray-700 border-dashed"
                />
              ))}
            </div>
            {/* Projection curve using SVG */}
            <svg
              viewBox="0 0 260 100"
              className="absolute inset-0 w-full h-full"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="dhanam-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0,80 C40,75 60,50 100,45 C140,40 160,25 200,20 C230,17 250,10 260,8"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
              />
              <path
                d="M0,80 C40,75 60,50 100,45 C140,40 160,25 200,20 C230,17 250,10 260,8 L260,100 L0,100 Z"
                fill="url(#dhanam-gradient)"
              />
            </svg>
            {/* Month labels */}
            <div
              className="absolute bottom-1 left-0 right-0 flex justify-between px-2 text-[10px] text-gray-400"
              aria-hidden="true"
            >
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map(m => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </div>

          {/* Balance */}
          <div className="mt-4 text-center">
            <span className="text-xs text-gray-500 dark:text-gray-400">Projected savings</span>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {currency === 'MXN' ? '$12,400' : currency === 'USD' ? '$720' : 'R$3,600'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
