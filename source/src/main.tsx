import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';
import { installNavigation } from './navigate';
installNavigation();
createRoot(document.getElementById('root')!).render(<App />);
