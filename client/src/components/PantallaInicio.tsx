import React from 'react';
import '../assets/panda-font.css';
import playImg from '../../public/buttons/play.png';

interface PantallaInicioProps {
  iniciarJuego: () => void;
  loading?: boolean;
  connected?: boolean;
  stats?: any | null; // Using any since PlayerStats doesn't exist
  verRanking?: () => void;
}

const PantallaInicio: React.FC<PantallaInicioProps> = ({ 
  iniciarJuego, 
  loading = false, 
  connected = false,
  stats,
  verRanking
}) => {
  return (
    <div className="pantalla-inicio pantalla-inicio-background">
      
      <h1 className="panda-title">
        <span className="panda-title-main">PANDA</span>
        <span className="panda-title-sub">PANDA</span>
      </h1>
      
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '15px',
        marginTop: '20px'
      }}>
        <button 
          onClick={iniciarJuego} 
          disabled={loading}
          className={`start-button ${loading ? 'loading' : ''}`}
          style={{
            background: (connected && !loading) ? 'none' : '#4CAF50', 
            border: (connected && !loading) ? 'none' : '3px solid #f6efd7', 
            padding: (connected && !loading) ? 0 : '6px 12px', 
            cursor: loading ? 'default' : 'pointer', 
            marginTop: 0,
            fontSize: (connected && !loading) ? 'inherit' : loading ? '18px' : '24px',
            minHeight: 'auto',
            color: (connected && !loading) ? 'inherit' : 'white'
          }}
        >
          {loading ? '⏳ Loading...' : 
            connected ? (
              <img src={playImg} alt="Iniciar Juego" style={{height: '120px', width: 'auto', display: 'block', margin: '0 auto'}} />
            ) : '🔑 Login'}
        </button>

        {connected && verRanking && !loading && (
          <button 
            onClick={verRanking} 
            className="start-button"
            style={{ 
              backgroundColor: '#4CAF50', 
              marginTop: 0, 
              fontSize: '14px', 
              padding: '6px 12px',
              minHeight: 'auto'
            }}
          >
            🏆 Ranking
          </button>
        )}
      </div>
    </div>
  );
};

export default PantallaInicio;