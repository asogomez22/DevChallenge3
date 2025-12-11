import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import "./index.css"; // asegúrate de importar el global

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
