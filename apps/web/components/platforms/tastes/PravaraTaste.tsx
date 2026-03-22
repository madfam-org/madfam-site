type MachineStatus = 'running' | 'idle' | 'maintenance';

interface Machine {
  name: string;
  status: MachineStatus;
  progress?: number;
  queue?: number;
}

const MACHINES: Machine[] = [
  { name: 'Prusa MK4', status: 'running', progress: 67 },
  { name: 'Bambu X1C', status: 'idle', queue: 3 },
  { name: 'CNC Router', status: 'running', progress: 23 },
  { name: 'Laser K40', status: 'maintenance' },
];

const STATUS_STYLES: Record<MachineStatus, { dot: string; text: string; label: string }> = {
  running: { dot: 'bg-green-500', text: 'text-green-400', label: 'Running' },
  idle: { dot: 'bg-gray-400', text: 'text-gray-400', label: 'Idle' },
  maintenance: { dot: 'bg-amber-500', text: 'text-amber-400', label: 'Maintenance' },
};

const PROTOCOLS = ['OPC-UA', 'MQTT', 'REST'];

export function PravaraTaste() {
  return (
    <div
      role="img"
      aria-label="Pravara MES machine dashboard showing four machines with live status, progress, and protocol integrations"
    >
      {/* Dashboard frame */}
      <div
        className="rounded-xl overflow-hidden border border-gray-700 shadow-2xl"
        style={{ background: '#0f1219' }}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700/60">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"
              aria-hidden="true"
            />
            <span className="text-xs font-semibold text-gray-300 tracking-wide uppercase">
              Pravara-MES Live
            </span>
          </div>
          <span className="text-[10px] text-gray-500 font-mono">4 machines connected</span>
        </div>

        {/* Machine grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
          {MACHINES.map(machine => {
            const style = STATUS_STYLES[machine.status];
            return (
              <div
                key={machine.name}
                className="rounded-lg border border-gray-700/60 p-3.5"
                style={{ background: '#161b26' }}
              >
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-sm font-semibold text-white">{machine.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${style.dot}`} aria-hidden="true" />
                    <span className={`text-xs ${style.text}`}>{style.label}</span>
                  </div>
                </div>

                {machine.progress !== undefined && (
                  <div>
                    <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{machine.progress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-green-500 transition-all duration-1000"
                        style={{ width: `${machine.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {machine.queue !== undefined && (
                  <p className="text-xs text-gray-400">
                    Queue: <span className="text-white font-medium">{machine.queue} jobs</span>
                  </p>
                )}

                {machine.status === 'maintenance' && (
                  <p className="text-xs text-amber-400/80">Scheduled maintenance</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Protocol badges */}
        <div className="flex items-center gap-2 px-4 pb-4">
          <span className="text-[10px] text-gray-500 mr-1">Protocols:</span>
          {PROTOCOLS.map(p => (
            <span
              key={p}
              className="inline-block px-2.5 py-0.5 text-[10px] font-mono font-medium rounded-full border border-gray-600 text-gray-300 bg-gray-800/50"
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
