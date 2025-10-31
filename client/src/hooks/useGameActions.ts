import { useAccount } from "@starknet-react/core";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { useState } from "react";
import type { BigNumberish } from "starknet";
import type { Vec2 } from "../dojo/generated/typescript/models.gen";
import { dojoConfig } from '../dojo/dojoConfig'

export const useGameActions = () => {
  const { account } = useAccount();
  const { client } = useDojoSDK();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Starts a new game session
   * @returns Object with transaction hash and game ID
   */
  const startNewGame = async (): Promise<{transaction_hash: string, game_id: number} | null> => {
    if (!account) {
      setError("No account connected");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('creando juego');
      const response = await client.actions.startNewGame(account);
      const transaction_hash = response?.transaction_hash ?? "";

      const tx = await account.waitForTransaction(transaction_hash, {
        retryInterval: 100,
      });

      if (tx.isSuccess()) {
        const events = tx.events;
        console.log("events", events);
        // const gameIdHex = events[6].data[3];
        const gameIdHex = events[147].data[3];
        const gameId = parseInt(gameIdHex, 16);
        return {
          transaction_hash,
          game_id: gameId,
        };
      } else {
        console.error("Error creating game:", tx);
        setError("Transaction failed");
        return null;
      }
    } catch (err) {
      console.error("Error starting game:", err);
      setError("Failed to start game");
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Selects a tile in the game - now runs in background without blocking UI
   * @param gameId Game ID
   * @param position Tile position
   * @param layer Tile layer
   * @returns Transaction hash
   */
  const selectTile = async (
    gameId: BigNumberish,
    position: Vec2,
    layer: BigNumberish
  ): Promise<string | null> => {
    if (!account) {
      setError("No account connected");
      return null;
    }

    // No setLoading(true) aquí - permitir que la transacción se ejecute en segundo plano
    setError(null);

    try {
      console.log("=== SELECTING TILE (BACKGROUND) ===");
      console.log("Game ID:", gameId);
      console.log("Position:", position);
      console.log("Layer:", layer);
      console.log("Account:", account.address);
      
      // Ejecutar la transacción en segundo plano sin esperar
      const transactionPromise = client.actions.selectTile(account, gameId, position, layer);
      
      // Devolver inmediatamente una promesa que se resuelve con el hash
      transactionPromise.then((result: any) => {
        console.log("Background transaction completed:", result);
      }).catch((err: any) => {
        console.error("Background transaction failed:", err);
        setError(`Failed to select tile: ${err instanceof Error ? err.message : 'Unknown error'}`);
      });
      
      // Devolver un hash temporal o null inmediatamente
      return "pending";
    } catch (err) {
      console.error("Error selecting tile:", err);
      setError(`Failed to select tile: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return null;
    }
  };

  return {
    // Actions
    startNewGame,
    selectTile,
    
    // State
    loading,
    error,
    
    // Utils
    clearError: () => setError(null),
  };
}; 