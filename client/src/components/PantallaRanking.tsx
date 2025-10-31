import React from 'react';
import RankingTable from './RankingTable';
import '../assets/panda-font.css';

interface PantallaRankingProps {
  volverInicio: () => void;
}

const PantallaRanking: React.FC<PantallaRankingProps> = ({ volverInicio }) => {
  return (
    <div className="pantalla-inicio pantalla-inicio-background">
      <div style={{
        textAlign: 'center',
        marginBottom: '30px'
      }}>
        <h1 className="panda-title">
          <span className="panda-title-main" style={{ fontSize: '6rem' }}>🏆</span>
          <span className="panda-title-sub" style={{ fontSize: '4rem', marginTop: '-0.5em' }}>RANKING</span>
        </h1>
        {/* <p style={{
          fontSize: '1.2rem',
          color: '#477f17',
          fontWeight: '600',
          margin: '0',
          textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
          fontFamily: 'Panda, cursive, sans-serif'
        }}>Los mejores tiempos de todos los jugadores</p> */}
      </div>
      
      <RankingTable showTitle={false} />
      
      <div className="ranking-buttons" style={{
        display: 'flex',
        justifyContent: 'center',
        marginTop: '30px'
      }}>
        <button 
          onClick={volverInicio} 
          className="start-button"
          style={{
            backgroundColor: '#4CAF50',
            fontSize: '16px',
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: '3px solid #f6efd7',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            color: 'white',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            minHeight: 'auto',
            marginTop: 0
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
          }}
        >
          🏠 <span>Home</span>
        </button>
      </div>
    </div>
  );
};

export default PantallaRanking; 