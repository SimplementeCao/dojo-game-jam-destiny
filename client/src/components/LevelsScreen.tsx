import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount, useDisconnect } from '@starknet-react/core'
import { useGameActions } from '../hooks/useGameActions'

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
  const { account } = useAccount()
  const { disconnect } = useDisconnect()
  const wasConnectedRef = useRef(false)
  const hasRedirectedRef = useRef(false)
  const { startBattle } = useGameActions();

  useEffect(() => {
    localStorage.setItem('destiny_unlocked_level', String(unlocked))
  }, [unlocked])

  // Track si el usuario estaba conectado anteriormente
  useEffect(() => {
    if (account) {
      wasConnectedRef.current = true
      hasRedirectedRef.current = false // Reset cuando se reconecta
    }
  }, [account])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!account && !hasRedirectedRef.current && !wasConnectedRef.current) {
        console.log('⚠️ No hay wallet conectada, redirigiendo a HomeScreen...')
        hasRedirectedRef.current = true
        navigate('/')
      }
    }, 500) // Esperar 500ms para dar tiempo a que se sincronice el estado de conexión

    return () => clearTimeout(timer)
  }, [account, navigate])

  // Redirigir cuando se desconecta DESPUÉS de haber estado conectado
  useEffect(() => {
    if (!account && wasConnectedRef.current && !hasRedirectedRef.current) {
      console.log('🚪 Wallet desconectada, redirigiendo a HomeScreen...')
      wasConnectedRef.current = false
      hasRedirectedRef.current = true
      navigate('/')
    }

  }, [account, navigate])

  const handleSelect = async (level: LevelId) => {
    let result = await startBattle(level);
    navigate(`/battle/${BigInt(result?.battle_id as string)}`)
  }

  const handleLogout = async () => {
    console.log('🚪 Ejecutando logout...')
    await disconnect()
  }

  return (
    <div className="levels-screen pantalla-inicio-background" aria-label="Levels">
      {/* Status badge top-right */}
      <div className="status-badge">
        <div className={`status-line ${account ? 'ok' : 'warn'}`}>
          {account ? 'CONNECTED' : 'DISCONNECTED'}
        </div>
        <button
          className="status-action"
          onClick={() => account ? handleLogout() : navigate('/')}
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

