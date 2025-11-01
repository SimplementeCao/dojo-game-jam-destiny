import { useDojoSDK } from '@dojoengine/sdk/react';
import { useAccount } from '@starknet-react/core';

/**
 * Hook base para acceder al cliente Dojo y la cuenta conectada
 * Para acciones del juego, usar useGameActions en lugar de este hook
 */
export const useDojo = () => {
  const { client } = useDojoSDK();
  const { account } = useAccount();

  return {
    client,
    account,
    account_address: account?.address || '',
  };
}; 