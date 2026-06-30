import React from 'react';
import { createRoot } from 'react-dom/client';
import AuthShell from './AuthShell.jsx';
import StudifyApp from './StudifyApp.jsx';
import './styles.css';
import './responsive.css';
import './mvp.css';
import './auth.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthShell>
      <StudifyApp />
    </AuthShell>
  </React.StrictMode>
);
