import { useState, useEffect, useMemo, useCallback } from "react";
import core1Data from "./core1.json";
import core2Data from "./core2.json";
import linuxPlusData from "./linuxPlus.json";
import networkplusData from "./networkplus.json";
import secplusData from "./secplus.json";
import pentestData from "./pentest-plus.json";
import examtopicData from "./examtopic.json";
import PasswordGate from "./components/PasswordGate";
import ChangePasswordModal from "./components/ChangePasswordModal";
import { isAuthenticated, logout } from "./services/authService";

// Fisher-Yates unbiased shuffle
function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Topic configuration
const TOPIC_CONFIGS = [
  {
    id: "core1",
    nameDe: "A+ Core 1",
    nameEn: "A+ Core 1",
    sub: "220-1101",
    icon: "📦",
    accent: "from-amber-500 to-orange-600",
    borderActive: "border-amber-500 shadow-amber-500/30",
    data: core1Data,
  },
  {
    id: "core2",
    nameDe: "A+ Core 2",
    nameEn: "A+ Core 2",
    sub: "220-1102",
    icon: "💻",
    accent: "from-emerald-500 to-teal-600",
    borderActive: "border-emerald-500 shadow-emerald-500/30",
    data: core2Data,
  },
  {
    id: "linuxPlus",
    nameDe: "Linux+",
    nameEn: "Linux+",
    sub: "XK0-005",
    icon: "🐧",
    accent: "from-yellow-500 to-amber-600",
    borderActive: "border-yellow-500 shadow-yellow-500/30",
    data: linuxPlusData,
  },
  {
    id: "networkplus",
    nameDe: "Network+",
    nameEn: "Network+",
    sub: "N10-008",
    icon: "🌐",
    accent: "from-sky-500 to-blue-600",
    borderActive: "border-sky-500 shadow-sky-500/30",
    data: networkplusData,
  },
  {
    id: "secplus",
    nameDe: "Security+",
    nameEn: "Security+",
    sub: "SY0-701",
    icon: "🛡️",
    accent: "from-rose-500 to-red-600",
    borderActive: "border-rose-500 shadow-rose-500/30",
    data: secplusData,
  },
  {
    id: "pentest",
    nameDe: "PenTest+",
    nameEn: "PenTest+",
    sub: "PT0-002",
    icon: "🎯",
    accent: "from-purple-500 to-violet-600",
    borderActive: "border-purple-500 shadow-purple-500/30",
    data: pentestData,
  },
  {
    id: "examtopic",
    nameDe: "ExamTopic",
    nameEn: "ExamTopic",
    sub: "Bonus",
    icon: "📝",
    accent: "from-teal-500 to-cyan-600",
    borderActive: "border-teal-500 shadow-teal-500/30",
    data: examtopicData,
  },
  {
    id: "all",
    nameDe: "Alle Fragen (Zufall)",
    nameEn: "All Questions (Random)",
    sub: "Alle Topics",
    icon: "🔀",
    accent: "from-fuchsia-500 via-pink-500 to-purple-600",
    borderActive: "border-fuchsia-400 shadow-purple-500/50 ring-2 ring-fuchsia-400/60",
    isAll: true,
  },
];

// Helper to normalize questions with composite unique IDs and topic meta
function normalizeQuestions(topicId, shuffle = false) {
  if (topicId === "all") {
    const combined = [];
    TOPIC_CONFIGS.filter((t) => !t.isAll).forEach((topic) => {
      (topic.data || []).forEach((q, idx) => {
        combined.push({
          ...q,
          _uid: `${topic.id}_${q.id ?? idx}`,
          _originalId: q.id ?? idx + 1,
          _topicId: topic.id,
          _topicNameDe: topic.nameDe,
          _topicNameEn: topic.nameEn,
          _topicIcon: topic.icon,
        });
      });
    });
    return shuffleArray(combined);
  }

  const foundTopic = TOPIC_CONFIGS.find((t) => t.id === topicId) || TOPIC_CONFIGS[0];
  const list = (foundTopic.data || []).map((q, idx) => ({
    ...q,
    _uid: `${foundTopic.id}_${q.id ?? idx}`,
    _originalId: q.id ?? idx + 1,
    _topicId: foundTopic.id,
    _topicNameDe: foundTopic.nameDe,
    _topicNameEn: foundTopic.nameEn,
    _topicIcon: foundTopic.icon,
  }));

  return shuffle ? shuffleArray(list) : list;
}

