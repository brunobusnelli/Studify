import React from 'react';
import { createRoot } from 'react-dom/client';
import StudifyApp from './StudifyApp.jsx';
import './styles.css';
import './responsive.css';
import './mvp.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <StudifyApp />
  </React.StrictMode>
);
