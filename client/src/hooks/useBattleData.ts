import { useState, useEffect } from "react";
import { useDojoSDK } from "@dojoengine/sdk/react";
import type { Battle, Character, CharacterStatus } from "../dojo/generated/typescript/models.gen";
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

  const loadBattleData = async () => {
    
    if (!battleId || !client) {
      console.log('[useBattleData] ⚠️ Missing battleId or client:', { battleId, hasClient: !!client });
      return;
    }

    console.log(`[useBattleData] 🔄 Loading battle data for ID: ${battleId}`);
    setLoading(true);
    setError(null);

    try {
      const battleQuery = `
        query GetBattle($battleId: Int!) {
          destiny4BattleModels(where: { id: $battleId }) {
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
      
      console.log('[useBattleData] 📡 Sending GraphQL query:', { battleId, query: battleQuery });
      
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
      
      console.log('[useBattleData] 📦 GraphQL response:', JSON.stringify(battleResult, null, 2));
      
      let battleData: Battle | null = null;
      
      if (battleResult.errors) {
        console.error('[useBattleData] GraphQL errors:', battleResult.errors);
        throw new Error(`GraphQL battle error: ${battleResult.errors[0]?.message || 'Unknown error'}`);
      }
      
      if (battleResult.data?.destiny4BattleModels?.edges?.length > 0) {
        const battleNode = battleResult.data.destiny4BattleModels.edges[0].node;
        
        battleData = {
          id: toNumber(battleNode.id),
          level: toNumber(battleNode.level),
          player: battleNode.player,
          heroes_ids: battleNode.heroes_ids,
          monsters_ids: battleNode.monsters_ids,
          is_finished: battleNode.is_finished,
        } as Battle;
        
        console.log('[useBattleData] ✅ Battle loaded:', battleData);
      } else {
        console.warn(`[useBattleData] ⚠️ No battle found for ID: ${battleId}`);
        console.warn('[useBattleData] Response data:', battleResult.data);
        battleData = null;
      }
      
      setBattle(battleData);
      } catch (err) {
        console.error("Error loading battle data:", err);
        setError(err instanceof Error ? err.message : "Error loading battle data");
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadBattleData();
  }, [battleId]);

  return {
    battle,
    loading,
    error,
    refetch: loadBattleData,
  };
};

export const useCharacterData = (characterId?: number) => {
  const { client } = useDojoSDK();
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCharacterData = async () => {
    if (!characterId || !client) {
      console.log("Early return from loadCharacterData - missing requirements");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const characterQuery = `
        query GetCharacter($characterId: Int!) {
          destiny4CharacterModels(where: { id: $characterId }) {
            edges {
              node {
                id
                name
                skills
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
          query: characterQuery,
          variables: { characterId }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();

      let characterData: Character | null = null;
      if (result.data.destiny4CharacterModels.edges[0].node) {
        const characterNode = result.data.model;
          
          characterData = {
            id: toNumber(characterNode.id),
            name: characterNode.name,
            skills: characterNode.skills,
            health: toNumber(characterNode.health),
            attack: toNumber(characterNode.attack),
            defense: toNumber(characterNode.defense),
            critical_chance: toNumber(characterNode.critical_chance),
            evasion: toNumber(characterNode.evasion),
          } as Character;
          setCharacter(characterData);

      } else if (result.errors) {
        console.error("GraphQL errors:", result.errors);
        throw new Error(`GraphQL error: ${result.errors[0]?.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (characterId) {
      loadCharacterData();
    }
  }, [characterId]);

  return {
    character,
    loading,
    error,
    refetch: loadCharacterData,
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
    
    console.log("[useCharacterStatusData] BattleId:", battleId, "characterId:", characterId);
    try {
      const characterStatusQuery = `
        query GetCharacterStatus($battleId: Int!, $characterId: Int!) {
          destiny4CharacterStatusModels(
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
      console.log("[CharacterStatusData] RESULT RESULT:", result);
      
      let characterStatusData: CharacterStatus | null = null;
      if (result.data?.destiny4CharacterStatusModels?.edges?.length > 0) {
        const characterStatusNode = result.data.destiny4CharacterStatusModels.edges[0].node;
        
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
        console.log("[CharacterStatusData] loaded:", characterStatusData);
      } else if (result.errors) {
        console.error("GraphQL errors:", result.errors);
        throw new Error(`GraphQL error: ${result.errors[0]?.message || 'Unknown error'}`);
      } else {
        characterStatusData = null;
        setCharacterStatus(null);
      }
    } catch (err) {
      console.error("Error loading character status data:", err);
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
