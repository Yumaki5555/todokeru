import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { initFromSite } from './lib/fromSite';
import './styles/global.css';

// 別のサイトからの引き継ぎ情報を、画面を作る前に読み取る（URL からも外す）
initFromSite();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
