import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { initAuthStore } from './features/auth/stores/authStore'

async function main() {
  // Resolve the initial session before ./app/App (and, transitively,
  // ./app/router, whose createBrowserRouter starts loading data as soon as
  // it's constructed) is even imported — see the comment on initAuthStore.
  await initAuthStore()
  const { App } = await import('./app/App.tsx')

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}

main()
