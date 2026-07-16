import React, { useEffect, useState, useCallback } from "react";
import { ShieldCheck, ChevronLeft, ChevronRight, FileSpreadsheet, FileJson, Users, UserPlus, Search, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { API } from "../config/api";
import AdminManualEntryForm from "../components/AdminManualEntryForm";
import NominationSlipModal from "../components/NominationSlipModal";

const PAGE_SIZE = 15; // matches the backend default — was 12 vs 15 before, silently wasting a request's worth of rows

function SourceBadge({ source }) {
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${source === "admin" ? "bg-amber-950 text-amber-400" : "bg-slate-800 text-slate-400"}`}>
      {source}
    </span>
  );
}

function PhotoThumb({ item, className }) {
  if (!item.photoUrl) {
    return (
      <div className={`rounded border border-slate-800 bg-slate-950 flex items-center justify-center text-slate-600 text-[9px] font-bold uppercase shrink-0 ${className}`}>
        None
      </div>
    );
  }
  return (
    <a
      href={item.photoUrl}
      target="_blank"
      rel="noopener noreferrer"
      title="Open full size"
      onClick={(e) => e.stopPropagation()} // opening the raw image shouldn't also open the slip modal
      className="shrink-0"
    >
      <img
        src={item.photoUrl}
        alt={`${item.fullName}'s passport photograph`}
        loading="lazy"
        className={`object-cover rounded border border-slate-700 hover:border-emerald-500 transition-colors ${className}`}
      />
    </a>
  );
}

// Mobile card — shown below the `md` breakpoint in place of the table row.
// Same tap-to-open-slip behavior as the desktop row, sized for a thumb, not a cursor.
function NomineeCard({ item, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="w-full text-left bg-slate-950 border border-slate-800 rounded-xl p-4 flex gap-3 active:bg-slate-900 transition-colors"
    >
      <PhotoThumb item={item} className="h-16 w-14" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <p className="font-bold text-white text-sm truncate">{item.fullName}</p>
          <SourceBadge source={item.source} />
        </div>
        <p className="text-slate-400 text-xs truncate">{item.telNo} {item.email ? `· ${item.email}` : ''}</p>
        <p className="text-slate-400 text-xs truncate">
          <span className="text-slate-200 font-semibold">{item.lga}</span>
          {item.ward ? ` — ${item.ward}` : ''}
        </p>
        <p className="text-emerald-400 font-mono text-[11px] truncate">{item.puName} {item.puCode ? `(${item.puCode})` : ''}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-0.5 font-mono text-[11px] text-slate-300 pt-0.5">
          <span><span className="text-slate-500 font-sans">PVC:</span> {item.pvcNumber || '—'}</span>
          <span><span className="text-slate-500 font-sans">NIN:</span> {item.nin || '—'}</span>
        </div>
        <p className="text-slate-400 text-xs truncate">
          {item.bankDetails?.bankName} <span className="font-mono">{item.bankDetails?.accountNo}</span>
        </p>
      </div>
    </button>
  );
}

