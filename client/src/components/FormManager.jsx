// import React, { useState } from 'react';
// import { useOfflineForm } from '../hooks/useOfflineForm';
// import { useLocations } from '../hooks/useLocations';
// import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

// // Generic seal placeholder — NOT the party emblem. Swap the <g> contents
// // for the authorized APC crest asset; keep the viewBox and circle so it
// // drops in cleanly wherever <Seal /> is used below.
// function Seal({ className = '' }) {
//   return (
//     <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
//       <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="2" />
//       <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="1" />
//       {Array.from({ length: 24 }).map((_, i) => {
//         const angle = (i * 360) / 24;
//         const rad = (angle * Math.PI) / 180;
//         const x1 = 50 + 40 * Math.cos(rad);
//         const y1 = 50 + 40 * Math.sin(rad);
//         const x2 = 50 + 44 * Math.cos(rad);
//         const y2 = 50 + 44 * Math.sin(rad);
//         return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="1.5" />;
//       })}
//       <path
//         d="M50 28 L55.5 43 L71 43 L58.5 52 L63 67 L50 58 L37 67 L41.5 52 L29 43 L44.5 43 Z"
//         fill="currentColor"
//       />
//     </svg>
//   );
// }

// function SectionHeading({ letter, title }) {
//   return (
//     <div className="flex items-baseline gap-3 mb-1">
//       <span
//         className="font-mono text-[11px] font-semibold text-puc-brass border border-puc-brass/50 rounded px-1.5 py-0.5"
//       >
//         PART {letter}
//       </span>
//       <h3 className="font-body text-xs font-bold uppercase tracking-[0.15em] text-puc-green">
//         {title}
//       </h3>
//     </div>
//   );
// }

// const inputClass =
//   "w-full px-3 py-2.5 bg-white border border-puc-paper-line rounded-md text-sm text-puc-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-puc-green/40 focus:border-puc-green transition-colors";
// const labelClass = "block text-[11px] font-semibold uppercase tracking-wide text-puc-ink/70 mb-1";

// export default function FormManager() {
//   const { isOnline, queueCount, syncing, syncErrors, dismissSyncError, submitForm, triggerManualSync } = useOfflineForm();
//   const {
//     lgas, wards, pollingUnits,
//     selectedLga, selectedWard,
//     selectLga, selectWard,
//     loadingLgas, loadingWards, loadingPUs,
//     error: locationError,
//   } = useLocations();

//   const [formData, setFormData] = useState({
//     fullName: '', address: '', telNo: '', email: '', sex: '', dateOfBirth: '', maritalStatus: '',
//     lga: '', ward: '', puName: '', puCode: '', pvcNumber: '', nin: '',
//     bankDetails: { bankName: '', accountNo: '', accountName: '' }
//   });
//   const [uiMessage, setUiMessage] = useState({ text: '', type: '' });

//   const handleTopLevelChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   const handleBankChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       bankDetails: { ...prev.bankDetails, [name]: value }
//     }));
//   };

//   const handleLgaChange = (e) => {
//     const lga = e.target.value;
//     selectLga(lga);
//     setFormData(prev => ({ ...prev, lga, ward: '', puName: '', puCode: '' }));
//   };

//   const handleWardChange = (e) => {
//     const ward = e.target.value;
//     selectWard(ward);
//     setFormData(prev => ({ ...prev, ward, puName: '', puCode: '' }));
//   };

//   const handlePuChange = (e) => {
//     const puCode = e.target.value;
//     const pu = pollingUnits.find(p => p.puCode === puCode);
//     setFormData(prev => ({ ...prev, puCode, puName: pu ? pu.puName : '' }));
//   };

//   const handleFormSubmit = async (e) => {
//     e.preventDefault();
//     setUiMessage({ text: '', type: '' });

//     if (!formData.fullName || !formData.telNo || !formData.lga || !formData.puCode || !formData.bankDetails.accountNo) {
//       setUiMessage({ text: 'Please complete all required (*) fields before submitting.', type: 'error' });
//       return;
//     }

