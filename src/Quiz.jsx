import { useState } from "react";
import { Card, CardContent } from "./Card";
import { Button } from "./Card";
import questions2 from "./newQuiz.json";

export default function Quiz() {
  const [questions, setQuestions] = useState(questions2);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState("");
  const [score, setScore] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [lang, setLang] = useState("de"); // Sprach-State
  const [answeredIds, setAnsweredIds] = useState([]);

  const handleSelect = (option) => {
    setSelected(option);
    setShowAnswer(true);

    const isCorrect = option === questions[current][lang].antwort || option === questions[current][lang].answer;

    if (isCorrect) {
      setScore(score + 1);

      // Entferne die Frage aus dem Speicher, wenn sie richtig beantwortet wurde
      const wrong = JSON.parse(localStorage.getItem("wrongAnswers") || "[]");
      const updatedWrong = wrong.filter((q) => q.id !== questions[current].id);
      localStorage.setItem("wrongAnswers", JSON.stringify(updatedWrong));
    } else {
      // Füge die Frage hinzu, wenn sie falsch beantwortet wurde
      const wrong = JSON.parse(localStorage.getItem("wrongAnswers") || "[]");
      const alreadySaved = wrong.some((q) => q.id === questions[current].id);
      if (!alreadySaved) {
        wrong.push(questions[current]);
        localStorage.setItem("wrongAnswers", JSON.stringify(wrong));
      }
    }
    setAnsweredIds([...answeredIds, questions[current].id]);
  };

    // Funktion, um eine zufällige unbeantwortete Frage zu wählen
  const pickRandomQuestion = () => {
    const unanswered = questions.filter(q => !answeredIds.includes(q.id));
    if (unanswered.length === 0) {
      setCurrent(null);
      return;
    }
    const randomIndex = Math.floor(Math.random() * unanswered.length);
    setCurrent(questions.findIndex(q => q.id === unanswered[randomIndex].id));
  };

  const nextQuestion = () => {
    setSelected("");
    setShowAnswer(false);
    pickRandomQuestion();
  };

  const repeatWrongQuestions = () => {
    const wrong = JSON.parse(localStorage.getItem("wrongAnswers") || "[]");
    if (wrong.length > 0) {
      setQuestions(wrong);
      setCurrent(0);
      setScore(0);
      setSelected("");
      setShowAnswer(false);
    } else {
      alert(lang === "de" ? "Du hast keine falsch beantworteten Fragen!" : "You have no incorrectly answered questions!");
    }
  };

  if (!questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white text-2xl font-semibold">
        {lang === "de" ? "Fragen werden geladen..." : "Loading questions..."}
      </div>
    );
  }

  if (current >= questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white text-center p-6">
        {/* Sprachumschalter */}
        <Button
          className="fixed top-4 left-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full shadow-lg z-50"
          onClick={() => setLang(lang === "de" ? "en" : "de")}
        >
          {lang === "de" ? "English" : "Deutsch"}
        </Button>
        {/* Dauerhafter Button */}
        <Button
          className="fixed top-4 right-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full shadow-lg z-50"
          onClick={repeatWrongQuestions}
        >
          {lang === "de" ? "Falsche Fragen wiederholen" : "Repeat wrong questions"}
        </Button>
        <Card className="bg-gray-800 w-full max-w-xl rounded-3xl shadow-2xl p-8 transform transition-all duration-500 ease-in-out scale-105">
          <CardContent>
            <h2 className="text-4xl font-extrabold mb-6 text-purple-400 animate-pulse">
              {lang === "de" ? "🎉 Quiz beendet! 🎉" : "🎉 Quiz finished! 🎉"}
            </h2>
            <p className="text-2xl mb-8">
              {lang === "de" ? "Dein Ergebnis:" : "Your result:"} <span className="font-bold text-green-400">{score}</span> {lang === "de" ? "von" : "of"}{" "}
              <span className="font-bold text-blue-400">{questions.length}</span> {lang === "de" ? "Fragen richtig beantwortet!" : "questions answered correctly!"}
            </p>
            <Button
              className="mt-8 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg transform transition-transform duration-300 hover:scale-105"
              onClick={() => window.location.reload()}
            >
              {lang === "de" ? "Neues Quiz starten" : "Start new quiz"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[current][lang];
  const optionEntries = Object.entries(currentQuestion.optionen || currentQuestion.options);

  return (
    <div className="min-h-screen min-w-screen flex items-center justify-center bg-gray-900 text-white p-6">
      {/* Sprachumschalter */}
      <Button
        className="fixed top-4 left-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full shadow-lg z-50"
        onClick={() => setLang(lang === "de" ? "en" : "de")}
      >
        {lang === "de" ? "English" : "Deutsch"}
      </Button>
      {/* Dauerhafter Button */}
       <Button
        className="fixed top-4 center bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full shadow-lg z-50 "
        onClick={() => {}}
      >
        {lang === "de" ? `Gesamtfragen:  ${answeredIds.length}` : `Total Questions:  ${answeredIds.length}`}
      </Button>
      <Button
        className="fixed top-4 right-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-full shadow-lg z-50"
        onClick={repeatWrongQuestions}
      >
        {lang === "de" ? "Falsche Fragen wiederholen" : "Repeat wrong questions"}
      </Button>
      <Card className="bg-gray-800 w-full max-w-2xl rounded-3xl shadow-2xl p-8">
        <CardContent>
        <h2 className="text-center text-3xl font-bold mb-8 text-blue-400">
          {lang === "de"
            ? `Frage ${questions[current].id} von ${questions[questions.length - 1].id}`
            : `Question ${questions[current].id} of ${questions[questions.length - 1].id}`}
        </h2>
          <p className="text-center text-2xl mb-8 font-medium leading-relaxed">{currentQuestion.frage || currentQuestion.question}</p>
          <div className="space-y-5">
            {optionEntries.map(([key, value]) => (
              <Button
                key={key}
                onClick={() => handleSelect(key)}
                disabled={showAnswer}
                className={`w-full text-xl py-3 rounded-xl justify-start transition-all duration-300 ease-in-out
                  ${
                    selected === key
                      ? selected === (currentQuestion.antwort || currentQuestion.answer)
                        ? "bg-green-700 text-white shadow-md border-2 border-green-500"
                        : "bg-red-700 text-white shadow-md border-2 border-red-500"
                      : "bg-gray-700 hover:bg-gray-600 text-gray-100 border border-gray-600"
                  }
                  ${showAnswer && selected !== key && key === (currentQuestion.antwort || currentQuestion.answer) ? "bg-green-900 text-white border-2 border-green-500 animate-pulse" : ""}
                `}
              >
                <span className="font-bold mr-2">{key}.</span> {value}
              </Button>
            ))}
          </div>
          {showAnswer && (
            <div className="mt-8 text-center bg-gray-700 p-6 rounded-2xl shadow-inner">
              <p
                className={`text-2xl font-extrabold mb-4 ${
                  selected === (currentQuestion.antwort || currentQuestion.answer) ? "text-green-400" : "text-red-400"
                }`}
              >
                {selected === (currentQuestion.antwort || currentQuestion.answer)
                  ? lang === "de" ? "✅ Richtig! Fantastisch!" : "✅ Correct! Fantastic!"
                  : lang === "de"
                    ? `❌ Falsch! Die richtige Antwort war: ${currentQuestion.antwort}`
                    : `❌ Wrong! The correct answer was: ${currentQuestion.answer}`}
              </p>
              <p className="mt-4 text-gray-300 text-lg leading-relaxed">
                <span className="font-semibold text-white">{lang === "de" ? "Erklärung:" : "Explanation:"}</span> {currentQuestion.erklärung || currentQuestion.explanation}
              </p>
              <Button
                className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg transform transition-transform duration-300 hover:scale-105"
                onClick={nextQuestion}
              >
                {lang === "de" ? "Nächste Frage" : "Next question"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}