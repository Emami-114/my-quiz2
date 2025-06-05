import { useState, useEffect } from 'react'
import './App.css'
import quizQuestionsData from "./questions_200.json";



function App() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true); // Start in Dark Mode
  const [quizQuestions, setQuizQuestions] = useState([]);

  // Lade die Fragen, wenn die Komponente gemountet wird
useEffect(() => {
  setQuizQuestions(quizQuestionsData);
}, []);


  // Handle option selection
  const handleOptionClick = (option) => {
    setSelectedAnswer(option);
    setShowExplanation(true);
  };

  // Navigate to the next question
  const handleNextQuestion = () => {
    setSelectedAnswer(null);
    setShowExplanation(false);
    setCurrentQuestionIndex((prevIndex) => (prevIndex + 1) % quizQuestions.length);
  };

  // Navigate to the previous question
  const handlePreviousQuestion = () => {
    setSelectedAnswer(null);
    setShowExplanation(false);
    setCurrentQuestionIndex((prevIndex) =>
      prevIndex === 0 ? quizQuestions.length - 1 : prevIndex - 1
    );
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  // Zeige nichts an, bis die Fragen geladen sind
  if (quizQuestions.length === 0) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
        <p>Lade Fragen...</p>
      </div>
    );
  }

  //const currentQuestion = quizQuestions[currentQuestionIndex];

  return (  
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className={`w-full max-w-2xl p-8 rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Quiz App</h1>
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-full bg-gray-700 text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-300 ease-in-out"
            aria-label="Toggle Dark Mode"
          >
            {isDarkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h1M4 12H3m15.325 5.325l-.707.707M6.364 6.364l-.707-.707m12.728 0l-.707.707M6.364 17.636l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9 9 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>

        <div className="mb-8">
          <p className="text-xl font-semibold mb-4">{currentQuestionIndex + 1}. {currentQuestion.question}</p>
          <div className="grid grid-cols-1 gap-4">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionClick(option)}
                className={`
                  p-3 border rounded-md text-left transition duration-300 ease-in-out
                  ${isDarkMode ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}
                  ${selectedAnswer === option ?
                    (option === currentQuestion.answer ? 'bg-green-600 text-white' : 'bg-red-600 text-white')
                    : ''
                  }
                  ${selectedAnswer && option === currentQuestion.answer && selectedAnswer !== option ? 'bg-green-600 text-white opacity-70' : ''}
                  ${selectedAnswer && selectedAnswer !== option && option !== currentQuestion.answer ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                disabled={selectedAnswer !== null} // Disable options after an answer is selected
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {showExplanation && (
          <div className={`p-4 mt-6 rounded-md ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'} border-l-4 ${isDarkMode ? 'border-blue-500' : 'border-blue-700'}`}>
            <h3 className="text-lg font-semibold mb-2">Erklärung:</h3>
            <p>{currentQuestion.explanation}</p>
          </div>
        )}

        <div className="flex justify-between mt-8">
          <button
            onClick={handlePreviousQuestion}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-300 ease-in-out shadow-md"
          >
            Vorherige Frage
          </button>
          <button
            onClick={handleNextQuestion}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-300 ease-in-out shadow-md"
          >
            Nächste Frage
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