//     const result = await submitForm(formData);

//     if (!result.success) {
//       setUiMessage({ text: result.error, type: 'error' });
//       return;
//     }

//     setFormData({
//       fullName: '', address: '', telNo: '', email: '', sex: '', dateOfBirth: '', maritalStatus: '',
//       lga: '', ward: '', puName: '', puCode: '', pvcNumber: '', nin: '',
//       bankDetails: { bankName: '', accountNo: '', accountName: '' }
//     });
//     selectLga('');

//     if (result.status === 'online') {
//       setUiMessage({ text: 'Your nomination has been received and recorded.', type: 'success' });
//     } else {
//       setUiMessage({ text: 'Saved on this device. It will be submitted automatically once you are back online.', type: 'warning' });
//     }
//   };

//   return (
//     <div className="min-h-screen security-weave py-8 px-4 sm:px-6 lg:px-8 font-body">
//       <div className="max-w-3xl mx-auto space-y-5">

//         {/* Connectivity status — quiet, functional, not a hero element */}
//         <div className={`px-4 py-2.5 rounded-md border flex items-center justify-between text-xs ${
//           isOnline ? 'bg-white border-puc-paper-line text-puc-ink/70' : 'bg-puc-brass-soft border-puc-brass/40 text-puc-ink'
//         }`}>
//           <div className="flex items-center gap-2">
//             {isOnline ? <Wifi className="h-3.5 w-3.5 text-puc-green" /> : <WifiOff className="h-3.5 w-3.5 text-puc-brass" />}
//             <span className="font-medium">
//               {isOnline ? 'Connected — submissions are sent immediately' : 'Offline — your entry will be saved on this device'}
//             </span>
//           </div>
//           {queueCount > 0 && (
//             <button onClick={triggerManualSync} disabled={syncing || !isOnline} className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded border border-puc-paper-line font-semibold hover:bg-puc-paper">
//               <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} /> Send {queueCount} saved {queueCount === 1 ? 'entry' : 'entries'}
//             </button>
//           )}
//         </div>

//         {syncErrors.length > 0 && (
//           <div className="space-y-2">
//             {syncErrors.map((err) => (
//               <div key={err.localId} className="p-3 rounded-md border bg-puc-error/5 border-puc-error/30 text-puc-error text-xs flex items-center justify-between gap-3">
//                 <span><strong>{err.fullName || 'A saved entry'}</strong> could not be submitted: {err.error}</span>
//                 <button onClick={() => dismissSyncError(err.localId)} className="shrink-0 font-bold underline">Dismiss</button>
//               </div>
//             ))}
//           </div>
//         )}

//         {/* The document itself */}
//         <div className="bg-white rounded-md border border-puc-paper-line shadow-[0_1px_3px_rgba(15,81,50,0.08)] overflow-hidden">

//           {/* Letterhead */}
//           <div className="relative bg-puc-green text-white px-6 py-7 overflow-hidden">
//             <div
//               className="absolute inset-0 opacity-[0.06]"
//               style={{
//                 backgroundImage:
//                   'repeating-linear-gradient(45deg, currentColor 0px, currentColor 1px, transparent 1px, transparent 10px)',
//               }}
//             />
//             <div className="relative flex items-start justify-between gap-4">
//               <div>
//                 <p className="font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-puc-brass-soft">
//                   All Progressives Congress
//                 </p>
//                 <h1 className="font-display text-2xl font-bold tracking-tight mt-1">
//                   Polling Unit Committee
//                 </h1>
//                 <p className="font-body text-sm text-white/75 mt-0.5">Member's Nomination Form</p>
//               </div>
//               <Seal className="h-16 w-16 text-puc-brass-soft shrink-0" />
//             </div>
//             <p className="relative font-mono text-[10px] text-white/60 mt-5 tracking-wide">
//               FORM PUC/NG/2026 · Retain a copy of your PVC alongside this submission
//             </p>
//           </div>

