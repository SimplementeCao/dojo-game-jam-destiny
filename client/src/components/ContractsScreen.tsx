import React from 'react';
import '../assets/font.css';
import { useGameActions } from '../hooks/useGameActions';

const ContractsScreen: React.FC = () => {
  const { startBattle, play, loading, error, clearError } = useGameActions();

  return (
    <div className="pantalla-inicio pantalla-inicio-background">
      
      <h1 className="title-banner">
        <span className="titulo-text">DESTINY</span>
      </h1>
      
      {/* Mostrar errores si existen */}
      {error && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255, 0, 0, 0.8)',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '5px',
          zIndex: 9999
        }}>
          {error}
          <button onClick={clearError} style={{ marginLeft: '10px' }}>×</button>
        </div>
      )}
      
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: '24px',
        gap: '20px'
      }}>
        {loading ? (
          <div className="press-start">Loading..</div>
        ) : (
          <>
          <div className="press-start" onClick={() => startBattle(1)}>| Start battle 1 |</div>
          <div className="press-start" onClick={() => play([[1, 2, 3]])}>| Play |</div>
          </>
        )}
      </div>
    </div>
  );
};

export default ContractsScreen;
