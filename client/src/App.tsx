import { useState, useEffect, createContext, useContext, useRef } from 'react'
import { Routes, Route, useNavigate, useParams } from 'react-router-dom'
import { useAccount, useConnect, useDisconnect } from '@starknet-react/core'
import './App.css'
import PantallaInicio from './components/PantallaInicio'
import PantallaJuego from './components/PantallaJuego'
import PantallaFin from './components/PantallaFin'
import PantallaRanking from './components/PantallaRanking'
import { useGameActions } from './hooks/useGameActions'
import { useGameData, useBoardData } from './hooks/useGameData'
import { useGameLogic } from './hooks/useGameLogic'
import { dojoConfig } from './dojo/dojoConfig'

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
      {/* Indicador de música no inicializada */}
      {/* {!isAudioInitialized && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          zIndex: 1000,
          animation: 'pulse 2s infinite'
        }}>
          🎵 Haz clic para activar música
        </div>
      )} */}
      {children}
    </AudioContext.Provider>
  );
};

// Mapeo de TileType a emojis para la UI
const TILE_TYPE_TO_EMOJI: Record<any, string> = {
  'Empty': '',
  'Sheep': '🐑',
  'Wolf': '🐺',  
  'Grass': '🌱',
  'Flower': '🌸',
  'Carrot': '🥕',
  'Bone': '🦴',
  'Corn': '🌽',
  'Tool': '🔧',
  'Bucket': '🪣',
  'Wood': '🪵',
  'Glove': '🧤',
  'Cabbage': '🥬',
  'Apple': '🍎',
  'Strawberry': '🍓',
  'Pumpkin': '🎃',
  'Cherry': '🍒',
  // También mapeo de números
  0: '',
  1: '🐑',
  2: '🐺',
  3: '🌱',
  4: '🌸',
  5: '🥕',
  6: '🦴',
  7: '🌽',
  8: '🔧',
  9: '🪣',
  10: '🪵',
  11: '🧤',
  12: '🥬',
  13: '🍎',
  14: '🍓',
  15: '🎃',
  16: '🍒',
};

