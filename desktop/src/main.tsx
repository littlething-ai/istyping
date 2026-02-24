import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { IslandApp } from './IslandApp'
import { PairingApp } from './PairingApp'
import { SettingsApp } from './SettingsApp'
import './index.css'

function Root() {
  const [label, setLabel] = useState<string | null>(null)

  useEffect(() => {
    setLabel(getCurrentWindow().label)
  }, [])

  if (!label) return null

  return (
    <React.StrictMode>
      {label === 'main' && <IslandApp />}
      {label === 'pairing' && <PairingApp />}
      {label === 'settings' && <SettingsApp />}
    </React.StrictMode>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />)