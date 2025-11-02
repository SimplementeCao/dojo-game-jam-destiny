import React from 'react';
import '../assets/font.css';

interface HomeScreenProps {
  iniciarJuego: () => void;
  loading?: boolean;
  connected?: boolean;
  stats?: any | null; // Using any since PlayerStats doesn't exist
}

const HomeScreen: React.FC<HomeScreenProps> = ({ 
  iniciarJuego, 
  loading = false,
  connected = false
}) => {
  return (
    <div className="pantalla-inicio pantalla-inicio-background">
      
      <h1 className="title-banner">
        <span className="titulo-text">DESTINY</span>
      </h1>
      
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: '24px'
      }}>
        {loading ? (
          <div className="CONNECT WITH CONTROLLER">LOADING...</div>
        ) : (
          <div className="press-start" onClick={iniciarJuego}>
            {connected ? 'PRESS START' : 'CONNECT WITH CONTROLLER'}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeScreen;