//           <form onSubmit={handleFormSubmit} className="p-6 space-y-7">

//             {/* PART A */}
//             <div className="space-y-4">
//               <SectionHeading letter="A" title="Personal Particulars" />
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
//                 <div className="md:col-span-2">
//                   <label className={labelClass}>Full Name *</label>
//                   <input type="text" name="fullName" value={formData.fullName} onChange={handleTopLevelChange} className={inputClass} placeholder="SURNAME Firstname Othername" />
//                 </div>
//                 <div className="md:col-span-2">
//                   <label className={labelClass}>Residential Address *</label>
//                   <input type="text" name="address" value={formData.address} onChange={handleTopLevelChange} className={inputClass} placeholder="Street, house number, ward area" />
//                 </div>
//                 <div>
//                   <label className={labelClass}>Telephone Number *</label>
//                   <input type="tel" name="telNo" value={formData.telNo} onChange={handleTopLevelChange} className={inputClass} placeholder="08012345678" />
//                 </div>
//                 <div>
//                   <label className={labelClass}>Email Address</label>
//                   <input type="email" name="email" value={formData.email} onChange={handleTopLevelChange} className={inputClass} placeholder="nominee@domain.com" />
//                 </div>
//                 <div>
//                   <label className={labelClass}>Sex *</label>
//                   <select name="sex" value={formData.sex} onChange={handleTopLevelChange} className={`${inputClass} bg-white`}>
//                     <option value="">Select</option>
//                     <option value="M">Male</option>
//                     <option value="F">Female</option>
//                   </select>
//                 </div>
//                 <div>
//                   <label className={labelClass}>Date of Birth *</label>
//                   <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleTopLevelChange} className={inputClass} />
//                 </div>
//                 <div>
//                   <label className={labelClass}>Marital Status *</label>
//                   <select name="maritalStatus" value={formData.maritalStatus} onChange={handleTopLevelChange} className={`${inputClass} bg-white`}>
//                     <option value="">Select</option>
//                     <option value="Single">Single</option>
//                     <option value="Married">Married</option>
//                     <option value="Divorced">Divorced</option>
//                     <option value="Widowed">Widowed</option>
//                   </select>
//                 </div>
//               </div>
//             </div>

//             <div className="border-t border-puc-paper-line" />

//             {/* PART B */}
//             <div className="space-y-4">
//               <SectionHeading letter="B" title="Electoral Assignment" />

//               {locationError && (
//                 <p className="text-xs font-medium text-puc-error bg-puc-error/5 border border-puc-error/30 rounded-md p-2.5">{locationError}</p>
//               )}

//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
//                 <div>
//                   <label className={labelClass}>LGA *</label>
//                   <select name="lga" value={selectedLga} onChange={handleLgaChange} disabled={loadingLgas} className={`${inputClass} bg-white disabled:opacity-60`}>
//                     <option value="">{loadingLgas ? 'Loading…' : 'Select LGA'}</option>
//                     {lgas.map((lga) => <option key={lga} value={lga}>{lga}</option>)}
//                   </select>
//                 </div>
//                 <div>
//                   <label className={labelClass}>Ward *</label>
//                   <select name="ward" value={selectedWard} onChange={handleWardChange} disabled={!selectedLga || loadingWards} className={`${inputClass} bg-white disabled:opacity-60`}>
//                     <option value="">{!selectedLga ? 'Select an LGA first' : loadingWards ? 'Loading…' : 'Select Ward'}</option>
//                     {wards.map((ward) => <option key={ward} value={ward}>{ward}</option>)}
//                   </select>
//                 </div>
//                 <div className="md:col-span-2">
//                   <label className={labelClass}>Polling Unit *</label>
//                   <select name="puCode" value={formData.puCode} onChange={handlePuChange} disabled={!selectedWard || loadingPUs} className={`${inputClass} bg-white disabled:opacity-60`}>
//                     <option value="">{!selectedWard ? 'Select a ward first' : loadingPUs ? 'Loading…' : 'Select Polling Unit'}</option>
//                     {pollingUnits.map((pu) => <option key={pu.puCode} value={pu.puCode}>{pu.puName} — {pu.puCode}</option>)}
//                   </select>
//                   {formData.puCode && (
//                     <p className="font-mono text-[11px] text-puc-green mt-1.5">PU Code: {formData.puCode}</p>
//                   )}
//                 </div>
//                 <div>
//                   <label className={labelClass}>PVC Number *</label>
//                   <input type="text" name="pvcNumber" value={formData.pvcNumber} onChange={handleTopLevelChange} className={`${inputClass} font-mono`} placeholder="Enter full card number" />
//                 </div>
//                 <div>
//                   <label className={labelClass}>NIN *</label>
//                   <input type="text" name="nin" value={formData.nin} onChange={handleTopLevelChange} maxLength={11} className={`${inputClass} font-mono`} placeholder="11-digit number" />
//                 </div>
//               </div>
//             </div>

