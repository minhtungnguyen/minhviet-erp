import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'        /* 1. base reset */
import './styles/theme.css' /* 2. design tokens */
import './App.css'          /* 3. utilities & animations */
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if (import.meta.env.PROD) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    const updateSW = registerSW({
      onNeedRefresh() {
        const bar = document.createElement('div')
        bar.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#172554;color:#fff;padding:12px 16px;display:flex;align-items:center;justify-content:center;gap:12px;font-family:"Be Vietnam Pro",sans-serif;font-size:14px;box-shadow:0 -2px 12px rgba(0,0,0,.2)'
        const label = document.createElement('span')
        label.textContent = 'Có bản cập nhật mới cho hệ thống.'
        const btn = document.createElement('button')
        btn.textContent = 'Tải lại ngay'
        btn.style.cssText = 'background:#2563eb;color:#fff;border:none;border-radius:8px;padding:8px 14px;font-weight:700;cursor:pointer'
        btn.onclick = () => updateSW(true)
        bar.appendChild(label)
        bar.appendChild(btn)
        document.body.appendChild(bar)
      },
    })
  })
}
