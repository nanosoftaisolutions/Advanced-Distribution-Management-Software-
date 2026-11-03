import React from 'react';
import { X, AlertTriangle, AlertCircle, Clock, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { usePDMS } from '../context/PDMSContext';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (module: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose, onNavigate }) => {
  const { notifications } = usePDMS();

  if (!isOpen) return null;

  const getSeverityIcon = (type: string, severity: string) => {
    if (severity === 'critical') return <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />;
    if (severity === 'high') return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />;
    if (type === 'expiry') return <Clock className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />;
    if (type === 'credit') return <ShieldAlert className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />;
    return <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl">
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div>
            <h3 className="text-sm font-semibold text-white">System Alerts & Reminders</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {notifications.length} active distribution notifications
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length > 0 ? (
            notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => {
                  if (notif.linkModule) {
                    onNavigate(notif.linkModule);
                    onClose();
                  }
                }}
                className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                  notif.severity === 'critical'
                    ? 'bg-rose-950/20 border-rose-900/40 hover:border-rose-700/60'
                    : notif.severity === 'high'
                    ? 'bg-amber-950/20 border-amber-900/40 hover:border-amber-700/60'
                    : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {getSeverityIcon(notif.type, notif.severity)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-semibold text-white truncate">{notif.title}</h4>
                      <span className="text-[10px] text-slate-500 uppercase font-mono">{notif.type}</span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{notif.message}</p>
                    {notif.linkModule && (
                      <div className="mt-2 text-[11px] font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                        <span>Review in {notif.linkModule.toUpperCase()} →</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 text-slate-500">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500/50 mb-2" />
              <p className="text-sm font-medium text-slate-400">All Systems Nominal</p>
              <p className="text-xs text-slate-600 mt-1">No pending expiry or credit limit alerts</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 text-center">
          <p className="text-[11px] text-slate-500">
            Alert rules configured under System Settings (Near-expiry: 90 days)
          </p>
        </div>
      </div>
    </div>
  );
};