//             <div className="border-t border-puc-paper-line" />

//             {/* PART C */}
//             <div className="space-y-4">
//               <SectionHeading letter="C" title="Remittance Account" />
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
//                 <div>
//                   <label className={labelClass}>Bank Name *</label>
//                   <input type="text" name="bankName" value={formData.bankDetails.bankName} onChange={handleBankChange} className={inputClass} placeholder="e.g. GTBank" />
//                 </div>
//                 <div>
//                   <label className={labelClass}>Account Number *</label>
//                   <input type="text" name="accountNo" value={formData.bankDetails.accountNo} onChange={handleBankChange} maxLength={10} className={`${inputClass} font-mono`} placeholder="10 digits" />
//                 </div>
//                 <div>
//                   <label className={labelClass}>Account Name *</label>
//                   <input type="text" name="accountName" value={formData.bankDetails.accountName} onChange={handleBankChange} className={inputClass} placeholder="Must match full name" />
//                 </div>
//               </div>
//             </div>

//             {uiMessage.text && (
//               <div className={`p-3 rounded-md text-xs font-medium border ${
//                 uiMessage.type === 'success' ? 'bg-puc-green/5 border-puc-green/30 text-puc-green-dark' :
//                 uiMessage.type === 'warning' ? 'bg-puc-brass-soft border-puc-brass/40 text-puc-ink' :
//                 'bg-puc-error/5 border-puc-error/30 text-puc-error'
//               }`}>
//                 {uiMessage.text}
//               </div>
//             )}

//             <button
//               type="submit"
//               className="w-full bg-puc-green hover:bg-puc-green-dark text-white font-semibold py-3 px-4 rounded-md text-sm tracking-wide shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-puc-green/50 focus:ring-offset-2"
//             >
//               Submit Nomination
//             </button>
//           </form>
//         </div>

//         <p className="text-center text-[11px] text-puc-ink/40">
//           Information submitted here is used solely for Polling Unit Committee administration.
//         </p>
//       </div>
//     </div>
//   );
// }

import React, { useState } from 'react';
import { useOfflineForm } from '../hooks/useOfflineForm';
import { useLocations } from '../hooks/useLocations';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import PassportPhotoUpload from './PassportPhotoUpload';
import { uploadPhotoToCloudinary } from '../utils/cloudinaryUpload';
// Place the uploaded logo file at src/assets/apc-logo.png — Vite will
// bundle and hash it, unlike a public/ reference, so browser caching
// doesn't serve a stale copy if you swap the file later.
import apcLogo from '../assets/apc-logo.jpeg';

function SectionHeading({ letter, title }) {
  return (
    <div className="flex items-baseline gap-3 mb-1">
      <span
        className="font-mono text-[11px] font-semibold text-puc-brass border border-puc-brass/50 rounded px-1.5 py-0.5"
      >
        PART {letter}
      </span>
      <h3 className="font-body text-xs font-bold uppercase tracking-[0.15em] text-puc-green">
        {title}
      </h3>
    </div>
  );
}

