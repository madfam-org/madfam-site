interface Message {
  role: 'user' | 'penny';
  text: string;
}

const MESSAGES: Message[] = [
  { role: 'user', text: "What's the status of my latest print job?" },
  {
    role: 'penny',
    text: "Your Prusa MK4 is 67% complete. ETA: 2h 15min. Want me to notify you when it's done?",
  },
  { role: 'user', text: 'Yes, and quote me a new bracket in PETG' },
  {
    role: 'penny',
    text: 'Generating quote via Cotiza Studio... $23.50 for PETG FDM. Shall I place the order?',
  },
];

const COMMANDS = ['Check Pravara-MES', 'Quote on Cotiza', 'Budget on Dhanam'];

export function PennyTaste() {
  return (
    <div
      role="img"
      aria-label="PENNY AI assistant chat interface showing cross-platform ecosystem interactions"
    >
      <div className="max-w-lg mx-auto rounded-xl border border-gray-300 dark:border-gray-700/60 overflow-hidden shadow-lg opacity-90">
        {/* Chat header */}
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-200 dark:border-gray-700/60 bg-gray-50 dark:bg-gray-800/80">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">P</span>
            </div>
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-gray-50 dark:border-gray-800"
              aria-hidden="true"
            />
          </div>
          <div>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">PENNY</span>
            <span className="ml-2 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              In Dev
            </span>
          </div>
        </div>

        {/* Chat messages */}
        <div className="p-4 space-y-3 bg-white dark:bg-gray-900 min-h-[240px]">
          {MESSAGES.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-bl-md'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Chat input bar */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700/60 bg-gray-50 dark:bg-gray-800/80">
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3.5 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-400 dark:text-gray-500">
              Ask PENNY anything...
            </div>
            <div
              className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center cursor-default"
              aria-hidden="true"
            >
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Ecosystem commands */}
      <div className="flex flex-wrap justify-center gap-2 mt-4">
        {COMMANDS.map(cmd => (
          <span
            key={cmd}
            className="inline-block px-3 py-1 text-xs font-medium rounded-full border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800/50 cursor-default"
          >
            {cmd}
          </span>
        ))}
      </div>
    </div>
  );
}
