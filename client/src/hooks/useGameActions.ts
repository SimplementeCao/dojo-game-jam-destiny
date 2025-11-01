import { useAccount } from "@starknet-react/core";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { useState } from "react";
import type { BigNumberish } from "starknet";

export const useGameActions = () => {
  const { account } = useAccount();
  const { client } = useDojoSDK();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const startBattle = async (level: BigNumberish): Promise<{transaction_hash: string, battle_id: BigNumberish} | null> => {
    if (!account) {
      setError("No account connected");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Creating new battle');
      console.log("account:", account.address, "level:", level);
      console.log("client:", client);
      const response = await client.actions.startBattle(account, level);
      const transaction_hash = response?.transaction_hash ?? "";
      const tx = await account.waitForTransaction(transaction_hash, {
        retryInterval: 100,
      });

      if (tx.isSuccess()) {
        const events = tx.events;
        console.log("[startBattle] - Events: ", events);
        const id = 1;
        return {
          transaction_hash,
          battle_id: id,
        };
      } else {
        console.error("Creating new battle:", tx);
        setError("Transaction failed");
        return null;
      }
    } catch (err) {
      console.error("Creating new battle:", err);
      setError("Failed to start battle");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const play = async (
    actions: Array<[BigNumberish, BigNumberish, BigNumberish]>,
  ): Promise<{transaction_hash: string} | null> => {
    if (!account) {
      setError("No account connected");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Playing actions");
      console.log("Account:", account.address);
      console.log("Actions:", actions);
      
      const response = await client.actions.play(account, actions);
      const transaction_hash = response?.transaction_hash ?? "";
      const tx = await account.waitForTransaction(transaction_hash, {
        retryInterval: 100,
      });

      if (tx.isSuccess()) {
        const events = tx.events;
        console.log("[play] - Events: ", events);
        return transaction_hash;
      } else {
        console.error("[play] - Transaction failed:", tx);
        setError("Transaction failed");
        return null;
      }
    } catch (err) {
      console.error("[play] - Error playing actions:", err);
      setError(`Failed to play actions: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    startBattle,
    play,

    loading,
    error,
    clearError: () => setError(null),
  };
}; 
