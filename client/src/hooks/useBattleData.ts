import { useState, useEffect, useCallback } from "react";
import { useDojoSDK } from "@dojoengine/sdk/react";
import type { Battle, CharacterStatus, Progress } from "../dojo/generated/typescript/models.gen";
import { dojoConfig } from '../dojo/dojoConfig'

// Helper function to convert BigNumberish to number
const toNumber = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseInt(value, 10);
  if (typeof value === 'bigint') return Number(value);
  return 0;
};

export const useBattleData = (battleId?: number) => {
  const { client } = useDojoSDK();
  
  const [battle, setBattle] = useState<Battle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBattleData = useCallback(async () => {
    if (!battleId || !client) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const battleQuery = `
        query GetBattle($battleId: Int!) {
          destiny5BattleModels(where: { id: $battleId }) {
            edges {
              node {
                id
                level
                player
                heroes_ids
                monsters_ids
                is_finished
              }
            }
          }
        }
      `;
      
      const [battleResponse] = await Promise.all([
        fetch(`${dojoConfig.toriiUrl}/graphql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: battleQuery,
            variables: { battleId }
          }),
        }),
      ]);
      
      if (!battleResponse.ok) {
        throw new Error(`HTTP error! status: ${battleResponse.status}`);
      }
      
      const [battleResult] = await Promise.all([
        battleResponse.json()
      ]);
      
      let battleData: Battle | null = null;
      
      if (battleResult.errors) {
        throw new Error(`GraphQL battle error: ${battleResult.errors[0]?.message || 'Unknown error'}`);
      }
      
      if (battleResult.data?.destiny5BattleModels?.edges?.length > 0) {
        const battleNode = battleResult.data.destiny5BattleModels.edges[0].node;
        
        battleData = {
          id: toNumber(battleNode.id),
          level: toNumber(battleNode.level),
          player: battleNode.player,
          heroes_ids: battleNode.heroes_ids,
          monsters_ids: battleNode.monsters_ids,
          is_finished: battleNode.is_finished,
        } as Battle;
      } else {
        battleData = null;
      }
      
      setBattle(battleData);
      } catch (err) {
        console.error("[useBattleData] - Error loading battle data:", err);
        setError(err instanceof Error ? err.message : "Error loading battle data");
      } finally {
        setLoading(false);
      }
    }, [battleId, client]);

  useEffect(() => {
    if (battleId && client) {
      loadBattleData();
    }
  }, [battleId, client, loadBattleData]);

  return {
    battle,
    loading,
    error,
    refetch: loadBattleData,
  };
};

export const useCharacterStatusData = (battleId?: number, characterId?: number) => {
  const { client } = useDojoSDK();
  const [characterStatus, setCharacterStatus] = useState<CharacterStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCharacterStatusData = async () => {
    if (!battleId || !characterId || !client) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const characterStatusQuery = `
        query GetCharacterStatus($battleId: Int!, $characterId: Int!) {
          destiny5CharacterStatusModels(
            where: { 
              battle_id: $battleId,
              character_id: $characterId
            }
          ) {
            edges {
              node {
                battle_id
                character_id
                health
                attack
                defense
                critical_chance
                evasion
              }
            }
          }
        }
      `;

      const response = await fetch(`${dojoConfig.toriiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: characterStatusQuery,
           variables: { battleId, characterId }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      let characterStatusData: CharacterStatus | null = null;
      if (result.data?.destiny5CharacterStatusModels?.edges?.length > 0) {
        const characterStatusNode = result.data.destiny5CharacterStatusModels.edges[0].node;
        
        characterStatusData = {
          battle_id: toNumber(characterStatusNode.battle_id),
          character_id: toNumber(characterStatusNode.character_id),
          current_hp: toNumber(characterStatusNode.current_hp),
          max_hp: toNumber(characterStatusNode.max_hp),
          attack: toNumber(characterStatusNode.attack),
          defense: toNumber(characterStatusNode.defense),
          critical_chance: toNumber(characterStatusNode.critical_chance),
          evasion: toNumber(characterStatusNode.evasion),
        } as CharacterStatus;
        setCharacterStatus(characterStatusData);
      } else if (result.errors) {
        throw new Error(`GraphQL error: ${result.errors[0]?.message || 'Unknown error'}`);
      } else {
        characterStatusData = null;
        setCharacterStatus(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading character status data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (battleId && characterId !== undefined) {
      loadCharacterStatusData();
    }
  }, [battleId, characterId]);

  return {
    characterStatus,
    loading,
    error,
    refetch: loadCharacterStatusData,
  };
}; 

export const useProgressData = (player?: string, level?: number) => {
  const { client } = useDojoSDK();
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProgressData = async () => {
    if (!player || !level || !client) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const progressQuery = `
        query GetProgress($player: String!, $level: Int!) {
          destiny5ProgressModels(
            where: { 
              player: $player,
              level: $level
            }
          ) {
            edges {
              node {
                player
                level
                completed
              }
            }
          }
        }
      `;

      const response = await fetch(`${dojoConfig.toriiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: progressQuery,
           variables: { player, level }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      let progressData: Progress | null = null;
      if (result.data?.destiny5ProgressModels?.edges?.length > 0) {
        const progressNode = result.data.destiny5ProgressModels.edges[0].node;

        progressData = {
          player: progressNode.player,
          level: toNumber(progressNode.level),
          completed: progressNode.completed,
        } as Progress;
        setProgress(progressData);
      } else if (result.errors) {
        throw new Error(`GraphQL error: ${result.errors[0]?.message || 'Unknown error'}`);
      } else {
        progressData = null;
        setProgress(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading progress data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (player && level !== undefined) {
      loadProgressData();
    }
  }, [player, level]);

  return {
    progress,
    loading,
    error,
    refetch: loadProgressData,
  };
}; 
