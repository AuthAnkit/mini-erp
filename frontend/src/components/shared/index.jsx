// Shared reusable UI components

export function Badge({ status }) {
  const colors = {
    DRAFT: 'bg-gray-700 text-gray-300',
    CONFIRMED: 'bg-blue-900/60 text-blue-300 border border-blue-700',
    PARTIALLY_DELIVERED: 'bg-yellow-900/60 text-yellow-300 border border-yellow-700',
    FULLY_DELIVERED: 'bg-green-900/60 text-green-300 border border-green-700',
    PARTIALLY_RECEIVED: 'bg-yellow-900/60 text-yellow-300 border border-yellow-700',
    FULLY_RECEIVED: 'bg-green-900/60 text-green-300 border border-green-700',
    IN_PROGRESS: 'bg-purple-900/60 text-purple-300 border border-purple-700',
    DONE: 'bg-green-900/60 text-green-300 border border-green-700',
    CANCELLED: 'bg-red-900/60 text-red-300 border border-red-700',
    AVAILABLE: 'bg-green-900/60 text-green-300',
    NOT_AVAILABLE: 'bg-red-900/60 text-red-300',
    PARTIALLY_AVAILABLE: 'bg-yellow-900/60 text-yellow-300',
    OK: 'bg-green-900/60 text-green-300',
    LOW: 'bg-yellow-900/60 text-yellow-300',
    CRITICAL: 'bg-red-900/60 text-red-300',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[status] || 'bg-gray-700 text-gray-300'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-[#1a1d27] border border-[#2a2d3e] rounded-xl ${className}`}>
      {children}
    </div>
  );
}

export function Button({ children, variant = 'primary', onClick, disabled, size = 'md', className = '' }) {
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-500 text-white',
    secondary: 'bg-[#2a2d3e] hover:bg-[#3a3d4e] text-gray-200',
    success: 'bg-emerald-700 hover:bg-emerald-600 text-white',
    danger: 'bg-red-800 hover:bg-red-700 text-white',
    warning: 'bg-amber-700 hover:bg-amber-600 text-white',
    ghost: 'hover:bg-[#2a2d3e] text-gray-300',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${variants[variant]} ${sizes[size]} rounded-lg font-medium transition-all
        disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

export function Input({ label, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs text-gray-400 font-medium">{label}</label>}
      <input
        {...props}
        className="bg-[#0f1117] border border-[#2a2d3e] rounded-lg px-3 py-2 text-sm text-gray-200
          focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50
          placeholder:text-gray-600 transition-colors"
      />
    </div>
  );
}

export function Select({ label, children, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs text-gray-400 font-medium">{label}</label>}
      <select
        {...props}
        className="bg-[#0f1117] border border-[#2a2d3e] rounded-lg px-3 py-2 text-sm text-gray-200
          focus:outline-none focus:border-indigo-500 transition-colors"
      >
        {children}
      </select>
    </div>
  );
}

export function StatCard({ label, value, sub, color = 'indigo', icon }) {
  const colors = {
    indigo: 'text-indigo-400',
    green: 'text-emerald-400',
    yellow: 'text-amber-400',
    red: 'text-red-400',
    purple: 'text-purple-400',
  };
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
          <p className={`text-3xl font-bold ${colors[color]}`}>{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
        </div>
        {icon && <div className={`text-2xl ${colors[color]} opacity-60`}>{icon}</div>}
      </div>
    </Card>
  );
}

export function Modal({ open, onClose, title, children, width = 'max-w-2xl' }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-[#1a1d27] border border-[#2a2d3e] rounded-2xl w-full ${width} max-h-[90vh] overflow-auto shadow-2xl`}>
        <div className="flex items-center justify-between p-5 border-b border-[#2a2d3e]">
          <h2 className="text-lg font-semibold text-gray-100">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Table({ headers, children, empty = 'No records found' }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#2a2d3e]">
            {headers.map(h => (
              <th key={h} className="text-left py-3 px-4 text-xs text-gray-500 uppercase tracking-wider font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function Tr({ children, onClick }) {
  return (
    <tr
      onClick={onClick}
      className={`border-b border-[#1e2130] ${onClick ? 'cursor-pointer hover:bg-[#1e2130] transition-colors' : ''}`}
    >
      {children}
    </tr>
  );
}

export function Td({ children, className = '' }) {
  return <td className={`py-3 px-4 text-gray-300 ${className}`}>{children}</td>;
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function EmptyState({ message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4 opacity-30">📭</div>
      <p className="text-gray-500">{message}</p>
      {action}
    </div>
  );
}
