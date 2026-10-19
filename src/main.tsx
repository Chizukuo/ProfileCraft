import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';
import './styles/App.css';
import { ProfileProvider } from './context/ProfileContext';
import { ThemeProvider } from './context/ThemeContext';
import { LocaleProvider } from './context/LocaleContext';
import { EditorUIProvider } from './context/EditorUIContext';
import ErrorBoundary from './components/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <LocaleProvider>
        <ProfileProvider>
          <ThemeProvider>
            <EditorUIProvider>
              <App />
            </EditorUIProvider>
          </ThemeProvider>
        </ProfileProvider>
      </LocaleProvider>
    </ErrorBoundary>
  </React.StrictMode>
);