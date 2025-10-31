import React, { useState, useEffect } from 'react';
import RankingTable from './RankingTable';
import '../assets/panda-font.css';
import { dojoConfig } from '../dojo/dojoConfig';

interface PantallaFinProps {
  puntuacion: number;
  victoria: boolean;
  mensaje: string;
  iniciarJuego: () => void;
  volverInicio: () => void;
  loading?: boolean;
  tiempoJuego?: number; // Tiempo de finalización en segundos
}

// Función helper para formatear el tiempo
const formatearTiempo = (segundos: number): string => {
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const segs = segundos % 60;
  
  if (horas > 0) {
    return `${horas}h ${minutos}m ${segs}s`;
  } else if (minutos > 0) {
    return `${minutos}m ${segs}s`;
  } else {
    return `${segs}s`;
  }
};

const PantallaFin: React.FC<PantallaFinProps> = ({ 
  puntuacion, 
  victoria,
  mensaje,
  iniciarJuego, 
  volverInicio,
  loading = false,
  tiempoJuego
}) => {
  const [completionTime, setCompletionTime] = useState<number | null>(null);
  const [timeLoading, setTimeLoading] = useState(true);

  // Obtener el tiempo de finalización directamente desde el backend
  useEffect(() => {
    const fetchCompletionTime = async () => {
      if (!victoria) {
        setTimeLoading(false);
        return;
      }

      try {
        // Primero intentar obtener el gameId actual desde la URL
        const gameId = window.location.pathname.split('/').pop();
        
        const gameQuery = `
          query GetGameFinished($gameId: Int) {
            dojoSheepASheepGameFinishedModels(
              first: 10
              order: { field: "COMPLETION_TIME", direction: "ASC" }
              where: { game_id: $gameId }
            ) {
              edges {
                node {
                  player
                  game_id
                  completion_time
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
            variables: gameId ? { gameId: parseInt(gameId) } : {}
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Game finished query result:', result);
        
        if (result.data && result.data.dojoSheepASheepGameFinishedModels && result.data.dojoSheepASheepGameFinishedModels.edges.length > 0) {
          // Obtener el juego del gameId específico
          const gameData = result.data.dojoSheepASheepGameFinishedModels.edges[0].node;
          const time = Number(gameData.completion_time);
          console.log('Completion time found:', time);
          setCompletionTime(time);
        } else {
          console.log('No game finished data found, trying without gameId filter...');
          // Fallback: intentar sin filtro de gameId para obtener el más reciente
          const fallbackQuery = `
            query GetLatestGameFinished {
              dojoSheepASheepGameFinishedModels(
                first: 1
                order: { field: "COMPLETION_TIME", direction: "ASC" }
              ) {
                edges {
                  node {
                    player
                    game_id
                    completion_time
                  }
                }
              }
            }
          `;

          const fallbackResponse = await fetch(`${dojoConfig.toriiUrl}/graphql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: fallbackQuery,
            }),
          });

          if (fallbackResponse.ok) {
            const fallbackResult = await fallbackResponse.json();
            if (fallbackResult.data && fallbackResult.data.dojoSheepASheepGameFinishedModels && fallbackResult.data.dojoSheepASheepGameFinishedModels.edges.length > 0) {
              const latestGame = fallbackResult.data.dojoSheepASheepGameFinishedModels.edges[0].node;
              const time = Number(latestGame.completion_time);
              console.log('Fallback completion time found:', time);
              setCompletionTime(time);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching completion time:', error);
        // Si hay un tiempoJuego pasado como prop, usarlo como fallback
        if (tiempoJuego && tiempoJuego > 0) {
          setCompletionTime(tiempoJuego);
        }
      } finally {
        setTimeLoading(false);
      }
    };

    fetchCompletionTime();
  }, [victoria, tiempoJuego]);

  return (
    <div className={`pantalla-fin pantalla-juego-background ${victoria ? 'victoria' : 'derrota'}`}>
      <div className="result-header">
        {victoria ? (
          <>
            <h1 className="panda-title">
              <span className="panda-title-main" style={{ fontSize: '6rem' }}>🏆</span>
              <span className="panda-title-sub" style={{ fontSize: '4rem', marginTop: '-0.5em' }}>🎉 WINNER! 🎉</span>
            </h1>
            
            {/* Mostrar tiempo solo cuando el jugador gane */}
            <div className="tiempo-resultado">
              {timeLoading ? (
                <h3>⏳ Calculando tiempo...</h3>
              ) : completionTime && completionTime > 0 ? (
                <h3>⏱️ Tiempo completado: {formatearTiempo(completionTime)}</h3>
              ) : (
                <h3>⏱️ Tiempo no disponible</h3>
              )}
            </div>
          </>
        ) : (
          <div className="panda-title">
            <span className="panda-title-main">YOU</span>
            <span className="panda-title-sub">LOSE</span>
          </div>
        )}
      </div>

      {/* Mostrar el ranking solo cuando el jugador gane */}
      {victoria && (
        <div style={{ margin: '20px 0' }}>
          <RankingTable showTitle={true} maxHeight="300px" />
        </div>
      )}

      <div className="action-buttons">
        <button 
          onClick={volverInicio}
          className="start-button"
          disabled={loading}
          style={{ 
            backgroundColor: '#4CAF50', 
            marginTop: 0, 
            fontSize: '20px', 
            padding: '6px 12px',
            minHeight: 'auto'
          }}
        >
          🏠 Home
        </button>
      </div>
    </div>
  );
};

export default PantallaFin; 