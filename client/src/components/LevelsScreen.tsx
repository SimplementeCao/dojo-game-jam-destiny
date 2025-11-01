import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount, useDisconnect } from '@starknet-react/core'

type LevelId = 1 | 2 | 3

const TOTAL_LEVELS: LevelId[] = [1, 2, 3]

function getInitialUnlocked(): LevelId {
  const saved = Number(localStorage.getItem('destiny_unlocked_level'))
  if (saved === 2 || saved === 3) return saved as LevelId
  return 1
}

export default function LevelsScreen() {
  const navigate = useNavigate()
  const [unlocked, setUnlocked] = useState<LevelId>(getInitialUnlocked())
  const { account, address, status } = useAccount()
  const { disconnect } = useDisconnect()

  const shortAddr = (addr?: string) => addr ? `${addr.slice(0,6)}...${addr.slice(-4)}` : ''

  useEffect(() => {
    localStorage.setItem('destiny_unlocked_level', String(unlocked))
  }, [unlocked])

  const handleSelect = (level: LevelId) => {
    if (level > unlocked) return
    navigate(`/scene/${level}`)
    if (level < 3 && unlocked === level) setUnlocked((level + 1) as LevelId)
  }

  return (
    <div className="levels-screen pantalla-inicio-background" aria-label="Levels">
      {/* Status badge top-right */}
      <div className="status-badge">
        <div className={`status-line ${account ? 'ok' : 'warn'}`}>
          {account ? 'CONNECTED' : 'DISCONNECTED'}
        </div>
        <div className="status-addr">{shortAddr(address)}</div>
        <button
          className="status-action"
          onClick={() => account ? disconnect() : navigate('/')}
        >
          {account ? 'LOGOUT' : 'LOGIN'}
        </button>
      </div>

      <div className="levels-grid">
        {TOTAL_LEVELS.map((lv) => {
          const locked = lv > unlocked
          return (
            <button
              key={lv}
              className={`level-card ${locked ? 'locked' : 'unlocked'}`}
              onClick={() => handleSelect(lv)}
              aria-label={`Level ${lv}${locked ? ' (locked)' : ''}`}
              disabled={locked}
            >
              {locked && <div className="level-lock" aria-hidden>🔒</div>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

