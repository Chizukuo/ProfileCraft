import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/App';
import './styles/App.css';
import { ProfileProvider } from './context/ProfileContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ProfileProvider>
      <App />
    </ProfileProvider>
  </React.StrictMode>
);