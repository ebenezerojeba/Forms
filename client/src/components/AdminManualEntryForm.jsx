import React, { useState } from "react";
import { UserPlus, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLocations } from "../hooks/useLocations";
import { API } from "../config/api";

const EMPTY_FORM = {
  fullName: "", address: "", telNo: "", email: "", sex: "", dateOfBirth: "", maritalStatus: "",
  lga: "", ward: "", puName: "", puCode: "", pvcNumber: "", nin: "",
  bankDetails: { bankName: "", accountNo: "", accountName: "" },
};

export default function AdminManualEntryForm({ onCreated }) {
  const { authFetch } = useAuth();
  const {
    lgas, wards, pollingUnits,
    selectedLga, selectedWard,
    selectLga, selectWard,
    loadingLgas, loadingWards, loadingPUs,
    error: locationError,
  } = useLocations();

  const [formData, setFormData] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleTopLevelChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBankChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, bankDetails: { ...prev.bankDetails, [name]: value } }));
  };

  const handleLgaChange = (e) => {
    const lga = e.target.value;
    selectLga(lga);
    setFormData((prev) => ({ ...prev, lga, ward: "", puName: "", puCode: "" }));
  };

  const handleWardChange = (e) => {
    const ward = e.target.value;
    selectWard(ward);
    setFormData((prev) => ({ ...prev, ward, puName: "", puCode: "" }));
  };

  const handlePuChange = (e) => {
    const puCode = e.target.value;
    const pu = pollingUnits.find((p) => p.puCode === puCode);
    setFormData((prev) => ({ ...prev, puCode, puName: pu ? pu.puName : "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });
    setSubmitting(true);

    try {
      const res = await authFetch(API.adminSubmissions, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) {
        // Duplicate NIN/PVC (409), mismatched polling unit, or validation
        // error (400) — surface the server's specific message.
        setMessage({ text: data.error || "Could not create record.", type: "error" });
        return;
      }

      setFormData(EMPTY_FORM);
      selectLga("");
      setMessage({ text: "Nominee record created successfully.", type: "success" });
      onCreated?.(data.id);
    } catch (err) {
      setMessage({ text: "Network error — please try again.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-2xl overflow-hidden">
      <div className="bg-slate-950 p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-emerald-400">
          <UserPlus className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-white font-black text-sm uppercase tracking-wider">Manual Nominee Entry</h2>
          <p className="text-slate-500 text-xs">For records collected offline or over the phone</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Full Name *" name="fullName" value={formData.fullName} onChange={handleTopLevelChange} className="md:col-span-2" />
          <Field label="Residential Address *" name="address" value={formData.address} onChange={handleTopLevelChange} className="md:col-span-2" />
          <Field label="Telephone Number *" name="telNo" value={formData.telNo} onChange={handleTopLevelChange} />
          <Field label="E-Mail Address" name="email" type="email" value={formData.email} onChange={handleTopLevelChange} />
          <SelectField
            label="Sex *" name="sex" value={formData.sex} onChange={handleTopLevelChange}
            options={[["", "Select Gender"], ["M", "Male (M)"], ["F", "Female (F)"]]}
          />
          <Field label="Date of Birth *" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleTopLevelChange} />
          <SelectField
            label="Marital Status *" name="maritalStatus" value={formData.maritalStatus} onChange={handleTopLevelChange}
            options={[["", "Select Status"], ["Single", "Single"], ["Married", "Married"], ["Divorced", "Divorced"], ["Widowed", "Widowed"]]}
          />
          {locationError && (
            <p className="md:col-span-2 text-xs font-semibold text-rose-300 bg-rose-950/40 border border-rose-900 rounded-lg p-2.5">{locationError}</p>
          )}

          <SelectField
            label="LGA *" name="lga" value={selectedLga} onChange={handleLgaChange}
            options={[["", loadingLgas ? "Loading LGAs…" : "Select LGA"], ...lgas.map((l) => [l, l])]}
            disabled={loadingLgas}
          />
          <SelectField
            label="Ward *" name="ward" value={selectedWard} onChange={handleWardChange}
            options={[["", !selectedLga ? "Select an LGA first" : loadingWards ? "Loading wards…" : "Select Ward"], ...wards.map((w) => [w, w])]}
            disabled={!selectedLga || loadingWards}
          />
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Polling Unit *</label>
            <select
              name="puCode"
              value={formData.puCode}
              onChange={handlePuChange}
              disabled={!selectedWard || loadingPUs}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-60"
            >
              <option value="">{!selectedWard ? "Select a ward first" : loadingPUs ? "Loading polling units…" : "Select Polling Unit"}</option>
              {pollingUnits.map((pu) => (
                <option key={pu.puCode} value={pu.puCode}>{pu.puName} — {pu.puCode}</option>
              ))}
            </select>
          </div>
          <Field label="PVC Number *" name="pvcNumber" value={formData.pvcNumber} onChange={handleTopLevelChange} />
          <Field label="NIN *" name="nin" value={formData.nin} onChange={handleTopLevelChange} maxLength={11} />
        </div>

        <div className="pt-2 border-t border-slate-800">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3 mt-4">Bank Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Bank Name *" name="bankName" value={formData.bankDetails.bankName} onChange={handleBankChange} />
            <Field label="Account Number *" name="accountNo" value={formData.bankDetails.accountNo} onChange={handleBankChange} maxLength={10} />
            <Field label="Account Name *" name="accountName" value={formData.bankDetails.accountName} onChange={handleBankChange} />
          </div>
        </div>

        {message.text && (
          <div
            className={`p-3 rounded-lg text-xs font-bold border ${
              message.type === "success"
                ? "bg-emerald-950/40 border-emerald-900 text-emerald-300"
                : "bg-rose-950/40 border-rose-900 text-rose-300"
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest transition-all"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? "Saving…" : "Create Nominee Record"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, name, value, onChange, type = "text", className = "", maxLength }) {
  return (
    <div className={className}>
      <label className="block text-xs font-bold uppercase text-slate-400 mb-1">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
      />
    </div>
  );
}

function SelectField({ label, name, value, onChange, options, disabled = false }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase text-slate-400 mb-1">{label}</label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none disabled:opacity-60"
      >
        {options.map(([val, text]) => (
          <option key={val} value={val}>{text}</option>
        ))}
      </select>
    </div>
  );
}