// Componente Home
function Home() {
  const navigate = useNavigate()
  const { account } = useAccount()
  const { connect, connectors } = useConnect()
  const { startNewGame, loading: actionLoading, error: actionError } = useGameActions()
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Para mostrar estadísticas necesitamos un game ID, por ahora usaremos undefined
  const [showRanking, setShowRanking] = useState(false)
  const { stats } = useGameData(undefined)

  // Función para iniciar un nuevo juego o conectar wallet
  const iniciarJuego = async () => {
    if (!account) {
      // Si no hay cuenta conectada, conectar primero
      if (connectors.length > 0) {
        try {
          setLoading(true)
          setError(null)
          await connect({ connector: connectors[0] })
        } catch (err) {
          console.error('Error connecting wallet:', err)
          setError('Error al conectar la wallet')
        } finally {
          setLoading(false)
        }
      }
      return
    }

    // Si ya está conectado, iniciar nuevo juego
    setLoading(true)
    setError(null)
    
    try {
      console.log('Iniciando nuevo juego...')
      const result = await startNewGame()
      console.log('Resultado del juego:', result)
      
      if (result) {
        console.log('Navegando a:', `/demo/${result.game_id}`)
        navigate(`/demo/${result.game_id}`)
      } else {
        throw new Error('No se pudo crear el juego')
      }
      
    } catch (err) {
      console.error('Error starting game:', err)
      setError(err instanceof Error ? err.message : 'Error al iniciar el juego')
    } finally {
      setLoading(false)
    }
  }

  // Función para mostrar ranking
  const verRanking = () => {
    setShowRanking(true)
  }

  // Función para volver al inicio desde ranking
  const volverInicio = () => {
    setShowRanking(false)
  }

  // Combinar errores de acciones y locales
  const displayError = error || actionError

  return (
    <>
      {/* Mostrar errores */}
      {displayError && (
        <div className="error-message">
          {displayError}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {showRanking ? (
        <PantallaRanking volverInicio={volverInicio} />
      ) : (
        <PantallaInicio 
          iniciarJuego={iniciarJuego} 
          loading={loading || actionLoading}
          connected={!!account}
          stats={stats}
          verRanking={verRanking}
        />
      )}
    </>
  )
}

// Componente Game
function Game() {
  const navigate = useNavigate()
  const { gameId } = useParams<{ gameId: string }>()
  const { account } = useAccount()
  const { selectTile, startNewGame, loading: actionLoading, error: actionError } = useGameActions()
  const { isMusicEnabled, isSoundEnabled, toggleMusic, toggleSound, playEffect } = useAudio()
  
  const [error, setError] = useState<string | null>(null)
  const [showEndScreen, setShowEndScreen] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  
  const currentGameId = gameId ? parseInt(gameId) : undefined
  
  console.log('Game component - gameId:', gameId, 'currentGameId:', currentGameId, 'account:', !!account)
  
  // Hook para obtener datos del juego (sin carga automática)
  const { game, inventory, stats, powerUps, refetch } = useGameData(currentGameId)
  
  // Hook para obtener datos del tablero (sin carga automática)
  const { tiles, loading: boardLoading, error: boardError, refetch: refetchBoard } = useBoardData(currentGameId)

  // Hook para lógica local del juego
  const {
    localTiles,
    localSlotTemporal,
    localScore,
    dataInitialized,
    initializeGameData,
    selectTileLocal,
    resetLocalState,
    isGameWon,
    isGameLost,
  } = useGameLogic()

  // Estado para el tiempo final del juego
  const [finalGameTime, setFinalGameTime] = useState<number | undefined>(undefined)

  // Función para hacer polling hasta obtener el end_time
  const pollForEndTime = async (maxAttempts = 10, intervalMs = 2000) => {
    console.log('Starting polling for end_time...')
    let attempts = 0
    
    const poll = async (): Promise<number | undefined> => {
      attempts++
      console.log(`Polling attempt ${attempts}/${maxAttempts}`)
      
      try {
        // Recargar datos del backend y obtener datos frescos
        await refetch()
        
        // Hacer una query fresca directamente para obtener los datos más recientes
        const freshGameData = await getFreshGameData(currentGameId, account?.address)
        
        // Debug detallado
        console.log('=== POLLING DEBUG ===')
        console.log('Fresh game data:', freshGameData)
        console.log('Fresh game exists:', !!freshGameData)
        console.log('Fresh game.end_time raw:', freshGameData?.end_time)
        console.log('typeof fresh game.end_time:', typeof freshGameData?.end_time)
        console.log('Number(fresh game.end_time):', freshGameData?.end_time ? Number(freshGameData.end_time) : 'N/A')
        console.log('Fresh game.end_time > 0:', freshGameData?.end_time && Number(freshGameData.end_time) > 0)
        console.log('===================')
        
        // Verificar si tenemos el end_time en los datos frescos
        if (freshGameData?.end_time && Number(freshGameData.end_time) > 0) {
          const endTime = Number(freshGameData.end_time)
          console.log('✅ Got end_time from fresh data:', endTime)
          setFinalGameTime(endTime)
          return endTime
        }
        
        if (attempts >= maxAttempts) {
          console.log('❌ Max polling attempts reached, giving up')
          return undefined
        }
        
        // Esperar antes del siguiente intento
        console.log(`⏳ No end_time yet, waiting ${intervalMs}ms...`)
        await new Promise(resolve => setTimeout(resolve, intervalMs))
        return poll() // Intentar de nuevo
        
      } catch (error) {
        console.error('❌ Error during polling:', error)
        if (attempts >= maxAttempts) {
          return undefined
        }
        await new Promise(resolve => setTimeout(resolve, intervalMs))
        return poll()
      }
    }
    
    return poll()
  }

  // Función auxiliar para obtener datos frescos del juego
  const getFreshGameData = async (gameId?: number, playerAddress?: string) => {
    if (!gameId || !playerAddress) return null
    
    try {
      const gameQuery = `
        query GetGame($gameId: Int!, $player: String!) {
          dojoSheepASheepGameModels(where: { game_id: $gameId, player: $player }) {
            edges {
              node {
                game_id
                player
                state
                score
                moves_used
                start_time
                end_time
                board_width
                board_height
                max_layers
                total_tiles
                remaining_tiles
              }
            }
          }
        }
      `;

      const response = await fetch(`${dojoConfig.toriiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: gameQuery,
          variables: { gameId, player: playerAddress }
        }),
      });

      if (!response.ok) return null

      const result = await response.json()
      
      if (result.data && result.data.dojoSheepASheepGameModels && result.data.dojoSheepASheepGameModels.edges.length > 0) {
        const gameNode = result.data.dojoSheepASheepGameModels.edges[0].node
        
        return {
          game_id: Number(gameNode.game_id),
          player: gameNode.player,
          state: gameNode.state,
          score: Number(gameNode.score),
          moves_used: Number(gameNode.moves_used),
          start_time: Number(gameNode.start_time),
          end_time: Number(gameNode.end_time),
          board_width: Number(gameNode.board_width),
          board_height: Number(gameNode.board_height),
          max_layers: Number(gameNode.max_layers),
          total_tiles: Number(gameNode.total_tiles),
          remaining_tiles: Number(gameNode.remaining_tiles),
        }
      }
      
      return null
    } catch (error) {
      console.error('Error fetching fresh game data:', error)
      return null
    }
  }

  // Cargar datos iniciales solo al montar el componente o cuando se hace F5
  useEffect(() => {
    const loadInitialData = async () => {
      if (currentGameId && account && !dataLoaded) {
        console.log('Loading initial game data...')
        try {
          // Cargar datos del backend
          await Promise.all([refetch(), refetchBoard()])
          setDataLoaded(true)
        } catch (err) {
          console.error('Error loading initial data:', err)
          setError('Error al cargar datos del juego')
        }
      }
    }

    loadInitialData()
  }, [currentGameId, account]) // Solo se ejecuta cuando cambia el gameId o la cuenta

  // Detectar F5 y recargar datos frescos del backend
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F5' || (event.ctrlKey && event.key === 'r') || (event.metaKey && event.key === 'r')) {
        console.log('F5 detected - reloading fresh data from backend')
        // Resetear estado local y recargar
        resetLocalState()
        setDataLoaded(false)
        setFinalGameTime(undefined) // Resetear tiempo final
        setShowEndScreen(false) // Resetear pantalla de fin
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [resetLocalState])

  // Inicializar datos locales cuando lleguen del backend
  useEffect(() => {
    if (tiles.length > 0 && inventory && !dataInitialized) {
      console.log('Initializing local game data with backend data')
      const inventoryNumbers = inventory.slots?.map(slot => typeof slot === 'number' ? slot : parseInt(slot.toString())) || []
      initializeGameData(tiles, inventoryNumbers, (game?.score as any) || 0)
    }
  }, [tiles, inventory, game, dataInitialized, initializeGameData])

  // Función para manejar la selección de fichas
  const clickFicha = async (position: { x: number; y: number }, layer: number) => {
    if (!account || !currentGameId || !dataInitialized) return

    console.log("=== CLICK FICHA (LOCAL) ===");
    console.log("Before selection - local tiles count:", localTiles.length);
    console.log("Current slot temporal:", localSlotTemporal);
    
    // Procesar selección localmente (inmediato)
    const success = selectTileLocal(position, layer)
    
    if (success) {
      // Reproducir efecto de sonido
      playEffect()
      
      // Ejecutar transacción en segundo plano
      selectTile(currentGameId, position, layer)
      
      console.log("Tile selection processed locally");
    } else {
      console.warn("Local tile selection failed");
    }
    
    console.log("=== END CLICK FICHA (LOCAL) ===");
  }

  // Verificar condiciones de fin de juego
  useEffect(() => {
    if (dataInitialized) {
      if (isGameWon()) {
        console.log('Game won!')
        setShowEndScreen(true)
        // Iniciar polling para obtener el end_time
        pollForEndTime()
      } else if (isGameLost()) {
        console.log('Game lost!')
        setShowEndScreen(true)
      }
    }
  }, [localTiles, localSlotTemporal, dataInitialized, isGameWon, isGameLost])

  // Función para iniciar nuevo juego desde el popup de configuración
  const iniciarNuevoJuego = async () => {
    try {
      setError(null)
      console.log('Iniciando nuevo juego desde configuración...')
      const result = await startNewGame()
      console.log('Resultado del nuevo juego:', result)
      
      if (result) {
        console.log('Navegando a:', `/demo/${result.game_id}`)
        // Limpiar estado local antes de navegar
        resetLocalState()
        setFinalGameTime(undefined) // Resetear tiempo final
        navigate(`/demo/${result.game_id}`)
      } else {
        throw new Error('No se pudo crear el juego')
      }
    } catch (err) {
      console.error('Error starting new game:', err)
      setError(err instanceof Error ? err.message : 'Error al iniciar nuevo juego')
    }
  }

  // Función para volver al inicio
  const volverInicio = () => {
    navigate('/')
    setError(null)
    setFinalGameTime(undefined) // Resetear tiempo final
  }

  // Función para iniciar nuevo juego (redirige a home)
  const iniciarJuego = () => {
    navigate('/')
    setFinalGameTime(undefined) // Resetear tiempo final
  }

  // Convertir los datos locales a formato esperado por el componente
  console.log("=== DEBUGGING LOCAL SLOT TEMPORAL ===");
  console.log("Local slot temporal:", localSlotTemporal);
  
  const slotTemporal = localSlotTemporal.map((tileType, index) => {
    console.log(`Processing local slot ${index}: tileType = ${tileType}, type = ${typeof tileType}`);
    const emoji = TILE_TYPE_TO_EMOJI[tileType as any];
    console.log(`Mapped to emoji: ${emoji}`);
    return emoji || '❓';
  });
  
  console.log("Final local slotTemporal:", slotTemporal);
  console.log("================================");

  // Efecto para manejar cambios en la conexión (con delay para evitar redirección prematura)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!account) {
        console.log('No hay cuenta después del timeout, redirigiendo a home')
        navigate('/')
      }
    }, 2000) // Esperar 2 segundos para que la cuenta se cargue

    return () => clearTimeout(timer)
  }, [account, navigate])

  // Combinar errores de acciones y locales
  const displayError = error || actionError || boardError

  // Si no hay gameId válido, redirigir al inicio
  if (!currentGameId) {
    console.log('No hay gameId válido, redirigiendo al inicio')
    navigate('/')
    return null
  }

  // Si no hay cuenta pero tenemos gameId, mostrar mensaje de carga
  if (!account) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Cargando cuenta...</h2>
        <p>Conectando con la wallet...</p>
      </div>
    )
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

      {/* Mostrar pantalla de fin si el juego terminó */}
      {showEndScreen ? (
        <PantallaFin 
          puntuacion={localScore}
          victoria={isGameWon()}
          mensaje={isGameWon() ? '¡Has ganado!' : 'Has perdido'}
          iniciarJuego={iniciarJuego}
          volverInicio={volverInicio}
          loading={actionLoading}
          tiempoJuego={finalGameTime}
        />
      ) : (
        <PantallaJuego 
          puntuacion={localScore}
          fichas={localTiles} // Usar datos locales en lugar de backend
          slotTemporal={slotTemporal}
          clickFicha={clickFicha}
          loading={false} // No mostrar loading durante la selección de tiles
          gameState={game?.state as any}
          powerUps={powerUps}
          remainingTiles={localTiles.length}
          onGoHome={volverInicio}
          onNewGame={iniciarNuevoJuego}
          isMusicEnabled={isMusicEnabled}
          isSoundEnabled={isSoundEnabled}
          onToggleMusic={toggleMusic}
          onToggleSound={toggleSound}
        />
      )}
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
          <Route path="/demo/:gameId" element={<Game />} />
        </Routes>
      </div>
    </AudioProvider>
  )
}

export default App
