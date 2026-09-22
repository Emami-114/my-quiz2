import { useState, useEffect, useRef } from "react";
import {
  login,
  getRemainingLockoutSeconds,
  hasCustomPassword,
} from "../services/authService";

export default function PasswordGate({ onSuccess, lang = "de" }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [isShaking, setIsShaking] = useState(false);
  const [cooldown, setCooldown] = useState(() => getRemainingLockoutSeconds());
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef(null);

  // Focus input on mount
  useEffect(() => {
    if (cooldown === 0 && inputRef.current) {
      inputRef.current.focus();
    }
  }, [cooldown]);

  // Handle cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;

    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setError("");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldown]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (cooldown > 0 || isLoading) return;

    setError("");
    setIsLoading(true);

    try {
      const result = await login(password, rememberMe);

      if (result.success) {
        onSuccess();
      } else {
        setError(result.error || (lang === "de" ? "Zugriff verweigert." : "Access denied."));
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);

        if (result.remainingCooldown) {
          setCooldown(result.remainingCooldown);
        }
      }
    } catch {
      setError(lang === "de" ? "Fehler bei der Authentifizierung." : "Authentication error.");
    } finally {
      setIsLoading(false);
    }
  };

  const isCustomSet = hasCustomPassword();

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Cyber Ambient Lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-10 left-10 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Lock Card */}
      <div
        className={`w-full max-w-md bg-slate-900/90 backdrop-blur-2xl border border-slate-800/90 rounded-3xl shadow-2xl p-6 sm:p-8 relative z-10 transition-all duration-200 ${
          isShaking ? "animate-shake border-rose-500/80 shadow-rose-500/20" : ""
        }`}
      >
        {/* Shield / Lock Badge Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/30 mb-4 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <span className="text-3xl">🛡️</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            IT Quiz Pro
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>
              {lang === "de"
                ? "Geschützter Bereich • Sicherheitsabfrage"
                : "Protected Area • Security Gate"}
            </span>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="quiz-password-input"
              className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider"
            >
              {lang === "de" ? "Passwort eingeben" : "Enter Password"}
            </label>

            <div className="relative">
              <input
                id="quiz-password-input"
                ref={inputRef}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={cooldown > 0 || isLoading}
                placeholder={
                  lang === "de"
                    ? "Hier Passwort eingeben..."
                    : "Enter password here..."
                }
                autoComplete="current-password"
                className={`w-full px-4 py-3.5 pr-12 rounded-2xl bg-slate-950/80 border text-slate-100 placeholder-slate-500 text-sm sm:text-base outline-none transition-all ${
                  error
                    ? "border-rose-500 focus:border-rose-400 focus:ring-2 focus:ring-rose-500/20"
                    : "border-slate-700/80 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/25"
                } ${cooldown > 0 ? "opacity-50 cursor-not-allowed" : ""}`}
              />

              {/* Toggle Password Visibility */}
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                title={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between text-xs sm:text-sm text-slate-400 pt-1">
            <label className="flex items-center gap-2 cursor-pointer group select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 cursor-pointer accent-indigo-600"
              />
              <span className="group-hover:text-slate-300 transition-colors">
                {lang === "de"
                  ? "Auf diesem Gerät gespeichert bleiben"
                  : "Remember on this device"}
              </span>
            </label>
          </div>

          {/* Error & Lockout Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm flex items-start gap-2 animate-fadeIn">
              <span className="text-base leading-none">⚠️</span>
              <div className="flex-1">
                <span>{error}</span>
                {cooldown > 0 && (
                  <span className="block mt-1 font-mono text-rose-400 font-bold">
                    {lang === "de"
                      ? `Sperre aktiv: Noch ${cooldown}s`
                      : `Lockout active: ${cooldown}s remaining`}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={cooldown > 0 || isLoading || !password.trim()}
            className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm sm:text-base text-white transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-lg ${
              cooldown > 0 || !password.trim() || isLoading
                ? "bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed shadow-none"
                : "bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-600/30 hover:scale-[1.02] active:scale-[0.98]"
            }`}
          >
            {isLoading ? (
              <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>🔓</span>
                <span>{lang === "de" ? "Freischalten & Starten" : "Unlock & Start"}</span>
              </>
            )}
          </button>
        </form>

        {/* Security Info */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
          <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
            <span>🔒</span>
            <span>
              {lang === "de"
                ? "Nur autorisierter persönlicher Zugang"
                : "Authorized personal access only"}
            </span>
          </p>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="mt-6 text-center text-xs text-slate-500">
        <span>🔒 Client-seitig gesichert mit SHA-256 Hashing</span>
      </div>
    </div>
  );
}
