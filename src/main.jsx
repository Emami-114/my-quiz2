import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Quiz from './Quiz.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
  <Quiz />
  </StrictMode>,
)
