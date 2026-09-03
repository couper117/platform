// App entry point — mounts the root React tree with StrictMode.
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './i18n'

/**
 * Which build is running, in the console on every load.
 *
 * The companion to the `app-build` meta tag: the tag proves what the SERVER
 * sent, this proves what the BROWSER is executing, and when the two disagree
 * the answer is a stale service worker rather than a stale deployment. Without
 * both, "I pushed and nothing changed" has no way to be diagnosed from outside.
 */
console.info(`RwaSport build ${__BUILD_SHA__} · ${__BUILD_AT__}`);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
