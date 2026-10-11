import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { PresentationRoute } from './PresentationRoute';
createRoot(document.getElementById('root')!).render(<StrictMode><PresentationRoute pathname={window.location.pathname}/></StrictMode>);
