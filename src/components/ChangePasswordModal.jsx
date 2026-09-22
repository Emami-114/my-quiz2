import { useState } from "react";
import {
  changePassword,
  resetPasswordToDefault,
  hasCustomPassword,
} from "../services/authService";

export default function ChangePasswordModal({ isOpen, onClose, lang = "de" }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!newPassword || newPassword.length < 4) {
      setError(
        lang === "de"
          ? "Das neue Passwort muss mindestens 4 Zeichen lang sein."
          : "The new password must be at least 4 characters long."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(
        lang === "de"
          ? "Die neuen Passwörter stimmen nicht überein!"
          : "New passwords do not match!"
      );
      return;
    }

    setIsLoading(true);
    try {
      const res = await changePassword(currentPassword, newPassword);
      if (res.success) {
        setSuccess(
          lang === "de"
            ? "Passwort erfolgreich geändert und im Browser gespeichert!"
            : "Password successfully changed and saved in browser!"
        );
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(res.error || (lang === "de" ? "Fehler beim Ändern." : "Error changing password."));
      }
    } catch {
      setError(lang === "de" ? "Unerwarteter Fehler." : "Unexpected error.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (
      window.confirm(
        lang === "de"
          ? "Möchtest du das Passwort wirklich auf das ursprüngliche Master-Passwort zurücksetzen?"
          : "Do you really want to reset the password to original master password?"
      )
    ) {
      resetPasswordToDefault();
      window.location.reload();
    }
  };

  const isCustom = hasCustomPassword();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn select-none">
      <div className="w-full max-w-md bg-slate-900/95 border border-slate-700/80 rounded-3xl shadow-2xl p-6 sm:p-8 relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔐</span>
            <h2 className="text-xl font-bold text-slate-100">
              {lang === "de" ? "Passwort verwalten" : "Manage Password"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition flex items-center justify-center cursor-pointer"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-center gap-2">
            <span>✅</span>
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {lang === "de" ? "Aktuelles Passwort" : "Current Password"}
            </label>
            <input
              type={showPasswords ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              placeholder={lang === "de" ? "Aktuelles Passwort..." : "Current password..."}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {lang === "de" ? "Neues Passwort" : "New Password"}
            </label>
            <input
              type={showPasswords ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder={lang === "de" ? "Mindestens 4 Zeichen..." : "At least 4 chars..."}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {lang === "de" ? "Neues Passwort wiederholen" : "Confirm New Password"}
            </label>
            <input
              type={showPasswords ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder={lang === "de" ? "Passwort bestätigen..." : "Confirm password..."}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Show Passwords Toggle */}
          <div className="flex items-center gap-2 pt-1 text-xs text-slate-400">
            <input
              id="show-passwords-check"
              type="checkbox"
              checked={showPasswords}
              onChange={(e) => setShowPasswords(e.target.checked)}
              className="w-3.5 h-3.5 rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-indigo-600"
            />
            <label htmlFor="show-passwords-check" className="cursor-pointer">
              {lang === "de" ? "Passwörter lesbar machen" : "Show passwords"}
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl font-medium text-xs sm:text-sm bg-slate-800 text-slate-300 hover:bg-slate-700 transition cursor-pointer"
            >
              {lang === "de" ? "Abbrechen" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition cursor-pointer"
            >
              {isLoading
                ? lang === "de"
                  ? "Speichert..."
                  : "Saving..."
                : lang === "de"
                ? "Speichern"
                : "Save"}
            </button>
          </div>
        </form>

        {/* Reset to Factory Default */}
        {isCustom && (
          <div className="mt-5 pt-4 border-t border-slate-800/80 flex justify-between items-center text-xs">
            <span className="text-slate-500">
              {lang === "de" ? "Eigenes Passwort aktiv" : "Custom password active"}
            </span>
            <button
              type="button"
              onClick={handleReset}
              className="text-rose-400 hover:text-rose-300 underline cursor-pointer"
            >
              {lang === "de" ? "Auf Standard zurücksetzen" : "Reset to default"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
