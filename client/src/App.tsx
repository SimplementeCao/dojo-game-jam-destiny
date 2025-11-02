import { useState, useEffect, createContext, useContext, useRef } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useAccount, useConnect } from '@starknet-react/core'
import './App.css'
import HomeScreen from './components/HomeScreen'
import BattleScreen from './components/BattleScreen'
import LevelsScreen from './components/LevelsScreen'
import ContractsScreen from './components/ContractsScreen'
import { useGameActions } from './hooks/useGameActions'

// Contexto de Audio
interface AudioContextType {
  isMusicEnabled: boolean;
  isSoundEnabled: boolean;
  toggleMusic: () => void;
  toggleSound: () => void;
  playEffect: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

// Hook para usar el contexto de audio
export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio debe ser usado dentro de AudioProvider');
  }
  return context;
};

// Provider de Audio
const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMusicEnabled, setIsMusicEnabled] = useState(true);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const effectSoundRef = useRef<HTMLAudioElement | null>(null);

  // Función para inicializar el audio después de la primera interacción
  const initializeAudio = async () => {
    if (isAudioInitialized) return;

    try {
      // Crear elementos de audio si no existen
      // if (!backgroundMusicRef.current) {
      //   backgroundMusicRef.current = new Audio('/music/fondo.mp3');
      //   backgroundMusicRef.current.loop = true;
      //   backgroundMusicRef.current.volume = 0.3;
      // }

      // if (!effectSoundRef.current) {
      //   effectSoundRef.current = new Audio('/music/efecto.mp3');
      //   effectSoundRef.current.volume = 0.7;
      // }

      // // Intentar reproducir la música si está habilitada
      // if (isMusicEnabled && backgroundMusicRef.current) {
      //   await backgroundMusicRef.current.play();
      //   console.log('🎵 Música de fondo iniciada correctamente');
      // }

      // setIsAudioInitialized(true);
    } catch (error) {
      console.log('⚠️ Error al inicializar audio:', error);
    }
  };

  // Inicializar el audio cuando se monta el componente
  useEffect(() => {
    // Agregar listeners para detectar la primera interacción del usuario
    const handleFirstInteraction = () => {
      initializeAudio();
      // Remover los listeners después de la primera interacción
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);

    // Cleanup al desmontar
    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
      
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause();
        backgroundMusicRef.current = null;
      }
      if (effectSoundRef.current) {
        effectSoundRef.current = null;
      }
    };
  }, []);

  // Controlar la música de fondo cuando cambia el estado
  useEffect(() => {
    if (backgroundMusicRef.current && isAudioInitialized) {
      if (isMusicEnabled) {
        backgroundMusicRef.current.play().catch(err => {
          console.log('Error reproduciendo música:', err);
        });
      } else {
        backgroundMusicRef.current.pause();
      }
    }
  }, [isMusicEnabled, isAudioInitialized]);

  const toggleMusic = () => {
    setIsMusicEnabled(prev => !prev);
  };

  const toggleSound = () => {
    setIsSoundEnabled(prev => !prev);
  };

  const playEffect = () => {
    if (isSoundEnabled && effectSoundRef.current) {
      effectSoundRef.current.currentTime = 0; // Reiniciar el sonido
      effectSoundRef.current.play().catch(err => {
        console.log('Error reproduciendo efecto:', err);
      });
    }
  };

  return (
    <AudioContext.Provider value={{
      isMusicEnabled,
      isSoundEnabled,
      toggleMusic,
      toggleSound,
      playEffect
    }}>
      {children}
    </AudioContext.Provider>
  );
};

