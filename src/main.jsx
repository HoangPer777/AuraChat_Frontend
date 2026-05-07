import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

/**
 * Validate required environment variables on app startup
 * This ensures the application has all necessary configuration before running
 */
const validateEnvironment = () => {
  const requiredVars = [
    'VITE_API_BASE_URL',
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ]

  const missingVars = requiredVars.filter(
    (varName) => !import.meta.env[varName]
  )

  if (missingVars.length > 0) {
    const errorMessage = 
      `Missing required environment variables: ${missingVars.join(', ')}.\n\n` +
      `Please ensure your .env file contains all required configuration.\n` +
      `See .env.example for the required variables.`
    
    console.error(errorMessage)
    throw new Error(errorMessage)
  }
}

// Validate environment before rendering the app
try {
  validateEnvironment()
} catch (error) {
  // Display error message to user
  const root = document.getElementById('root')
  if (root) {
    root.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        background-color: #f3f4f6;
        font-family: system-ui, -apple-system, sans-serif;
      ">
        <div style="
          background: white;
          padding: 2rem;
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          max-width: 500px;
          text-align: center;
        ">
          <h1 style="color: #dc2626; margin-top: 0;">Configuration Error</h1>
          <p style="color: #374151; white-space: pre-wrap; text-align: left;">
            ${error.message}
          </p>
          <p style="color: #6b7280; font-size: 0.875rem;">
            Please check your environment configuration and try again.
          </p>
        </div>
      </div>
    `
  }
  throw error
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
