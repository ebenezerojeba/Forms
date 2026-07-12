import React, { useState } from 'react';
import { useOfflineForm } from '../hooks/useOfflineForm';
import { useLocations } from '../hooks/useLocations';
import { Wifi, WifiOff, RefreshCw, FileText } from 'lucide-react';

export default function FormManager() {
  const { isOnline, queueCount, syncing, syncErrors, dismissSyncError, submitForm, triggerManualSync } = useOfflineForm();
  const {
    lgas, wards, pollingUnits,
    selectedLga, selectedWard,
    selectLga, selectWard,
    loadingLgas, loadingWards, loadingPUs,
    error: locationError,
  } = useLocations();

  const [formData, setFormData] = useState({
    fullName: '', address: '', telNo: '', email: '', sex: '', dateOfBirth: '', maritalStatus: '',
    lga: '', ward: '', puName: '', puCode: '', pvcNumber: '', nin: '',
    bankDetails: { bankName: '', accountNo: '', accountName: '' }
  });
  const [uiMessage, setUiMessage] = useState({ text: '', type: '' });

  const handleTopLevelChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBankChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      bankDetails: { ...prev.bankDetails, [name]: value }
    }));
  };

  // --- Cascading location handlers ---------------------------------
  const handleLgaChange = (e) => {
    const lga = e.target.value;
    selectLga(lga);
    // Clear everything downstream so a stale ward/PU from a previous
    // LGA can never travel with a new one.
    setFormData(prev => ({ ...prev, lga, ward: '', puName: '', puCode: '' }));
  };

  const handleWardChange = (e) => {
    const ward = e.target.value;
    selectWard(ward);
    setFormData(prev => ({ ...prev, ward, puName: '', puCode: '' }));
  };

  const handlePuChange = (e) => {
    // The select's value is the puCode; look up the matching name so
    // both fields get set from one selection — the person only ever
    // picks a polling unit, never types a code.
    const puCode = e.target.value;
    const pu = pollingUnits.find(p => p.puCode === puCode);
    setFormData(prev => ({ ...prev, puCode, puName: pu ? pu.puName : '' }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setUiMessage({ text: '', type: '' });

    if (!formData.fullName || !formData.telNo || !formData.lga || !formData.puCode || !formData.bankDetails.accountNo) {
      setUiMessage({ text: 'Please complete all critical starred (*) form parameters.', type: 'error' });
      return;
    }

    const result = await submitForm(formData);

    if (!result.success) {
      // Server definitively rejected this (duplicate NIN/PVC, mismatched
      // polling unit, bad field) — it was NOT queued offline, so the
      // person needs to fix and resubmit rather than assume it saved.
      setUiMessage({ text: result.error, type: 'error' });
      return;
    }

    setFormData({
      fullName: '', address: '', telNo: '', email: '', sex: '', dateOfBirth: '', maritalStatus: '',
      lga: '', ward: '', puName: '', puCode: '', pvcNumber: '', nin: '',
      bankDetails: { bankName: '', accountNo: '', accountName: '' }
    });
    selectLga('');

    if (result.status === 'online') {
      setUiMessage({ text: 'PUC Member Nomination Document pushed directly to database!', type: 'success' });
    } else {
      setUiMessage({ text: 'Saved locally inside device database memory. Sync will deploy automatically.', type: 'warning' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Sync Indicator Banner */}
        <div className={`p-4 rounded-xl border flex items-center justify-between shadow-sm ${
          isOnline ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-center gap-3">
            {isOnline ? <Wifi className="h-5 w-5 text-emerald-600 animate-pulse" /> : <WifiOff className="h-5 w-5 text-amber-600" />}
            <div>
              <p className="font-bold text-xs uppercase tracking-wider">Operational Node Status</p>
              <p className="text-sm">{isOnline ? 'System Live - Direct Core Pipelines Active' : 'Offline Engine Engaged — Writes Caching on Client Device'}</p>
            </div>
          </div>
          {queueCount > 0 && (
            <button onClick={triggerManualSync} disabled={syncing || !isOnline} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg text-xs font-bold border text-slate-700 shadow-sm hover:bg-slate-50">
              <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} /> Flush Local Logs ({queueCount})
            </button>
          )}
        </div>

        {/* Permanently failed queued submissions — surfaced, not silently dropped */}
        {syncErrors.length > 0 && (
          <div className="space-y-2">
            {syncErrors.map((err) => (
              <div key={err.localId} className="p-3 rounded-lg border bg-rose-50 border-rose-200 text-rose-900 text-xs flex items-center justify-between gap-3">
                <span><strong>{err.fullName || 'A queued submission'}</strong> could not be saved: {err.error}</span>
                <button onClick={() => dismissSyncError(err.localId)} className="shrink-0 font-bold underline">Dismiss</button>
              </div>
            ))}
          </div>
        )}

        {/* Core Nomination Form Surface Layout */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="bg-slate-900 p-6 text-white border-b border-slate-800 text-center">
            <h2 className="text-lg font-black tracking-wider uppercase text-emerald-400">Polling Unit Committee (PUC)</h2>
            <h1 className="text-xl font-bold tracking-tight text-white mt-0.5">MEMBER'S NOMINATION FORM</h1>
          </div>

          <form onSubmit={handleFormSubmit} className="p-6 space-y-6 divide-y divide-slate-100">

            {/* SECTION 1: Personal Particulars */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><FileText className="h-4 w-4 text-slate-400" /> 01. Personal Identity Data</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Full Name *</label>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleTopLevelChange} className="w-full px-3 py-2 border rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-slate-900" placeholder="SURNAME Firstname Othername" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Residential Address *</label>
                  <input type="text" name="address" value={formData.address} onChange={handleTopLevelChange} className="w-full px-3 py-2 border rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-slate-900" placeholder="Street Number, Ward Block Location" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Telephone Number *</label>
                  <input type="tel" name="telNo" value={formData.telNo} onChange={handleTopLevelChange} className="w-full px-3 py-2 border rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-slate-900" placeholder="08012345678" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">E-Mail Address</label>
                  <input type="email" name="email" value={formData.email} onChange={handleTopLevelChange} className="w-full px-3 py-2 border rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-slate-900" placeholder="nominee@domain.com" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Sex *</label>
                  <select name="sex" value={formData.sex} onChange={handleTopLevelChange} className="w-full px-3 py-2 border rounded-lg text-sm text-slate-800 bg-white focus:ring-2 focus:ring-slate-900">
                    <option value="">Select Gender</option>
                    <option value="M">Male (M)</option>
                    <option value="F">Female (F)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Date of Birth *</label>
                  <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleTopLevelChange} className="w-full px-3 py-2 border rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-slate-900" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Marital Status *</label>
                  <select name="maritalStatus" value={formData.maritalStatus} onChange={handleTopLevelChange} className="w-full px-3 py-2 border rounded-lg text-sm text-slate-800 bg-white focus:ring-2 focus:ring-slate-900">
                    <option value="">Select Status</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 2: Election and Boundary Records */}
            <div className="pt-5 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><FileText className="h-4 w-4 text-slate-400" /> 02. Election Assignment Fields</h3>

              {locationError && (
                <p className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2.5">{locationError}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">LGA *</label>
                  <select
                    name="lga"
                    value={selectedLga}
                    onChange={handleLgaChange}
                    disabled={loadingLgas}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-slate-800 bg-white focus:ring-2 focus:ring-slate-900 disabled:opacity-60"
                  >
                    <option value="">{loadingLgas ? 'Loading LGAs…' : 'Select LGA'}</option>
                    {lgas.map((lga) => (
                      <option key={lga} value={lga}>{lga}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Ward *</label>
                  <select
                    name="ward"
                    value={selectedWard}
                    onChange={handleWardChange}
                    disabled={!selectedLga || loadingWards}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-slate-800 bg-white focus:ring-2 focus:ring-slate-900 disabled:opacity-60"
                  >
                    <option value="">
                      {!selectedLga ? 'Select an LGA first' : loadingWards ? 'Loading wards…' : 'Select Ward'}
                    </option>
                    {wards.map((ward) => (
                      <option key={ward} value={ward}>{ward}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Polling Unit *</label>
                  <select
                    name="puCode"
                    value={formData.puCode}
                    onChange={handlePuChange}
                    disabled={!selectedWard || loadingPUs}
                    className="w-full px-3 py-2 border rounded-lg text-sm text-slate-800 bg-white focus:ring-2 focus:ring-slate-900 disabled:opacity-60"
                  >
                    <option value="">
                      {!selectedWard ? 'Select a ward first' : loadingPUs ? 'Loading polling units…' : 'Select Polling Unit'}
                    </option>
                    {pollingUnits.map((pu) => (
                      <option key={pu.puCode} value={pu.puCode}>
                        {pu.puName} — {pu.puCode}
                      </option>
                    ))}
                  </select>
                  {formData.puCode && (
                    <p className="text-[11px] text-slate-500 mt-1">PU Code: <span className="font-mono font-semibold text-slate-700">{formData.puCode}</span></p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">PVC Number (Permanent Voter Card) *</label>
                  <input type="text" name="pvcNumber" value={formData.pvcNumber} onChange={handleTopLevelChange} className="w-full px-3 py-2 border rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-slate-900" placeholder="Enter Full Card String" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">NIN (National Identification No) *</label>
                  <input type="text" name="nin" value={formData.nin} onChange={handleTopLevelChange} maxLength={11} className="w-full px-3 py-2 border rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-slate-900" placeholder="11-Digit Number" />
                </div>
              </div>
              <p className="text-[11px] font-semibold text-slate-500 bg-slate-50 p-2.5 rounded border border-dashed border-slate-200">
                ⚠️ NOTE: Remind candidate to provide a clean and clear physical photocopy of their Permanent Voter's Card (PVC) alongside this submittal.
              </p>
            </div>

            {/* SECTION 3: Banking Remittance Details */}
            <div className="pt-5 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2"><FileText className="h-4 w-4 text-slate-400" /> 03. Financial Clearance Matrix</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Bank Name *</label>
                  <input type="text" name="bankName" value={formData.bankDetails.bankName} onChange={handleBankChange} className="w-full px-3 py-2 border rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-slate-900" placeholder="GTBank, Zenith, etc." />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Account Number *</label>
                  <input type="text" name="accountNo" value={formData.bankDetails.accountNo} onChange={handleBankChange} maxLength={10} className="w-full px-3 py-2 border rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-slate-900" placeholder="10 Digits" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Account Name *</label>
                  <input type="text" name="accountName" value={formData.bankDetails.accountName} onChange={handleBankChange} className="w-full px-3 py-2 border rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-slate-900" placeholder="Must Match Full Name" />
                </div>
              </div>
            </div>

            {/* Feedback Notifications Block */}
            {uiMessage.text && (
              <div className={`mt-4 p-3 rounded-lg text-xs font-bold border ${
                uiMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                uiMessage.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {uiMessage.text}
              </div>
            )}

            <div className="pt-4">
              <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-widest shadow-md transition-all active:scale-[0.99]">
                Submit Committee Member Nomination
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}