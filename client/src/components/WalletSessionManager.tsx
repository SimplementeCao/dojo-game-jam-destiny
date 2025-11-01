import { useEffect, useRef } from 'react';
import { useAccount, useConnect } from '@starknet-react/core';

/**
 * Componente que maneja la restauración automática de la sesión de wallet.
 * 
 * Este es el enfoque estándar en React: usar un componente de alto nivel
 * dentro del Context Provider para gestionar el estado global.
 * 
 * El StarknetConfig ya proporciona el contexto, este componente solo
 * se encarga de restaurar la sesión si existe una guardada.
 */
export const WalletSessionManager = () => {
  const { account, status, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const hasAttemptedRestore = useRef(false);

  useEffect(() => {
    // Solo intentar restaurar una vez cuando la app se monta
    if (hasAttemptedRestore.current) return;
    
    // Si ya está conectado, no hacer nada
    if (isConnected || status === 'connecting' || status === 'reconnecting') {
      return;
    }

    // Si hay connectors disponibles y estamos desconectados
    if (status === 'disconnected' && connectors.length > 0) {
      const connector = connectors[0];
      
      // Intentar restaurar la sesión
      const restoreSession = async () => {
        try {
          hasAttemptedRestore.current = true;
          // El ControllerConnector debería restaurar automáticamente si hay sesión
          // Solo necesitamos llamar a connect y el connector manejará el resto
          await connect({ connector });
        } catch (error) {
          // Si no hay sesión guardada, esto es normal
          // No hacer nada, el usuario tendrá que conectar manualmente
          hasAttemptedRestore.current = false;
        }
      };

      // Pequeño delay para asegurar que todo esté inicializado
      const timeoutId = setTimeout(restoreSession, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isConnected, status, connectors, connect]);

  // Reset el flag cuando se conecta exitosamente
  useEffect(() => {
    if (isConnected) {
      hasAttemptedRestore.current = false;
    }
  }, [isConnected]);

  // Este componente no renderiza nada
  return null;
};

