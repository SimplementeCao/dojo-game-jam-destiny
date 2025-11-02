import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount, useDisconnect } from '@starknet-react/core'
import { useGameActions } from '../hooks/useGameActions'
import { useProgressData } from '../hooks/useBattleData'

type LevelId = 1 | 2 | 3
const TOTAL_LEVELS: LevelId[] = [1, 2, 3]
const LEVEL_DIFFICULTIES: Record<LevelId, string> = {
  1: 'EASY',
  2: 'MEDIUM',
  3: 'HARD'
}

export default function LevelsScreen() {
  const navigate = useNavigate()
  const [unlocked, setUnlocked] = useState<LevelId>()
  const [isNavigating, setIsNavigating] = useState(false)
  const { account } = useAccount()
  const { disconnect } = useDisconnect()
  const wasConnectedRef = useRef(false)
  const hasRedirectedRef = useRef(false)
  const selectLvlSoundRef = useRef<HTMLAudioElement | null>(null)
  const { startBattle } = useGameActions();

  // Check progress for each level to determine unlocked level
  const playerAddress = account?.address ? String(account.address) : undefined
  const progress1 = useProgressData(playerAddress, 1)
  const progress2 = useProgressData(playerAddress, 2)
  const progress3 = useProgressData(playerAddress, 3)

  // Initialize level selection sound
  useEffect(() => {
    if (!selectLvlSoundRef.current) {
      selectLvlSoundRef.current = new Audio('/music/selectlvl.mp3')
      selectLvlSoundRef.current.volume = 0.7
    }
  }, [])

  // Calculate unlocked level based on completed levels
  useEffect(() => {
    // Esperar a que los datos de progreso se carguen (no loading)
    if (progress1.loading || progress2.loading || progress3.loading) {
      return
    }

    let maxUnlocked: LevelId = 1 // Siempre empezar con nivel 1 desbloqueado

    // Si el nivel 1 está completado, nivel 2 está desbloqueado
    if (progress1.progress?.completed) {
      maxUnlocked = 2
      
      // Si el nivel 2 también está completado, nivel 3 está desbloqueado
      if (progress2.progress?.completed) {
        maxUnlocked = 3
      }
    }

    setUnlocked(maxUnlocked)
  }, [playerAddress, progress1.progress?.completed, progress2.progress?.completed, progress3.progress?.completed, progress1.loading, progress2.loading, progress3.loading])

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
        hasRedirectedRef.current = true
        navigate('/')
      }
    }, 500) // Esperar 500ms para dar tiempo a que se sincronice el estado de conexión

    return () => clearTimeout(timer)
  }, [account, navigate])

  // Redirigir cuando se desconecta DESPUÉS de haber estado conectado
  useEffect(() => {
    if (!account && wasConnectedRef.current && !hasRedirectedRef.current) {
      wasConnectedRef.current = false
      hasRedirectedRef.current = true
      navigate('/')
    }

  }, [account, navigate])

  const handleSelect = async (level: LevelId) => {
    // Play level selection sound effect
    if (selectLvlSoundRef.current) {
      selectLvlSoundRef.current.currentTime = 0
      selectLvlSoundRef.current.play().catch(err => {
        console.log('Error playing level selection sound:', err)
      })
    }
    // Show loading
    setIsNavigating(true)
    let result = await startBattle(level);
    await new Promise(resolve => setTimeout(resolve, 1000));
    navigate(`/battle/${BigInt(result?.battle_id as string)}`)
  }

  const handleLogout = async () => {
    await disconnect()
  }

  return (
    <div className="levels-screen" aria-label="Levels">
      {/* Loading indicator during navigation */}
      {isNavigating && (
        <>
          {/* Dark overlay - 30% opacity */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              zIndex: 10000,
              pointerEvents: 'none'
            }}
          />
          {/* Loading gif */}
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 10001,
              pointerEvents: 'none'
            }}
          >
            <img
              src="/loading.gif"
              alt="Loading..."
              style={{
                width: '150px',
                height: '150px',
              }}
            />
          </div>
        </>
      )}
      
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

      <h1 className="levels-title">CHOOSE YOUR DESTINY</h1>

      <div className="levels-grid">
        {TOTAL_LEVELS.map((lv) => {
          const locked = lv > (unlocked ?? 1)
          // Card images: level 1 uses card1.jpeg, level 2 uses card2.png, level 3 uses card3.webp
          const cardImage = lv === 1
            ? `/backgrounds/card1.jpeg`
            : lv === 2
            ? `/backgrounds/card2.png`
            : `/backgrounds/card3.webp`
          return (
            <button
              key={lv}
              className={`level-card level-card-${lv} ${locked ? 'locked' : 'unlocked'}`}
              onClick={() => handleSelect(lv)}
              aria-label={`Level ${lv}${locked ? ' (locked)' : ''}`}
              disabled={locked || isNavigating}
              style={{ backgroundImage: `url(${cardImage})` }}
            >
              <div className={`level-difficulty level-difficulty-${LEVEL_DIFFICULTIES[lv].toLowerCase()}`}>
                {LEVEL_DIFFICULTIES[lv]}
              </div>
              {locked && <div className="level-lock" aria-hidden>🔒</div>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

