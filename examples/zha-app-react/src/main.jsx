import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@gitzhacode/zha-ui-css/index.css'; // tokens + primitives + lockup - the whole brand
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