const inputClass =
  "w-full px-3 py-2.5 bg-white border border-puc-paper-line rounded-md text-sm text-puc-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-puc-green/40 focus:border-puc-green transition-colors";
const labelClass = "block text-[11px] font-semibold uppercase tracking-wide text-puc-ink/70 mb-1";

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
  const [photoBlob, setPhotoBlob] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  const handlePhotoReady = (blob) => {
    setPhotoBlob(blob);
  };

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

  const handleLgaChange = (e) => {
    const lga = e.target.value;
    selectLga(lga);
    setFormData(prev => ({ ...prev, lga, ward: '', puName: '', puCode: '' }));
  };

  const handleWardChange = (e) => {
    const ward = e.target.value;
    selectWard(ward);
    setFormData(prev => ({ ...prev, ward, puName: '', puCode: '' }));
  };

  const handlePuChange = (e) => {
    const puCode = e.target.value;
    const pu = pollingUnits.find(p => p.puCode === puCode);
    setFormData(prev => ({ ...prev, puCode, puName: pu ? pu.puName : '' }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setUiMessage({ text: '', type: '' });

    if (!formData.fullName || !formData.telNo || !formData.lga || !formData.puCode || !formData.bankDetails.accountNo) {
      setUiMessage({ text: 'Please complete all required (*) fields before submitting.', type: 'error' });
      return;
    }
    if (!photoBlob) {
      setUiMessage({ text: 'Please add a passport photograph before submitting.', type: 'error' });
      return;
    }

    let submissionPayload = { ...formData };

    if (isOnline) {
      setPhotoUploading(true);
      try {
        const { url, publicId } = await uploadPhotoToCloudinary(photoBlob);
        submissionPayload = { ...submissionPayload, photoUrl: url, photoPublicId: publicId };
      } catch (err) {
        setPhotoUploading(false);
        setUiMessage({ text: err.message || 'Photo upload failed. Please try again.', type: 'error' });
        return;
      }
      setPhotoUploading(false);
    } else {
      // TODO(offline queueing): useOfflineForm currently doesn't know
      // about binary attachments. Attaching the raw Blob here only
      // works once that hook's persistence layer is IndexedDB (not
      // localStorage, which can't hold Blobs and has a ~5-10MB cap)
      // and its sync routine is updated to call
      // uploadPhotoToCloudinary(photoBlob) for each queued item before
      // submitting its form data. Wiring this fully requires seeing
      // that hook's current implementation.
      submissionPayload = { ...submissionPayload, photoBlob };
    }

    const result = await submitForm(submissionPayload);

    if (!result.success) {
      setUiMessage({ text: result.error, type: 'error' });
      return;
    }

    setFormData({
      fullName: '', address: '', telNo: '', email: '', sex: '', dateOfBirth: '', maritalStatus: '',
      lga: '', ward: '', puName: '', puCode: '', pvcNumber: '', nin: '',
      bankDetails: { bankName: '', accountNo: '', accountName: '' }
    });
    setPhotoBlob(null);
    selectLga('');

    if (result.status === 'online') {
      setUiMessage({ text: 'Your nomination has been received and recorded.', type: 'success' });
    } else {
      setUiMessage({ text: 'Saved on this device. It will be submitted automatically once you are back online.', type: 'warning' });
    }
  };

  return (
    <div className="min-h-screen security-weave py-8 px-4 sm:px-6 lg:px-8 font-body">
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Connectivity status — quiet, functional, not a hero element */}
        <div className={`px-4 py-2.5 rounded-md border flex items-center justify-between text-xs ${
          isOnline ? 'bg-white border-puc-paper-line text-puc-ink/70' : 'bg-puc-brass-soft border-puc-brass/40 text-puc-ink'
        }`}>
          <div className="flex items-center gap-2">
            {isOnline ? <Wifi className="h-3.5 w-3.5 text-puc-green" /> : <WifiOff className="h-3.5 w-3.5 text-puc-brass" />}
            <span className="font-medium">
              {isOnline ? 'Connected — submissions are sent immediately' : 'Offline — your entry will be saved on this device'}
            </span>
          </div>
          {queueCount > 0 && (
            <button onClick={triggerManualSync} disabled={syncing || !isOnline} className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded border border-puc-paper-line font-semibold hover:bg-puc-paper">
              <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} /> Send {queueCount} saved {queueCount === 1 ? 'entry' : 'entries'}
            </button>
          )}
        </div>

        {syncErrors.length > 0 && (
          <div className="space-y-2">
            {syncErrors.map((err) => (
              <div key={err.localId} className="p-3 rounded-md border bg-puc-error/5 border-puc-error/30 text-puc-error text-xs flex items-center justify-between gap-3">
                <span><strong>{err.fullName || 'A saved entry'}</strong> could not be submitted: {err.error}</span>
                <button onClick={() => dismissSyncError(err.localId)} className="shrink-0 font-bold underline">Dismiss</button>
              </div>
            ))}
          </div>
        )}

        {/* The document itself */}
        <div className="bg-white rounded-md border border-puc-paper-line shadow-[0_1px_3px_rgba(15,81,50,0.08)] overflow-hidden">

          {/* Letterhead */}
          <div className="relative bg-puc-green text-white px-6 py-7 overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(45deg, currentColor 0px, currentColor 1px, transparent 1px, transparent 10px)',
              }}
            />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <p className="font-body text-[11px] font-semibold uppercase tracking-[0.2em] text-puc-brass-soft">
                  All Progressives Congress
                </p>
                <h1 className="font-display text-2xl font-bold tracking-tight mt-1">
                  Polling Unit Committee
                </h1>
                <p className="font-body text-sm text-white/75 mt-0.5">Member's Nomination Form</p>
              </div>
              <div className="shrink-0 bg-white rounded-md p-1.5 shadow-sm border border-black/5">
                <img
                  src={apcLogo}
                  alt="All Progressives Congress logo"
                  className="h-14 w-14 object-contain"
                />
              </div>
            </div>
            <p className="relative font-mono text-[10px] text-white/60 mt-5 tracking-wide">
              FORM PUC/NG/2026 · Retain a copy of your PVC alongside this submission
            </p>
          </div>

          <form onSubmit={handleFormSubmit} className="p-6 space-y-7">

            {/* PART A */}
            <div className="space-y-4">
              <SectionHeading letter="A" title="Personal Particulars" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="md:col-span-2">
                  <PassportPhotoUpload onPhotoReady={handlePhotoReady} disabled={photoUploading} />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Full Name *</label>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleTopLevelChange} className={inputClass} placeholder="SURNAME Firstname Othername" />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Residential Address *</label>
                  <input type="text" name="address" value={formData.address} onChange={handleTopLevelChange} className={inputClass} placeholder="Street, house number, ward area" />
                </div>
                <div>
                  <label className={labelClass}>Telephone Number *</label>
                  <input type="tel" name="telNo" value={formData.telNo} onChange={handleTopLevelChange} className={inputClass} placeholder="08012345678" />
                </div>
                <div>
                  <label className={labelClass}>Email Address</label>
                  <input type="email" name="email" value={formData.email} onChange={handleTopLevelChange} className={inputClass} placeholder="nominee@domain.com" />
                </div>
                <div>
                  <label className={labelClass}>Sex *</label>
                  <select name="sex" value={formData.sex} onChange={handleTopLevelChange} className={`${inputClass} bg-white`}>
                    <option value="">Select</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Date of Birth *</label>
                  <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleTopLevelChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Marital Status *</label>
                  <select name="maritalStatus" value={formData.maritalStatus} onChange={handleTopLevelChange} className={`${inputClass} bg-white`}>
                    <option value="">Select</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-puc-paper-line" />

            {/* PART B */}
            <div className="space-y-4">
              <SectionHeading letter="B" title="Electoral Assignment" />

              {locationError && (
                <p className="text-xs font-medium text-puc-error bg-puc-error/5 border border-puc-error/30 rounded-md p-2.5">{locationError}</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className={labelClass}>LGA *</label>
                  <select name="lga" value={selectedLga} onChange={handleLgaChange} disabled={loadingLgas} className={`${inputClass} bg-white disabled:opacity-60`}>
                    <option value="">{loadingLgas ? 'Loading…' : 'Select LGA'}</option>
                    {lgas.map((lga) => <option key={lga} value={lga}>{lga}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Ward *</label>
                  <select name="ward" value={selectedWard} onChange={handleWardChange} disabled={!selectedLga || loadingWards} className={`${inputClass} bg-white disabled:opacity-60`}>
                    <option value="">{!selectedLga ? 'Select an LGA first' : loadingWards ? 'Loading…' : 'Select Ward'}</option>
                    {wards.map((ward) => <option key={ward} value={ward}>{ward}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Polling Unit *</label>
                  <select name="puCode" value={formData.puCode} onChange={handlePuChange} disabled={!selectedWard || loadingPUs} className={`${inputClass} bg-white disabled:opacity-60`}>
                    <option value="">{!selectedWard ? 'Select a ward first' : loadingPUs ? 'Loading…' : 'Select Polling Unit'}</option>
                    {pollingUnits.map((pu) => <option key={pu.puCode} value={pu.puCode}>{pu.puName} — {pu.puCode}</option>)}
                  </select>
                  {formData.puCode && (
                    <p className="font-mono text-[11px] text-puc-green mt-1.5">PU Code: {formData.puCode}</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>PVC Number *</label>
                  <input type="text" name="pvcNumber" value={formData.pvcNumber} onChange={handleTopLevelChange} className={`${inputClass} font-mono`} placeholder="Enter full card number" />
                </div>
                <div>
                  <label className={labelClass}>NIN *</label>
                  <input type="text" name="nin" value={formData.nin} onChange={handleTopLevelChange} maxLength={11} className={`${inputClass} font-mono`} placeholder="11-digit number" />
                </div>
              </div>
            </div>

            <div className="border-t border-puc-paper-line" />

            {/* PART C */}
            <div className="space-y-4">
              <SectionHeading letter="C" title="Remittance Account" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className={labelClass}>Bank Name *</label>
                  <input type="text" name="bankName" value={formData.bankDetails.bankName} onChange={handleBankChange} className={inputClass} placeholder="e.g. GTBank" />
                </div>
                <div>
                  <label className={labelClass}>Account Number *</label>
                  <input type="text" name="accountNo" value={formData.bankDetails.accountNo} onChange={handleBankChange} maxLength={10} className={`${inputClass} font-mono`} placeholder="10 digits" />
                </div>
                <div>
                  <label className={labelClass}>Account Name *</label>
                  <input type="text" name="accountName" value={formData.bankDetails.accountName} onChange={handleBankChange} className={inputClass} placeholder="Must match full name" />
                </div>
              </div>
            </div>

            {uiMessage.text && (
              <div className={`p-3 rounded-md text-xs font-medium border ${
                uiMessage.type === 'success' ? 'bg-puc-green/5 border-puc-green/30 text-puc-green-dark' :
                uiMessage.type === 'warning' ? 'bg-puc-brass-soft border-puc-brass/40 text-puc-ink' :
                'bg-puc-error/5 border-puc-error/30 text-puc-error'
              }`}>
                {uiMessage.text}
              </div>
            )}

            <button
              type="submit"
              disabled={photoUploading}
              className="w-full bg-puc-green hover:bg-puc-green-dark disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-md text-sm tracking-wide shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-puc-green/50 focus:ring-offset-2"
            >
              {photoUploading ? 'Uploading photo…' : 'Submit Nomination'}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-puc-ink/40">
          Information submitted here is used solely for Polling Unit Committee administration.
        </p>
      </div>
    </div>
  );
}