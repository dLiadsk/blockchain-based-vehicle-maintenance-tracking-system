import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { CssBaseline } from '@mui/material'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <AuthProvider>
            <CssBaseline /> {/* Це скидає стандартні відступи браузера для красивого дизайну MUI */}
            <App />
        </AuthProvider>
    </React.StrictMode>,
)