import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'        /* 1. base reset */
import './styles/theme.css' /* 2. design tokens */
import './App.css'          /* 3. utilities & animations */
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
