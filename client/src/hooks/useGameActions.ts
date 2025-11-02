import { useAccount } from "@starknet-react/core";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { useState } from "react";
import type { BigNumberish } from "starknet";
import { getEventKey } from "../dojo/getEventKey";

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
        const battleCreatedEvent = events.find((event) => event.keys[1] === getEventKey("BattleCreatedEvent"));
        console.log("[startBattle] - battleCreatedEvent: ", battleCreatedEvent, "battle_id: ", battleCreatedEvent?.data[3]);

        return {
          transaction_hash,
          battle_id: battleCreatedEvent?.data[3] as BigNumberish,
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
    actions: Array<string>,
  ): Promise<{transaction_hash: string, parsed_events: { key: string, data: any }[]} | null> => {
    console.log("[play] - start - actions: ", actions);
    console.log("[play] - account: ", account);

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
        const parsed_events: { key: string, data: any }[] = [];
        // Helper para convertir hex/string/bigint a number
        const toNumber = (val: any) => {
          if (typeof val === 'number') return val;
          if (typeof val === 'bigint') return Number(val);
          if (typeof val === 'string') {
            if (val.startsWith('0x') || val.startsWith('0X')) {
              return parseInt(val, 16);
            }
            return parseInt(val, 10);
          }
          try {
            return Number(val);
          } catch {
            return 0;
          }
        };

        events.forEach((event) => {
          if (event.keys[1] == getEventKey("DamageEvent")) {
            console.log("[play] - Damage event: ", event);
            parsed_events.push({
              key: "DamageEvent",
              data: {
                battle_id: toNumber(event.data[1]),
                from_idx: toNumber(event.data[3]),
                to_idx: toNumber(event.data[4]),
                critical_hit: toNumber(event.data[5]),
                damage: toNumber(event.data[6]),
                is_monster: toNumber(event.data[7]),
              },
            });
          } else if (event.keys[1] == getEventKey("BuffEvent")) {
            parsed_events.push({
              key: "BuffEvent",
              data: {
                battle_id: toNumber(event.data[1]),
                from_idx: toNumber(event.data[3]),
                to_idx: toNumber(event.data[4]),
                buff_id: toNumber(event.data[5]),
                amount: toNumber(event.data[6]),
                is_monster: toNumber(event.data[7]),
              },
            });
          } else if (event.keys[1] == getEventKey("DebuffEvent")) {
            parsed_events.push({
              key: "DebuffEvent",
              data: {
                battle_id: toNumber(event.data[1]),
                from_idx: toNumber(event.data[3]),
                to_idx: toNumber(event.data[4]),
                debuff_id: toNumber(event.data[5]),
                amount: toNumber(event.data[6]),
                is_monster: toNumber(event.data[7]),
              },
            });
          } else if (event.keys[1] == getEventKey("HealEvent")) {
            parsed_events.push({
              key: "HealEvent",
              data: {
                battle_id: toNumber(event.data[1]),
                from_idx: toNumber(event.data[3]),
                to_idx: toNumber(event.data[4]),
                amount: toNumber(event.data[5]),
                is_monster: toNumber(event.data[6]),
              },
            });
          } else if (event.keys[1] == getEventKey("MissEvent")) {
            parsed_events.push({
              key: "MissEvent",
              data: {
                battle_id: toNumber(event.data[1]),
                from_idx: toNumber(event.data[3]),
                to_idx: toNumber(event.data[4]),
                is_monster: toNumber(event.data[5]),
              },
            });
          } else if (event.keys[1] == getEventKey("PlayerWinEvent")) {
            parsed_events.push({
              key: "PlayerWinEvent",
              data: {
                battle_id: toNumber(event.data[1]),
                player: toNumber(event.data[3]),
              },
            });
          } else if (event.keys[1] == getEventKey("PlayerLoseEvent")) {
            parsed_events.push({
              key: "PlayerLoseEvent",
              data: {
                battle_id: toNumber(event.data[1]),
                player: toNumber(event.data[3]),
              },
            });
          }
        });

        console.log("[play] - Parsed events: ", parsed_events);

        // Retornar objeto con transaction_hash para consistencia con startBattle
        return { transaction_hash, parsed_events };
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
