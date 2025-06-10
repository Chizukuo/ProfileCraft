import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';
import './styles/App.css';
import { ProfileProvider } from './context/ProfileContext';
import { ThemeProvider } from './context/ThemeContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <ProfileProvider>
        <App />
      </ProfileProvider>
    </ThemeProvider>
  </React.StrictMode>
);