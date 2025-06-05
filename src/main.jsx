import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter as Router} from 'react-router-dom'; // Neue Version

import './index.css'
import Quiz from './Quiz.jsx'

createRoot(document.getElementById('root')).render(
  <Router>
  <Quiz />
  </Router>,
)
