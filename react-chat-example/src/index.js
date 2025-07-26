import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { suppressResizeObserverErrors } from './utils/resizeObserverUtils';

// Initialize ResizeObserver error suppression
suppressResizeObserverErrors();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
