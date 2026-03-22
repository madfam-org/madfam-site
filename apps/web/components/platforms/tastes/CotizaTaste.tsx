const STEPS = [
  {
    label: 'Upload',
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
        />
      </svg>
    ),
    content: (
      <div className="mt-3 text-xs">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
          <span className="text-blue-600 dark:text-blue-400 font-mono">gear-bracket.stl</span>
        </div>
        <p className="mt-1.5 text-gray-400">12.4 MB</p>
      </div>
    ),
  },
  {
    label: 'Material',
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
        />
      </svg>
    ),
    content: (
      <div className="mt-3 text-xs space-y-1">
        <div className="px-3 py-2 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-300 dark:border-green-700 font-semibold text-green-700 dark:text-green-300">
          PETG
        </div>
        <p className="text-gray-400">PLA, ABS, Nylon</p>
      </div>
    ),
  },
  {
    label: 'Process',
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.42 15.17l-5.1-3.06a1.5 1.5 0 010-2.58l5.1-3.06a1.5 1.5 0 011.58 0l5.1 3.06a1.5 1.5 0 010 2.58l-5.1 3.06a1.5 1.5 0 01-1.58 0z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 22.5V15" />
      </svg>
    ),
    content: (
      <div className="mt-3 text-xs space-y-1">
        <div className="px-3 py-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 font-semibold text-purple-700 dark:text-purple-300">
          FDM 3D Printing
        </div>
        <p className="text-gray-400">CNC, Laser</p>
      </div>
    ),
  },
  {
    label: 'Price',
    icon: (
      <svg
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    content: (
      <div className="mt-3">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">$23.50</span>
        <span className="ml-2 inline-block px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
          Instant quote
        </span>
      </div>
    ),
  },
];

export function CotizaTaste() {
  return (
    <div
      role="img"
      aria-label="Cotiza Studio automated quoting flow: upload file, select material, choose process, receive instant price"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-0 items-start">
        {STEPS.map((step, i) => (
          <div key={step.label} className="flex items-start">
            {/* Step card */}
            <div className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <span aria-hidden="true">{step.icon}</span>
                <span className="text-sm font-semibold">{step.label}</span>
              </div>
              {step.content}
            </div>

            {/* Arrow connector (desktop) / vertical dots (mobile) */}
            {i < STEPS.length - 1 && (
              <>
                <span
                  className="hidden lg:flex items-center px-2 pt-8 text-gray-300 dark:text-gray-600"
                  aria-hidden="true"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </span>
                <span
                  className="flex lg:hidden justify-center w-full py-2 text-gray-300 dark:text-gray-600"
                  aria-hidden="true"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="4" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="12" cy="20" r="2" />
                  </svg>
                </span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