// Componente para la pantalla de inicio - conecta wallet y navega a levels
function Home() {
  const navigate = useNavigate()
  const { account, address, status } = useAccount()
  const { connect, connectors } = useConnect()
  const { startBattle, loading: actionLoading, error: actionError } = useGameActions()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const conectSoundRef = useRef<HTMLAudioElement | null>(null)
 
  // Estado de conexión de wallet
  const isConnected = !!account && status === 'connected'
  
  // Initialize connection sound
  useEffect(() => {
    if (!conectSoundRef.current) {
      conectSoundRef.current = new Audio('/music/conect.mp3')
      conectSoundRef.current.volume = 0.7
    }
  }, [])

  // Debug: Log del estado de la wallet
  useEffect(() => {
  }, [account, address, status, isConnected, connectors.length])

  // Log y redirección cuando la wallet se conecta
  useEffect(() => {
    if (isConnected && account && address) {
      // Play connection sound effect
      if (conectSoundRef.current) {
        conectSoundRef.current.currentTime = 0
        conectSoundRef.current.play().catch(err => {
          console.log('Error playing connection sound:', err)
        })
      }
      // Show loading and navigate
      setIsNavigating(true)
      setTimeout(() => {
        navigate('/levels')
      }, 500)
    }
  }, [isConnected, account, address, status, navigate])

  // Combinar errores de acciones y locales
  const displayError = error || actionError

  const startBattleCall = async () => {
    if (!isConnected) {
      if (connectors.length > 0) {
        try {
          setLoading(true)
          setError(null)
          console.log('Usando connector:', connectors[0].id || connectors[0].name)
          await connect({ connector: connectors[0] })
          console.log('✅ Wallet conectada exitosamente')
        } catch (err) {
          console.error('❌ Error connecting wallet:', err)
          setError('Error al conectar la wallet')
        } finally {
          setLoading(false)
        }
      } else {
        console.error('❌ No hay connectors disponibles')
        setError('No hay wallets disponibles. Por favor instala una wallet.')
      }
      return
    }

    // Si ya está conectado, iniciar nuevo juego
    console.log('🎲 Iniciando nuevo juego...')
    setLoading(true)
    setError(null)
    
    try {
      const result = await startBattle(1)
      console.log('✅ Resultado del juego:', result)
      
      if (result) {
        console.log('🚀 Navegando a:', `/battle/${result.battle_id}`)
        navigate(`/battle/${result.battle_id}`)
      } else {
        throw new Error('No se pudo crear el juego')
      }
      
    } catch (err) {
      console.error('❌ Error starting game:', err)
      setError(err instanceof Error ? err.message : 'Error al iniciar el juego')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
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

      {/* Mostrar errores */}
      {displayError && (
        <div className="error-message">
          {displayError}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      
      <HomeScreen 
        iniciarJuego={startBattleCall}
        loading={loading || actionLoading}
        connected={isConnected}
      />
    </>
  )
}

// Componente para manejar música global según la ruta
function MusicManager() {
  const location = useLocation()
  const homeMusicRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Crear audio una sola vez
    if (!homeMusicRef.current) {
      homeMusicRef.current = new Audio('/music/homeMusic.mp3')
      homeMusicRef.current.loop = true
      homeMusicRef.current.volume = 0.5
    }

    const isBattleRoute = location.pathname.startsWith('/battle')
    
    if (isBattleRoute) {
      // Pausar música de home cuando estamos en battle
      if (homeMusicRef.current && !homeMusicRef.current.paused) {
        homeMusicRef.current.pause()
      }
    } else {
      // Reproducir música de home en Home y Levels
      const playMusic = async () => {
        try {
          if (homeMusicRef.current && homeMusicRef.current.paused) {
            await homeMusicRef.current.play()
          }
        } catch (error) {
          console.log('Error playing home music:', error)
        }
      }
      playMusic()
    }
  }, [location.pathname])

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (homeMusicRef.current) {
        homeMusicRef.current.pause()
        homeMusicRef.current.currentTime = 0
      }
    }
  }, [])

  return null
}

// Componente principal App con Router
function App() {
  return (
    <AudioProvider>
      <MusicManager />
      <div className="app-container">
        {/* Rutas */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/battle/:battleId" element={<BattleScreen />} />
          <Route path="/levels" element={<LevelsScreen />} />
          <Route path="/contracts" element={<ContractsScreen />} />
        </Routes>
      </div>
    </AudioProvider>
  )
}

export default App