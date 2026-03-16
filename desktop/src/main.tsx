import { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { IslandApp } from './IslandApp'
import { PairingApp } from './PairingApp'
import { SettingsApp } from './SettingsApp'
import './index.css'

function Root() {
  const [label, setLabel] = useState<string | null>(null)

  useEffect(() => {
    // 立即尝试获取，同时也在 mount 后获取
    const current = getCurrentWindow()
    setLabel(current.label)
  }, [])

  useEffect(() => {
    if (import.meta.env.DEV) {
      return
    }

    const suppressContextMenu = (event: MouseEvent) => {
      event.preventDefault()
    }

    window.addEventListener('contextmenu', suppressContextMenu)
    return () => {
      window.removeEventListener('contextmenu', suppressContextMenu)
    }
  }, [])

  if (!label) {
    return null
  }

  // 如果是主窗口(灵动岛)，不要包任何带有背景的 div
  if (label === 'main') {
    return <IslandApp />
  }

  // 其他窗口使用深色主题
  return (
    <div className="h-full w-full modern-bg text-white">
      {label === 'pairing' && <PairingApp />}
      {label === 'settings' && <SettingsApp />}
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />)
