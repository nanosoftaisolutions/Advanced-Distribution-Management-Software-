import React, { useState } from 'react';
import {
  Settings,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Shield,
  FileCode
} from 'lucide-react';
import { usePDMS } from '../context/PDMSContext';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';

export const BackupSettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    exportDatabaseJSON,
    importDatabaseJSON,
    resetToDemoData
  } = usePDMS();

  const [formSettings, setFormSettings] = useState(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string>('');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formSettings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDownloadBackup = () => {
    const jsonStr = exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PDMS_Backup_${settings.distributionName.replace(/\s+/g, '_')}_${
      new Date().toISOString().split('T')[0]
    }.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importDatabaseJSON(content);
        if (ok) {
          setImportStatus('Database successfully restored from JSON backup archive!');
        } else {
          setImportStatus('Error: Invalid backup file format or corrupt JSON structure.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <h2 className="text-lg font-bold text-white tracking-tight">System Settings & Data Governance</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Configure distribution entity legal details, FBR invoice parameters, FEFO algorithms, and automated JSON backups
        </p>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4 text-xs">
        {saveSuccess && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-800 rounded text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Distribution configuration successfully updated and persisted!</span>
          </div>
        )}

        <div className="border-b border-slate-800 pb-2">
          <h3 className="text-sm font-semibold text-white">Distribution License & Legal Information</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Distribution Business Name *</label>
            <input
              type="text"
              required
              value={formSettings.distributionName}
              onChange={e => setFormSettings({ ...formSettings, distributionName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Drug Distribution License # (DRAP/Provincial) *</label>
            <input
              type="text"
              required
              value={formSettings.distributorDrugLicense}
              onChange={e => setFormSettings({ ...formSettings, distributorDrugLicense: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-slate-300 font-medium mb-1">National Tax Number (NTN) *</label>
            <input
              type="text"
              required
              value={formSettings.ntn}
              onChange={e => setFormSettings({ ...formSettings, ntn: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Sales Tax Registration (STRN) *</label>
            <input
              type="text"
              required
              value={formSettings.strn}
              onChange={e => setFormSettings({ ...formSettings, strn: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Operating City</label>
            <input
              type="text"
              value={formSettings.distributionCity}
              onChange={e => setFormSettings({ ...formSettings, distributionCity: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-300 font-medium mb-1">Commercial Physical Address</label>
          <input
            type="text"
            value={formSettings.distributionAddress}
            onChange={e => setFormSettings({ ...formSettings, distributionAddress: e.target.value })}
            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
          />
        </div>

        {/* Operating Rules */}
        <div className="border-b border-slate-800 pb-2 pt-4">
          <h3 className="text-sm font-semibold text-white">Inventory & Regulatory Constraints</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Near Expiry Alert Horizon (Days)</label>
            <input
              type="number"
              value={formSettings.nearExpiryThresholdDays}
              onChange={e =>
                setFormSettings({ ...formSettings, nearExpiryThresholdDays: parseInt(e.target.value) || 90 })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Critical Expiry Horizon (Days)</label>
            <input
              type="number"
              value={formSettings.criticalExpiryDays}
              onChange={e =>
                setFormSettings({ ...formSettings, criticalExpiryDays: parseInt(e.target.value) || 30 })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono"
            />
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formSettings.strictFefoEnforced}
              onChange={e => setFormSettings({ ...formSettings, strictFefoEnforced: e.target.checked })}
              className="rounded text-emerald-500"
            />
            <span className="text-slate-300">
              Enforce strict FEFO (First Expiry First Out) algorithm across all invoice allocations
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formSettings.requireCreditLimitOverrideApproval}
              onChange={e =>
                setFormSettings({ ...formSettings, requireCreditLimitOverrideApproval: e.target.checked })
              }
              className="rounded text-emerald-500"
            />
            <span className="text-slate-300">
              Require Owner / Manager override authorization when invoicing customers exceeding credit limits
            </span>
          </label>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-800">
          <button
            type="submit"
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold cursor-pointer shadow-sm"
          >
            Save System Settings
          </button>
        </div>
      </form>

      {/* Backup & Restore Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4 text-xs">
        <div className="border-b border-slate-800 pb-2">
          <h3 className="text-sm font-semibold text-white">Database Backup & Disaster Recovery</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Export complete ERP state (companies, batches, inventory, invoices, ledgers) as encrypted JSON or restore from file
          </p>
        </div>

        {importStatus && (
          <div className="p-3 bg-slate-950 border border-slate-800 rounded text-slate-200">
            {importStatus}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Export JSON */}
          <button
            onClick={handleDownloadBackup}
            className="p-4 bg-slate-950 border border-slate-800 hover:border-emerald-500/60 rounded-lg text-left transition-colors cursor-pointer group"
          >
            <Download className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
            <div className="font-semibold text-white">Download JSON Backup</div>
            <div className="text-[10px] text-slate-400 mt-1">Full database snapshot with all audit trails</div>
          </button>

          {/* Import JSON */}
          <label className="p-4 bg-slate-950 border border-slate-800 hover:border-sky-500/60 rounded-lg text-left transition-colors cursor-pointer group block">
            <Upload className="w-5 h-5 text-sky-400 mb-2 group-hover:scale-110 transition-transform" />
            <div className="font-semibold text-white">Restore from Backup</div>
            <div className="text-[10px] text-slate-400 mt-1">Select and load valid PDMS backup JSON</div>
            <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
          </label>

          {/* Reset to Demo */}
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="p-4 bg-slate-950 border border-slate-800 hover:border-rose-500/60 rounded-lg text-left transition-colors cursor-pointer group"
          >
            <RotateCcw className="w-5 h-5 text-rose-400 mb-2 group-hover:scale-110 transition-transform" />
            <div className="font-semibold text-white">Reset to Baseline Data</div>
            <div className="text-[10px] text-slate-400 mt-1">
              Restore authentic Getz, Sami, GSK, Searle Pakistani distribution dataset
            </div>
          </button>
        </div>
      </div>

      {/* CONFIRM RESET MODAL */}
      {isResetConfirmOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsResetConfirmOpen(false)}
          title="Confirm Database Reset"
          subtitle="All current transactions will be replaced with fresh Pakistani pharma sample dataset"
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-300">
              This action will reset your local database to the pristine baseline with Getz Pharma, GSK, Sami, Abbott,
              realistic batches, and customers.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  resetToDemoData();
                  setIsResetConfirmOpen(false);
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded font-semibold cursor-pointer"
              >
                Reset Database
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
