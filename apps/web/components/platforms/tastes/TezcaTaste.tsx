'use client';

const RESULTS = [
  {
    id: 'NOM-001-STPS-2008',
    description: 'Buildings, premises and areas in work centers',
    badge: 'STPS',
    badgeColor: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  },
  {
    id: 'NOM-035-STPS-2018',
    description: 'Psychosocial risk factors at work',
    badge: 'STPS',
    badgeColor: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  },
  {
    id: 'Ley Federal del Trabajo',
    description: 'Federal Labor Law',
    badge: 'Congress',
    badgeColor: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  },
];

const FORMATS = ['PDF', 'DOCX', 'JSON'];

export function TezcaTaste() {
  return (
    <div
      role="img"
      aria-label="Tezca regulatory search interface showing search results for Mexican laws and norms"
    >
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg overflow-hidden">
        {/* Search bar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <div className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-500 dark:text-gray-400">
              Search Mexican laws and norms...
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="divide-y divide-gray-100 dark:divide-gray-700/60">
          {RESULTS.map(result => (
            <div
              key={result.id}
              className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">{result.id}</h4>
                <span
                  className={`inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-full ${result.badgeColor}`}
                >
                  {result.badge}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2.5">
                {result.description}
              </p>
              <div className="flex gap-1.5">
                {FORMATS.map(fmt => (
                  <span
                    key={fmt}
                    className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors cursor-default"
                  >
                    {fmt}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer counter */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80">
          <p className="text-xs text-gray-400 text-center">
            <span className="font-semibold text-gray-600 dark:text-gray-300">11,696</span> laws
            indexed
          </p>
        </div>
      </div>
    </div>
  );
}
