import { useState, useEffect, createContext, useContext, useRef } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { useAccount, useConnect } from '@starknet-react/core'
import './App.css'
import HomeScreen from './components/HomeScreen'
import BattleScreen from './components/BattleScreen'
import LevelsScreen from './components/LevelsScreen'

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

// vamos a usar este componente para la pantalla de inicio y conectar con la wallet
function Home() {
  const navigate = useNavigate()
  const { account } = useAccount()
  const { connect, connectors } = useConnect()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Redirigir automáticamente cuando se conecta la cuenta
  useEffect(() => {
    if (account) {
      setLoading(false)
      navigate('/levels')
    }
  }, [account, navigate])
  
  // Función para iniciar: conectar con ControllerConnector
  const iniciarJuego = async () => {
    if (!account) {
      // Buscar el ControllerConnector - generalmente es el único connector disponible
      const controllerConnector = connectors.find(
        (connector) => 
          connector.id === 'cartridge' || 
          connector.id === 'controller' ||
          connector.name?.toLowerCase().includes('controller') ||
          connector.name?.toLowerCase().includes('cartridge')
      ) || connectors[0] // Fallback al primer connector (debería ser ControllerConnector)
      
      if (controllerConnector) {
        try {
          setLoading(true)
          setError(null)
          // Conectar directamente con ControllerConnector
          await connect({ connector: controllerConnector })
        } catch (err) {
          console.error('Error connecting Controller:', err)
          setError('Error al conectar con Cartridge Controller')
          setLoading(false)
        }
      } else {
        setError('Controller no disponible')
      }
    }
  }

  return (
    <>
      {/* Mostrar errores */}
      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      <HomeScreen 
        iniciarJuego={iniciarJuego}
        loading={loading}
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
        </Routes>
      </div>
    </AudioProvider>
  )
}

export default App