export default function Quiz() {
  const [activeTopic, setActiveTopic] = useState("core1");
  const [questions, setQuestions] = useState(() => normalizeQuestions("core1", false));
  const [current, setCurrent] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [lang, setLang] = useState("de"); // "de" oder "en"
  const [isUnlocked, setIsUnlocked] = useState(() => isAuthenticated());
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [answeredIds, setAnsweredIds] = useState([]);
  const [totalFalse, setTotalFalse] = useState(0);
  const [isRandom, setIsRandom] = useState(false);
  const [wrongCount, setWrongCount] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("wrongAnswers") || "[]").length;
    } catch {
      return 0;
    }
  });

  // Switch to a new topic (or "all")
  const switchTopic = useCallback((topicId) => {
    setActiveTopic(topicId);
    // If 'all' is chosen, it is ALWAYS randomized. If single topic, randomize only if isRandom is active.
    const newQuestions = normalizeQuestions(topicId, topicId === "all" || isRandom);
    setQuestions(newQuestions);
    setCurrent(0);
    setScore(0);
    setSelectedAnswers([]);
    setShowAnswer(false);
    setAnsweredIds([]);
    setTotalFalse(0);
  }, [isRandom]);

  // Reshuffle current question set
  const reshuffleCurrent = useCallback(() => {
    setQuestions((prev) => shuffleArray(prev));
    setCurrent(0);
    setSelectedAnswers([]);
    setShowAnswer(false);
  }, []);

  // Update stored wrong count
  const refreshWrongCount = () => {
    try {
      const wrong = JSON.parse(localStorage.getItem("wrongAnswers") || "[]");
      setWrongCount(wrong.length);
    } catch {
      setWrongCount(0);
    }
  };

  // Safe localized question content (fall back gracefully if DE is missing like in PenTest+)
  const rawQ = questions[current] || null;
  const qContent = useMemo(() => {
    if (!rawQ) return {};
    if (lang === "de") {
      return rawQ.de || rawQ.en || rawQ;
    }
    return rawQ.en || rawQ.de || rawQ;
  }, [rawQ, lang]);

  // Extract question options
  const optionEntries = useMemo(() => {
    const opts = qContent.optionen || qContent.options || rawQ?.options || rawQ?.optionen || {};
    return Object.entries(opts);
  }, [qContent, rawQ]);

  // Extract correct answers (handles "A", "A,C", "D, F", etc.)
  const correctAnswers = useMemo(() => {
    const ans = qContent.antwort || qContent.answer || rawQ?.answer || rawQ?.antwort || "";
    if (typeof ans === "string") {
      return ans
        .split(/[,\s]+/)
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);
    }
    if (Array.isArray(ans)) {
      return ans.map((s) => String(s).trim().toUpperCase()).filter(Boolean);
    }
    return [];
  }, [qContent, rawQ]);

  const isMultipleChoice = correctAnswers.length > 1;

  // Evaluate answers
  const evaluateAnswers = useCallback(
    (answersToCheck = selectedAnswers) => {
      if (!rawQ || showAnswer || answersToCheck.length === 0) return;
      setShowAnswer(true);

      const isCorrect =
        answersToCheck.length === correctAnswers.length &&
        answersToCheck.every((k) => correctAnswers.includes(k));

      if (isCorrect) {
        setScore((prev) => prev + 1);
        try {
          const wrong = JSON.parse(localStorage.getItem("wrongAnswers") || "[]");
          const updated = wrong.filter(
            (item) => (item._uid || item.id) !== (rawQ._uid || rawQ.id)
          );
          localStorage.setItem("wrongAnswers", JSON.stringify(updated));
          setWrongCount(updated.length);
        } catch (e) {
          console.error(e);
        }
      } else {
        setTotalFalse((prev) => prev + 1);
        try {
          const wrong = JSON.parse(localStorage.getItem("wrongAnswers") || "[]");
          const exists = wrong.some(
            (item) => (item._uid || item.id) === (rawQ._uid || rawQ.id)
          );
          if (!exists) {
            wrong.push(rawQ);
            localStorage.setItem("wrongAnswers", JSON.stringify(wrong));
          }
          setWrongCount(wrong.length);
        } catch (e) {
          console.error(e);
        }
      }

      setAnsweredIds((prev) => [...prev, rawQ._uid || rawQ.id]);
    },
    [rawQ, showAnswer, selectedAnswers, correctAnswers]
  );

  // Handle option click
  const handleOptionClick = (key) => {
    if (showAnswer) return;

    if (isMultipleChoice) {
      // Toggle selection in multi-select mode
      setSelectedAnswers((prev) => {
        const next = prev.includes(key)
          ? prev.filter((k) => k !== key)
          : [...prev, key];
        return next;
      });
    } else {
      // Single choice: instant evaluate
      const single = [key];
      setSelectedAnswers(single);
      evaluateAnswers(single);
    }
  };

  // Next question
  const nextQuestion = useCallback(() => {
    setSelectedAnswers([]);
    setShowAnswer(false);

    if (isRandom) {
      const unanswered = questions.filter(
        (q) => !answeredIds.includes(q._uid || q.id)
      );
      if (unanswered.length === 0) {
        setCurrent(questions.length); // Trigger finish
        return;
      }
      const randomIndex = Math.floor(Math.random() * unanswered.length);
      const nextIdx = questions.findIndex(
        (q) => (q._uid || q.id) === (unanswered[randomIndex]._uid || unanswered[randomIndex].id)
      );
      setCurrent(nextIdx !== -1 ? nextIdx : current + 1);
      return;
    }

    setCurrent((prev) => prev + 1);
  }, [isRandom, questions, answeredIds, current]);

  // Repeat wrong questions
  const repeatWrongQuestions = () => {
    try {
      const wrong = JSON.parse(localStorage.getItem("wrongAnswers") || "[]");
      if (wrong.length > 0) {
        // Tag them properly
        const taggedWrong = wrong.map((q, idx) => ({
          ...q,
          _uid: q._uid || `wrong_${q.id ?? idx}`,
          _originalId: q._originalId || q.id || idx + 1,
          _topicNameDe: q._topicNameDe || "Falsche Fragen",
          _topicNameEn: q._topicNameEn || "Wrong Questions",
          _topicIcon: "⚠️",
        }));
        setQuestions(taggedWrong);
        setActiveTopic("wrong");
        setCurrent(0);
        setScore(0);
        setSelectedAnswers([]);
        setShowAnswer(false);
        setAnsweredIds([]);
        setTotalFalse(0);
      } else {
        alert(
          lang === "de"
            ? "Du hast keine falsch beantworteten Fragen!"
            : "You have no incorrectly answered questions!"
        );
      }
    } catch {
      alert("Error loading wrong questions.");
    }
  };

  // Clear wrong questions from storage
  const clearWrongQuestions = () => {
    if (
      window.confirm(
        lang === "de"
          ? "Möchtest du wirklich alle gespeicherten falschen Fragen löschen?"
          : "Do you really want to delete all saved wrong questions?"
      )
    ) {
      localStorage.removeItem("wrongAnswers");
      setWrongCount(0);
      alert(
        lang === "de"
          ? "Alle falschen Fragen wurden gelöscht!"
          : "All wrong questions deleted!"
      );
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger if user is typing in an input
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") {
        if (showAnswer) {
          e.preventDefault();
          nextQuestion();
        } else if (isMultipleChoice && selectedAnswers.length > 0) {
          e.preventDefault();
          evaluateAnswers();
        }
      }

      // Keys A-F or 1-6 for quick option selection
      const upperKey = e.key.toUpperCase();
      const optionLetters = optionEntries.map(([k]) => k.toUpperCase());
      if (optionLetters.includes(upperKey) && !showAnswer) {
        handleOptionClick(upperKey);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showAnswer, nextQuestion, isMultipleChoice, selectedAnswers, optionEntries, evaluateAnswers]);

  // Image source resolution
  const imageName =
    qContent.image || qContent.bild || rawQ?.image || rawQ?.bild || null;
  const imageUrl = imageName
    ? imageName.startsWith("http")
      ? imageName
      : `${import.meta.env.BASE_URL}assets/${imageName}`
    : null;

  // Active topic object
  const currentTopicObj =
    TOPIC_CONFIGS.find((t) => t.id === activeTopic) || {
      nameDe: activeTopic === "wrong" ? "Falsche Fragen" : activeTopic,
      nameEn: activeTopic === "wrong" ? "Wrong Questions" : activeTopic,
      icon: activeTopic === "wrong" ? "⚠️" : "📚",
      accent: "from-blue-600 to-indigo-600",
    };

  // 0. Security Gate: Render PasswordGate if not unlocked
  if (!isUnlocked) {
    return <PasswordGate onSuccess={() => setIsUnlocked(true)} lang={lang} />;
  }

  // Quiz Finished Screen
  if (current >= questions.length || questions.length === 0) {
    const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    return (
      <div className="min-h-screen w-full bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-8 sm:p-10 text-center relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl" />

          <div className="text-6xl mb-4">
            {percentage >= 85 ? "🏆" : percentage >= 70 ? "🎉" : "📚"}
          </div>

          <h2 className="text-3xl sm:text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300">
            {lang === "de" ? "Quiz abgeschlossen!" : "Quiz completed!"}
          </h2>

          <p className="text-slate-400 text-sm mb-6">
            {currentTopicObj.icon} {lang === "de" ? currentTopicObj.nameDe : currentTopicObj.nameEn}
          </p>

          <div className="grid grid-cols-3 gap-3 my-6">
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4">
              <span className="text-xs text-slate-400 block uppercase font-semibold">
                {lang === "de" ? "Richtig" : "Correct"}
              </span>
              <span className="text-2xl sm:text-3xl font-bold text-emerald-400">{score}</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4">
              <span className="text-xs text-slate-400 block uppercase font-semibold">
                {lang === "de" ? "Falsch" : "Wrong"}
              </span>
              <span className="text-2xl sm:text-3xl font-bold text-rose-400">{totalFalse}</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4">
              <span className="text-xs text-slate-400 block uppercase font-semibold">
                {lang === "de" ? "Quote" : "Score"}
              </span>
              <span className="text-2xl sm:text-3xl font-bold text-sky-400">{percentage}%</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <button
              onClick={() => switchTopic(activeTopic === "wrong" ? "core1" : activeTopic)}
              className="px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-600/30 transition-all hover:scale-105 cursor-pointer"
            >
              {lang === "de" ? "Thema neu starten" : "Restart Topic"}
            </button>
            <button
              onClick={() => switchTopic("all")}
              className="px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 shadow-lg shadow-pink-600/30 transition-all hover:scale-105 cursor-pointer"
            >
              🔀 {lang === "de" ? "Alle Fragen (Gemischt)" : "All Questions (Mixed)"}
            </button>
            {wrongCount > 0 && (
              <button
                onClick={repeatWrongQuestions}
                className="px-6 py-3 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30 transition-all hover:scale-105 cursor-pointer"
              >
                ⚠️ {lang === "de" ? `Falsche wiederholen (${wrongCount})` : `Repeat Wrong (${wrongCount})`}
              </button>
            )}
          </div>

          <div className="mt-8 pt-4 border-t border-slate-800 flex justify-center items-center gap-4">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer flex items-center gap-1.5"
            >
              <span>🔑</span>
              <span>{lang === "de" ? "Passwort ändern" : "Change password"}</span>
            </button>
            <span className="text-slate-700">•</span>
            <button
              onClick={() => {
                logout();
                setIsUnlocked(false);
              }}
              className="text-xs text-rose-400 hover:text-rose-300 transition cursor-pointer flex items-center gap-1.5"
            >
              <span>🔒</span>
              <span>{lang === "de" ? "App sperren" : "Lock app"}</span>
            </button>
          </div>
        </div>

        <ChangePasswordModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          lang={lang}
        />
      </div>
    );
  }

  // Progress percentage
  const progressPercent = Math.min(100, Math.round(((current + 1) / questions.length) * 100));

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col items-center">
      {/* ============================================================ */}
      {/* 1. TOP NAVIGATION BAR: ALL TOPIC BUTTONS & UTILITIES        */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-50 w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
          {/* Top Bar Header Row */}
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                IT Quiz Pro
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                CompTIA & Linux
              </span>
            </div>

            {/* Quick Actions: Language, Wrong repeat, Password & Lock */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => setLang((prev) => (prev === "de" ? "en" : "de"))}
                className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer flex items-center gap-1 shadow-sm"
                title="Switch Language"
              >
                <span>{lang === "de" ? "🇩🇪 DE" : "🇬🇧 EN"}</span>
              </button>

              <button
                onClick={repeatWrongQuestions}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm ${
                  wrongCount > 0
                    ? "bg-rose-600/90 hover:bg-rose-600 text-white border border-rose-500 shadow-rose-600/20"
                    : "bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:bg-slate-800"
                }`}
                title={lang === "de" ? "Falsche Fragen wiederholen" : "Repeat wrong questions"}
              >
                <span>⚠️</span>
                <span className="hidden xs:inline">
                  {lang === "de" ? "Falsche" : "Wrong"}
                </span>
                <span className="px-1.5 py-0.2 rounded-full bg-black/30 text-[10px]">
                  {wrongCount}
                </span>
              </button>

              <button
                onClick={() => setShowPasswordModal(true)}
                className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer flex items-center gap-1 shadow-sm"
                title={lang === "de" ? "Passwort verwalten" : "Manage password"}
              >
                <span>🔑</span>
                <span className="hidden md:inline">
                  {lang === "de" ? "Passwort" : "Password"}
                </span>
              </button>

              <button
                onClick={() => {
                  logout();
                  setIsUnlocked(false);
                }}
                className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-rose-950/70 hover:text-rose-300 text-slate-300 border border-slate-700 transition cursor-pointer flex items-center gap-1 shadow-sm"
                title={lang === "de" ? "App sperren" : "Lock app"}
              >
                <span>🔒</span>
                <span className="hidden md:inline">
                  {lang === "de" ? "Sperren" : "Lock"}
                </span>
              </button>
            </div>
          </div>

          {/* TOPIC BUTTONS ROW (HORIZONTAL SCROLL ON MOBILE) */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-thin scrollbar-thumb-slate-700">
            {TOPIC_CONFIGS.map((topic) => {
              const isActive = activeTopic === topic.id;
              const qCount = topic.isAll
                ? TOPIC_CONFIGS.filter((t) => !t.isAll).reduce((acc, t) => acc + (t.data?.length || 0), 0)
                : topic.data?.length || 0;

              return (
                <button
                  key={topic.id}
                  onClick={() => switchTopic(topic.id)}
                  className={`group shrink-0 px-3 sm:px-3.5 py-1.5 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200 cursor-pointer flex items-center gap-1.5 sm:gap-2 border ${
                    isActive
                      ? topic.isAll
                        ? "bg-gradient-to-r from-fuchsia-600 via-pink-600 to-purple-600 text-white border-fuchsia-400 shadow-lg shadow-fuchsia-500/30 scale-105"
                        : `bg-gradient-to-r ${topic.accent} text-white border-white/30 shadow-md scale-105 font-bold`
                      : topic.isAll
                      ? "bg-fuchsia-950/40 hover:bg-fuchsia-900/60 text-fuchsia-200 border-fuchsia-700/60 hover:border-fuchsia-500"
                      : "bg-slate-800/80 hover:bg-slate-700/90 text-slate-300 border-slate-700 hover:text-white"
                  }`}
                >
                  <span className="text-sm sm:text-base">{topic.icon}</span>
                  <span>{lang === "de" ? topic.nameDe : topic.nameEn}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
                      isActive
                        ? "bg-black/30 text-white"
                        : "bg-slate-900/60 text-slate-400 group-hover:text-slate-300"
                    }`}
                  >
                    {qCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="w-full bg-slate-800 h-1 relative overflow-hidden">
          <div
            className={`h-full transition-all duration-300 bg-gradient-to-r ${currentTopicObj.accent || "from-blue-500 to-purple-500"}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* ============================================================ */}
      {/* 2. SUB-BAR: STATS, TOPIC PILL & PROGRESS                    */}
      {/* ============================================================ */}
      <div className="w-full max-w-4xl px-4 pt-4 pb-2 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-slate-400">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-slate-800/90 text-slate-200 font-medium border border-slate-700 flex items-center gap-1.5">
            <span>{currentTopicObj.icon}</span>
            <span className="font-semibold text-white">
              {lang === "de" ? currentTopicObj.nameDe : currentTopicObj.nameEn}
            </span>
          </span>
          <span className="text-slate-500">•</span>
          <span className="font-medium text-slate-300">
            {lang === "de" ? "Frage" : "Question"}{" "}
            <span className="text-white font-bold">{current + 1}</span>{" "}
            {lang === "de" ? "von" : "of"}{" "}
            <span className="text-slate-400">{questions.length}</span>
          </span>
        </div>

        {/* Live Score Counter */}
        <div className="flex items-center gap-3">
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <span>✓</span> {score}
          </span>
          <span className="text-rose-400 font-semibold flex items-center gap-1">
            <span>✗</span> {totalFalse}
          </span>
          <span className="text-sky-400 font-semibold">
            {answeredIds.length > 0
              ? `${Math.round((score / answeredIds.length) * 100)}%`
              : "0%"}
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. MAIN QUIZ CARD                                            */}
      {/* ============================================================ */}
      <main className="w-full max-w-4xl px-3 sm:px-4 py-3 pb-24 flex-1 flex flex-col justify-start">
        <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-800/90 rounded-3xl shadow-2xl p-5 sm:p-8 relative overflow-hidden transition-all duration-300">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Card Top Meta: Question ID & Source Topic */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-800 text-purple-300 border border-slate-700">
                {rawQ._topicIcon || "📌"}{" "}
                {lang === "de" ? rawQ._topicNameDe : rawQ._topicNameEn} #{rawQ._originalId}
              </span>

              {isMultipleChoice && (
                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                  {lang === "de"
                    ? `Mehrfachauswahl: ${correctAnswers.length} Antworten`
                    : `Multiple Choice: Select ${correctAnswers.length} answers`}
                </span>
              )}
            </div>

            {/* Hint for selected count in multiple choice */}
            {isMultipleChoice && !showAnswer && (
              <span className="text-xs text-slate-400">
                {lang === "de"
                  ? `${selectedAnswers.length} von ${correctAnswers.length} ausgewählt`
                  : `${selectedAnswers.length} of ${correctAnswers.length} selected`}
              </span>
            )}
          </div>

          {/* Question Text */}
          <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-slate-100 mb-6 leading-relaxed">
            {qContent.frage || qContent.question || "Keine Frage vorhanden"}
          </h1>

          {/* Optional Illustration Image */}
          {imageUrl && (
            <div className="flex justify-center mb-6">
              <img
                src={imageUrl}
                alt="Question diagram"
                onError={(e) => {
                  // Fallback to GitHub Pages asset hosting if relative image path fails
                  e.target.onerror = null;
                  e.target.src = `https://emami-114.github.io/my-quiz2/assets/${imageName}`;
                }}
                className="max-h-72 max-w-full rounded-xl border border-slate-700 bg-slate-950/80 p-2 object-contain shadow-lg"
              />
            </div>
          )}

          {/* Options Grid */}
          <div className="space-y-3 sm:space-y-3.5 mb-6">
            {optionEntries.map(([key, text]) => {
              const isSelected = selectedAnswers.includes(key);
              const isCorrectAnswer = correctAnswers.includes(key);

              // Styling calculation based on state
              let btnStyle =
                "bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border-slate-700/80 hover:border-slate-600";
              let badgeStyle = "bg-slate-700 text-slate-300";

              if (showAnswer) {
                if (isSelected && isCorrectAnswer) {
                  // User chose correct
                  btnStyle =
                    "bg-emerald-950/60 text-emerald-100 border-emerald-500 shadow-md shadow-emerald-900/30";
                  badgeStyle = "bg-emerald-500 text-white font-bold";
                } else if (isSelected && !isCorrectAnswer) {
                  // User chose wrong
                  btnStyle =
                    "bg-rose-950/60 text-rose-100 border-rose-500 shadow-md shadow-rose-900/30";
                  badgeStyle = "bg-rose-500 text-white font-bold";
                } else if (!isSelected && isCorrectAnswer) {
                  // Correct answer user missed
                  btnStyle =
                    "bg-emerald-950/30 text-emerald-200 border-emerald-500/80 border-dashed animate-pulse";
                  badgeStyle = "bg-emerald-600 text-white";
                } else {
                  btnStyle = "bg-slate-900/40 text-slate-500 border-slate-800 opacity-60";
                  badgeStyle = "bg-slate-800 text-slate-500";
                }
              } else if (isSelected) {
                // Multi-select preview before checking
                btnStyle =
                  "bg-purple-950/60 text-white border-purple-400 shadow-md shadow-purple-900/30 ring-1 ring-purple-400";
                badgeStyle = "bg-purple-500 text-white font-bold";
              }

              return (
                <button
                  key={key}
                  onClick={() => handleOptionClick(key)}
                  disabled={showAnswer}
                  className={`w-full p-3.5 sm:p-4 rounded-2xl text-left transition-all duration-200 cursor-pointer flex items-start gap-3 border ${btnStyle}`}
                >
                  <span
                    className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm transition-colors ${badgeStyle}`}
                  >
                    {key}
                  </span>
                  <span className="text-sm sm:text-base leading-snug pt-1">{text}</span>
                </button>
              );
            })}
          </div>

          {/* Confirm Button for Multi-Choice questions */}
          {isMultipleChoice && !showAnswer && (
            <div className="flex justify-end mb-4">
              <button
                onClick={() => evaluateAnswers()}
                disabled={selectedAnswers.length === 0}
                className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                  selectedAnswers.length === correctAnswers.length
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 animate-pulse hover:scale-105"
                    : selectedAnswers.length > 0
                    ? "bg-purple-600 hover:bg-purple-500 text-white shadow-md"
                    : "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60"
                }`}
              >
                <span>✓</span>
                <span>{lang === "de" ? "Antwort prüfen" : "Check Answer"}</span>
              </button>
            </div>
          )}

          {/* Explanation Box (Visible when answered) */}
          {showAnswer && (
            <div className="mt-6 p-5 sm:p-6 rounded-2xl bg-slate-800/90 border border-slate-700 shadow-inner">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {selectedAnswers.length === correctAnswers.length &&
                    selectedAnswers.every((k) => correctAnswers.includes(k))
                      ? "✅"
                      : "❌"}
                  </span>
                  <h3
                    className={`font-bold text-base sm:text-lg ${
                      selectedAnswers.length === correctAnswers.length &&
                      selectedAnswers.every((k) => correctAnswers.includes(k))
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {selectedAnswers.length === correctAnswers.length &&
                    selectedAnswers.every((k) => correctAnswers.includes(k))
                      ? lang === "de"
                        ? "Richtig! Hervorragend!"
                        : "Correct! Well done!"
                      : lang === "de"
                      ? `Falsch! Richtige Antwort: ${correctAnswers.join(", ")}`
                      : `Incorrect! Correct answer: ${correctAnswers.join(", ")}`}
                  </h3>
                </div>

                <span className="text-xs text-slate-400 hidden sm:inline">
                  {lang === "de" ? "[Leertaste / Enter ➔ Weiter]" : "[Space / Enter ➔ Next]"}
                </span>
              </div>

              {/* Explanation Content */}
              {(qContent.erklärung || qContent.explanation) && (
                <div className="text-slate-300 text-sm sm:text-base leading-relaxed mt-2 border-t border-slate-700/80 pt-3">
                  <span className="font-semibold text-slate-100 block mb-1">
                    {lang === "de" ? "Erklärung:" : "Explanation:"}
                  </span>
                  <p>{qContent.erklärung || qContent.explanation}</p>
                </div>
              )}

              {/* Next Question Big Action */}
              <div className="mt-5 flex justify-end">
                <button
                  onClick={nextQuestion}
                  className="px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 cursor-pointer flex items-center gap-2"
                >
                  <span>{lang === "de" ? "Nächste Frage" : "Next Question"}</span>
                  <span>➔</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ============================================================ */}
      {/* 4. BOTTOM BAR CONTROLS                                       */}
      {/* ============================================================ */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 px-4 py-2.5">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2">
          {/* Left: Clear wrong storage */}
          <button
            onClick={clearWrongQuestions}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-300 hover:bg-slate-800 transition cursor-pointer flex items-center gap-1.5"
            title="Clear stored wrong questions"
          >
            <span>🗑️</span>
            <span className="hidden sm:inline">
              {lang === "de" ? "Falsche löschen" : "Clear wrong"}
            </span>
          </button>

          {/* Center / Right: Shuffle & Skip buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={reshuffleCurrent}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
              title="Reshuffle question order"
            >
              <span>🎲</span>
              <span>{lang === "de" ? "Neu mischen" : "Reshuffle"}</span>
            </button>

            <button
              onClick={() => setIsRandom((prev) => !prev)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
                isRandom
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
              }`}
            >
              <span>{isRandom ? "⚡" : "📋"}</span>
              <span>
                {isRandom
                  ? lang === "de"
                    ? "Zufall: Ein"
                    : "Random: On"
                  : lang === "de"
                  ? "Zufall: Aus"
                  : "Random: Off"}
              </span>
            </button>

            <button
              onClick={nextQuestion}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition cursor-pointer flex items-center gap-1"
            >
              <span>{lang === "de" ? "Weiter / Skip" : "Skip"}</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Password Management Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        lang={lang}
      />
    </div>
  );
}
