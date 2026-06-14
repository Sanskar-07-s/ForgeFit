// ForgeFit AI - React Bootstrap Entry main.tsx (v4.3)

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { FitnessDataProvider } from './context/FitnessDataContext';
import { SyncProvider } from './context/SyncContext';
import { NotificationProvider } from './context/NotificationContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <FitnessDataProvider>
          <SyncProvider>
            <NotificationProvider>
              <App />
            </NotificationProvider>
          </SyncProvider>
        </FitnessDataProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
