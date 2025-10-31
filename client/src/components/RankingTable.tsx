import React, { useState, useEffect } from 'react';
import { dojoConfig } from '../dojo/dojoConfig';
import { lookupAddresses } from '@cartridge/controller';

interface GameFinishedData {
  player: string;
  game_id: number;
  completion_time: number;
}

interface RankingTableProps {
  showTitle?: boolean;
  maxHeight?: string;
}

const RankingTable: React.FC<RankingTableProps> = ({ 
  showTitle = true, 
  maxHeight = '400px' 
}) => {
  const [rankingData, setRankingData] = useState<GameFinishedData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addressNames, setAddressNames] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    loadRankingData();
  }, []);

  useEffect(() => {
    if (rankingData.length > 0) {
      resolveAddressNames();
    }
  }, [rankingData]);

  const resolveAddressNames = async () => {
    try {
      const addresses = rankingData.map(game => game.player);
      const addressMap = await lookupAddresses(addresses);
      setAddressNames(addressMap);
    } catch (error) {
      console.error('Error resolving address names:', error);
      // Si falla la resolución, seguimos con las direcciones truncadas
    }
  };

  const loadRankingData = async () => {
    setLoading(true);
    setError(null);

    try {
      const rankingQuery = `
        query GetRanking {
          dojoSheepASheepGameFinishedModels(
            first: 10000
            order: { field: "COMPLETION_TIME", direction: "DESC" }
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

      console.log("Querying ranking data from Torii GraphQL at:", `${dojoConfig.toriiUrl}/graphql`);
      
      const response = await fetch(`${dojoConfig.toriiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: rankingQuery,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Ranking GraphQL response:", result);

      if (result.data && result.data.dojoSheepASheepGameFinishedModels && result.data.dojoSheepASheepGameFinishedModels.edges) {
        const rankings = result.data.dojoSheepASheepGameFinishedModels.edges
          .map((edge: any) => ({
            player: edge.node.player,
            game_id: Number(edge.node.game_id),
            completion_time: Number(edge.node.completion_time),
          }))
          .sort((a: GameFinishedData, b: GameFinishedData) => a.completion_time - b.completion_time)
          .slice(0, 5);

        setRankingData(rankings);
      } else if (result.errors) {
        console.error("GraphQL ranking errors:", result.errors);
        throw new Error(`GraphQL error: ${result.errors[0]?.message || 'Unknown error'}`);
      } else {
        console.log("No ranking data found");
        setRankingData([]);
      }
    } catch (err) {
      console.error("Error loading ranking data:", err);
      setError(err instanceof Error ? err.message : "Error loading ranking data");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatPlayerName = (address: string) => {
    const username = addressNames.get(address);
    if (username) {
      return username;
    }
    // Fallback a dirección truncada si no se encuentra el nombre
    return formatAddress(address);
  };

  const formatAddress = (address: string) => {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="ranking-container" style={{
      backgroundColor: '#4CAF50',
      border: '3px solid #f6efd7',
      borderRadius: '12px',
      padding: '25px',
      margin: '20px',
      maxWidth: '600px',
      marginLeft: 'auto',
      marginRight: 'auto',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      color: 'white'
    }}>
      {showTitle && <h2 style={{ 
        textAlign: 'center', 
        marginBottom: '25px',
        color: 'white',
        fontSize: '2rem',
        fontWeight: 'bold',
        textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
      }}>🏆 RANKING</h2>}
      
      {loading ? (
        <div className="loading-message" style={{
          textAlign: 'center',
          padding: '30px',
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '10px',
          color: '#4CAF50',
          fontWeight: 'bold',
          border: '2px solid #f6efd7'
        }}>
          <p>⏳ Cargando ranking...</p>
        </div>
      ) : error ? (
        <div className="error-message" style={{
          textAlign: 'center',
          padding: '30px',
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '10px',
          color: '#d32f2f',
          fontWeight: 'bold',
          border: '2px solid #f6efd7'
        }}>
          <p>❌ Error: {error}</p>
          <button onClick={loadRankingData} className="retry-button" style={{
            marginTop: '15px',
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: '2px solid #f6efd7',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}>
            🔄 Reintentar
          </button>
        </div>
      ) : rankingData.length === 0 ? (
        <div className="no-data-message" style={{
          textAlign: 'center',
          padding: '30px',
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '10px',
          color: '#4CAF50',
          fontWeight: 'bold',
          border: '2px solid #f6efd7'
        }}>
          <p>📊  There are no completed games yet</p>
          <p>Be the first to complete a game!</p>
        </div>
      ) : (
        <div className="ranking-table">
          <table style={{ 
            width: '100%', 
            borderCollapse: 'separate',
            borderSpacing: '0 5px'
          }}>
            <tbody>
              {rankingData.map((game, index) => (
                <tr 
                  key={`${game.player}-${game.game_id}`}
                  style={{ 
                    background: index < 3 ? 
                      (index === 0 ? 'rgba(255, 215, 0, 0.9)' : 
                       index === 1 ? 'rgba(192, 192, 192, 0.9)' : 
                       'rgba(205, 127, 50, 0.9)') : 
                      'rgba(255, 255, 255, 0.9)',
                    borderRadius: '8px',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    border: '2px solid #f6efd7'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <td style={{ 
                    padding: '12px 10px', 
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    borderRadius: '8px 0 0 8px',
                    color: '#2e7d32'
                  }}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}°`}
                  </td>
                  <td style={{ 
                    padding: '12px 10px', 
                    fontFamily: 'monospace',
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    color: '#2e7d32'
                  }}>
                    {formatPlayerName(game.player)}
                  </td>
                  <td style={{ 
                    padding: '12px 10px', 
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    color: '#2e7d32',
                    borderRadius: '0 8px 8px 0'
                  }}>
                    {formatTime(game.completion_time)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RankingTable; 