export default function AdminDashboard() {
  const { admin, authFetch, logout } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState("list"); // 'list' | 'add'
  const [selectedNominee, setSelectedNominee] = useState(null);

  const fetchRecords = useCallback(
    async (targetPage = 1, search = searchTerm) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: targetPage, limit: PAGE_SIZE });
        if (search) params.set("search", search);

        const res = await authFetch(`${API.adminSubmissions}?${params.toString()}`);
        if (res.status === 401) {
          logout(); // token expired/invalid mid-session — bounce to login
          return;
        }
        const payload = await res.json();
        setSubmissions(payload.data || []);
        setMeta({ total: payload.total, page: payload.page, pages: payload.pages });
      } catch (err) {
        console.error("Administrative workspace data sync failure.", err);
      } finally {
        setLoading(false);
      }
    },
    [authFetch, logout, searchTerm]
  );

  useEffect(() => {
    fetchRecords(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRecords(1, searchTerm);
  };

  const triggerSecureExport = async (formatType) => {
    // Export is streamed with credentials — a plain window.location.href
    // navigation (as before) can't attach the Authorization header, so
    // this fetches as a blob and triggers the download client-side.
    const res = await authFetch(API.adminExport(formatType));
    if (!res.ok) {
      console.error("Export failed", await res.text());
      return;
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = formatType === "excel" ? "PUC_Master_Nomination_Report.xlsx" : "puc_backup.json";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">

        {/* Top Command Header */}
        <div className="flex flex-col gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-widest">
              <ShieldCheck className="h-4 w-4" /> {admin?.role === "super_admin" ? "Super Admin" : "Staff"} Access
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-1">PUC System Administration Core</h1>
          </div>

          {/* flex-wrap lets these drop to a second line on narrow screens instead
              of forcing horizontal scroll or squashing the buttons unreadably. */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setView(view === "list" ? "add" : "list")}
              className="flex items-center gap-1.5 sm:gap-2 bg-slate-900 hover:bg-slate-800 text-slate-200 font-bold text-[11px] sm:text-xs uppercase tracking-wider px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl border border-slate-800 transition-all"
            >
              <UserPlus className="h-4 w-4" /> {view === "list" ? "Add Nominee" : "Back to List"}
            </button>

            {/* Export is only meaningful/available to super_admin — the
                backend enforces this too, but hiding it avoids a confusing
                403 for staff. */}
            {admin?.role === "super_admin" && (
              <>
                <button
                  onClick={() => triggerSecureExport("excel")}
                  className="flex items-center gap-1.5 sm:gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] sm:text-xs uppercase tracking-wider px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl transition-all shadow-md"
                >
                  <FileSpreadsheet className="h-4 w-4" /> Excel
                </button>
                <button
                  onClick={() => triggerSecureExport("json")}
                  className="flex items-center gap-1.5 sm:gap-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-[11px] sm:text-xs uppercase tracking-wider px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl transition-all border border-slate-800"
                >
                  <FileJson className="h-4 w-4" /> JSON
                </button>
              </>
            )}

            <button
              onClick={logout}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-[11px] sm:text-xs font-bold uppercase px-3 py-2.5 sm:py-3 ml-auto"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        </div>

        {view === "add" ? (
          <AdminManualEntryForm
            onCreated={() => {
              setView("list");
              fetchRecords(1);
            }}
          />
        ) : (
          <>
            {/* Aggregate Data Board */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-4">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-emerald-400 shrink-0">
                  <Users className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Active Enlistments</p>
                  <p className="text-xl sm:text-2xl font-black text-white mt-0.5">{meta.total.toLocaleString()} Nominees</p>
                </div>
              </div>

              <form onSubmit={handleSearchSubmit} className="sm:col-span-2 flex items-center gap-2">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by name…"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <button type="submit" className="shrink-0 bg-slate-900 border border-slate-800 text-slate-300 text-xs font-bold uppercase px-4 py-3 rounded-xl hover:bg-slate-800">
                  Search
                </button>
              </form>
            </div>

            {/* Mobile: stacked cards. Hidden at md and up, where the table takes over. */}
            <div className="md:hidden space-y-3">
              <p className="text-[11px] text-slate-500 px-1">Tap a nominee for full details and a printable slip.</p>
              {loading ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500 text-sm">Loading…</div>
              ) : submissions.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500 text-sm">No records found.</div>
              ) : (
                submissions.map((item) => (
                  <NomineeCard key={item._id} item={item} onSelect={setSelectedNominee} />
                ))
              )}
            </div>

            {/* Desktop/tablet: full table. Hidden below md, where cards take over. */}
            <div className="hidden md:block bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
              <p className="px-4 pt-3 text-[11px] text-slate-500">Click a row to view full details and generate a printable slip.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-800">
                      <th className="p-4">Photo</th>
                      <th className="p-4">Full Name</th>
                      <th className="p-4">Contact (Tel/Email)</th>
                      <th className="p-4">LGA / Ward Designation</th>
                      <th className="p-4">PU Details (Name/Code)</th>
                      <th className="p-4">Credentials (PVC/NIN)</th>
                      <th className="p-4">Financial Remittance</th>
                      <th className="p-4">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {loading ? (
                      <tr><td colSpan="8" className="p-8 text-center text-slate-500">Loading…</td></tr>
                    ) : submissions.length === 0 ? (
                      <tr><td colSpan="8" className="p-8 text-center text-slate-500">No records found.</td></tr>
                    ) : (
                      submissions.map((item) => (
                        <tr
                          key={item._id}
                          onClick={() => setSelectedNominee(item)}
                          className="hover:bg-slate-950/40 transition-all cursor-pointer"
                        >
                          <td className="p-4">
                            <PhotoThumb item={item} className="h-12 w-10" />
                          </td>
                          <td className="p-4 font-bold text-white whitespace-nowrap">{item.fullName}</td>
                          <td className="p-4 space-y-0.5">
                            <p className="font-semibold text-slate-200">{item.telNo}</p>
                            <p className="text-slate-500 text-[11px]">{item.email || "No email"}</p>
                          </td>
                          <td className="p-4 space-y-0.5">
                            <p className="font-bold text-slate-200">{item.lga}</p>
                            <p className="text-slate-400 text-[11px]">{item.ward}</p>
                          </td>
                          <td className="p-4 max-w-xs truncate space-y-0.5">
                            <p className="font-semibold text-slate-200 truncate">{item.puName}</p>
                            <p className="text-emerald-400 font-mono text-[11px]">{item.puCode}</p>
                          </td>
                          <td className="p-4 space-y-0.5 font-mono text-[11px]">
                            <p className="text-slate-300"><span className="text-slate-500 font-sans">PVC:</span> {item.pvcNumber}</p>
                            <p className="text-slate-300"><span className="text-slate-500 font-sans">NIN:</span> {item.nin}</p>
                          </td>
                          <td className="p-4 space-y-0.5">
                            <p className="font-semibold text-white">{item.bankDetails?.bankName}</p>
                            <p className="text-slate-400 font-mono text-[11px]">{item.bankDetails?.accountNo}</p>
                          </td>
                          <td className="p-4">
                            <SourceBadge source={item.source} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination — shared by both layouts */}
            <div className="bg-slate-900 md:bg-slate-950 rounded-xl md:rounded-none border md:border-0 border-slate-800 md:border-t p-4 flex items-center justify-between text-xs text-slate-400">
              <p>Page {meta.page} of {meta.pages || 1}</p>
              <div className="flex items-center gap-2">
                <button disabled={meta.page <= 1 || loading} onClick={() => fetchRecords(meta.page - 1)} className="p-2.5 sm:p-2 rounded bg-slate-800 text-white disabled:opacity-30 hover:bg-slate-700">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button disabled={meta.page >= meta.pages || loading} onClick={() => fetchRecords(meta.page + 1)} className="p-2.5 sm:p-2 rounded bg-slate-800 text-white disabled:opacity-30 hover:bg-slate-700">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedNominee && (
        <NominationSlipModal nominee={selectedNominee} onClose={() => setSelectedNominee(null)} />
      )}
    </div>
  );
}