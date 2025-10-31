import { useDojoSDK } from '@dojoengine/sdk/react';
import { useAccount } from '@starknet-react/core';

export const useDojo = () => {
  const { client } = useDojoSDK();
  const { account } = useAccount();

  return {
    client,
    account,
    account_address: account?.address || '',
  };
};

export const useGameActions = () => {
  const { actions } = useDojo();

  return {
    startNewGame: async (account: Account) => {
      if (!actions) return null;
      try {
        const result = await actions.startNewGame(account);
        return result;
      } catch (error) {
        console.error("Error starting new game:", error);
        throw error;
      }
    },

    selectTile: async (account: Account, gameId: number, position: { x: number; y: number }, layer: number) => {
      if (!actions) return null;
      try {
        const result = await actions.selectTile(account, gameId, position, layer);
        return result;
      } catch (error) {
        console.error("Error selecting tile:", error);
        throw error;
      }
    },

    usePowerUp: async (account: Account, gameId: number, powerType: number) => {
      if (!actions) return null;
      try {
        const result = await actions.usePowerUp(account, gameId, powerType);
        return result;
      } catch (error) {
        console.error("Error using power up:", error);
        throw error;
      }
    },

    getAccessibleTiles: async (gameId: number) => {
      if (!actions) return [];
      try {
        const result = await actions.getAccessibleTiles(gameId);
        return result;
      } catch (error) {
        console.error("Error getting accessible tiles:", error);
        return [];
      }
    },

    getBoardState: async (gameId: number) => {
      if (!actions) return [];
      try {
        const result = await actions.getBoardState(gameId);
        return result;
      } catch (error) {
        console.error("Error getting board state:", error);
        return [];
      }
    },
  };
}; 