import { useState, useEffect, createContext, useContext, useRef } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
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
      if (!backgroundMusicRef.current) {
        backgroundMusicRef.current = new Audio('/music/fondo.mp3');
        backgroundMusicRef.current.loop = true;
        backgroundMusicRef.current.volume = 0.3;
      }

      if (!effectSoundRef.current) {
        effectSoundRef.current = new Audio('/music/efecto.mp3');
        effectSoundRef.current.volume = 0.7;
      }

      // Intentar reproducir la música si está habilitada
      if (isMusicEnabled && backgroundMusicRef.current) {
        await backgroundMusicRef.current.play();
        console.log('🎵 Música de fondo iniciada correctamente');
      }

      setIsAudioInitialized(true);
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
 
  // Estado de conexión de wallet
  const isConnected = !!account && status === 'connected'
  
  // Debug: Log del estado de la wallet
  useEffect(() => {
    console.log('🔍 Wallet Status Check:', {
      account: !!account,
      address: address,
      status: status,
      isConnected: isConnected,
      connectorsAvailable: connectors.length
    })
  }, [account, address, status, isConnected, connectors.length])

  // Log y redirección cuando la wallet se conecta
  useEffect(() => {
    if (isConnected && account && address) {
      console.log('🎉 ============================================')
      console.log('🎉 WALLET CONECTADA EXITOSAMENTE')
      console.log('🎉 ============================================')
      console.log('📍 Address:', address)
      console.log('👤 Account:', account)
      console.log('📊 Status:', status)
      console.log('✅ Estado de conexión: CONECTADA')
      console.log('🚀 Navegando a /levels para jugar...')
      console.log('🎉 ============================================')
      
      // Redirigir automáticamente a levels para jugar
      navigate('/levels')
    }
  }, [isConnected, account, address, status, navigate])

  // Combinar errores de acciones y locales
  const displayError = error || actionError

  // Función para iniciar un nuevo juego o conectar wallet
  const startBattleCall = async () => {
    console.log('🎮 startBattle() llamado', { isConnected, account: !!account, status })
    
    if (!isConnected) {
      // Si no hay cuenta conectada, conectar primero
      console.log('🔌 Conectando wallet...')
      if (connectors.length > 0) {
        try {
          setLoading(true)
          setError(null)
          console.log('Usando connector:', connectors[0].id || connectors[0].name)
          await connect({ connector: connectors[0] })
          console.log('✅ Wallet conectada exitosamente')
          // La wallet se conectó, pero no navegamos automáticamente
          // El usuario debe hacer clic de nuevo para iniciar el juego
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
      {/* Mostrar errores */}
      {displayError && (
        <div className="error-message">
          {displayError}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      
      {/* Debug: Mostrar estado de wallet en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px',
          zIndex: 9999
        }}>
          <div>Wallet: {isConnected ? '✅ Connected' : '❌ Not Connected'}</div>
          <div>Status: {status}</div>
          {isConnected && connectors.length > 0 && (
            <div>Wallet Name: {connectors[0].name || connectors[0].id || 'Unknown'}</div>
          )}
          {address && !isConnected && (
            <div>Address: {address.slice(0, 6)}...{address.slice(-4)}</div>
          )}
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

// Componente principal App con Router
function App() {
  return (
    <AudioProvider>
      <div className="app-container">
        {/* Rutas */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/scene/:level" element={<BattleScreen />} />
          <Route path="/levels" element={<LevelsScreen />} />
          <Route path="/contracts" element={<ContractsScreen />} />
        </Routes>
      </div>
    </AudioProvider>
  )
}

export default App