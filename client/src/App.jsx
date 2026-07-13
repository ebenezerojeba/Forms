import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import FormManager from "./components/FormManager";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import RequireAuth from "./components/RequireAuth";

export default function App() {
  return (
    <div className="relative antialiased selection:bg-slate-900 selection:text-white">
      <Routes>
        {/* Public nomination form */}
        <Route path="/" element={<FormManager />} />

        {/* Staff sign-in — not linked from the public form; staff are
            expected to know/bookmark this URL directly. */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected admin core — RequireAuth is the only thing that
            decides whether AdminDashboard ever mounts. */}
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminDashboard />
            </RequireAuth>
          }
        />

        {/* Anything else falls back to the public form rather than a
            blank 404 — this is a public-facing civic tool. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}