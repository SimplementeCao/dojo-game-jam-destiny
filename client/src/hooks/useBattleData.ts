import { useState, useEffect } from "react";
import { useAccount } from "@starknet-react/core";
import { useDojoSDK } from "@dojoengine/sdk/react";
import type { Battle, Character, CharacterStatus, CurrentBattle, Progress } from "../dojo/models.gen";
import { dojoConfig } from '../dojo/dojoConfig'

// Helper function to convert BigNumberish to number
const toNumber = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseInt(value, 10);
  if (typeof value === 'bigint') return Number(value);
  return 0;
};

export const useBattleData = (battleId?: number) => {
  console.log("useBattleData called with battleId:", battleId);
  const { account } = useAccount();
  const { client } = useDojoSDK();
  
  const [battle, setBattle] = useState<Battle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBattleData = async () => {
    console.log("=== loadBattleData called ===");
    console.log("battleId:", battleId);
    console.log("account?.address:", account?.address);
    console.log("client:", !!client);
    
    if (!battleId || !client) {
      console.log("Early return from loadGameData - missing requirements");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("Querying Torii GraphQL at:", `${dojoConfig.toriiUrl}/graphql`);
      console.log("Query variables:", { battleId });
      
      // GraphQL query to get battle data - Torii schema format
      const battleQuery = `
        query GetBattle($battleId: Int!) {
          destinyBattleModels(where: { id: $battleId }) {
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

      console.log("Querying Torii GraphQL at:", `${dojoConfig.toriiUrl}/graphql`);
      console.log("Query variables:", { battleId });
      
      // Execute both queries in parallel
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
      
      console.log("=== GraphQL requests completed ===");
      
      const [battleResult] = await Promise.all([
        battleResponse.json()
      ]);

      console.log("Torii GraphQL battle response:", battleResult);
      
      let battleData: Battle | null = null;
      console.log("Battle result:", battleResult);
      
      // Process battle data
      if (battleResult.data && battleResult.data.model) {
        const battleNode = battleResult.data.model;
        
        console.log("Battle node from GraphQL:", battleNode);
        
        // For now, let's use a simpler approach for game state to avoid CairoCustomEnum issues
        battleData = {
          id: toNumber(battleNode.id),
          level: toNumber(battleNode.level),
          player: battleNode.player,
          heroes_indexes: battleNode.heroes_indexes,
          monsters_indexes: battleNode.monsters_indexes,
          is_finished: battleNode.is_finished,
        } as Battle;
        
        console.log("Successfully loaded battle data from Torii:", battleData);
      } else if (battleResult.errors) {
        console.error("GraphQL battle errors:", battleResult.errors);
        throw new Error(`GraphQL battle error: ${battleResult.errors[0]?.message || 'Unknown error'}`);
      } else {
        console.log("No battle data found");
        battleData = null;
      }

      setBattle(battleData);
      console.log("Data set successfully!");
      
      } catch (err) {
        console.error("Error loading battle data:", err);
        setError(err instanceof Error ? err.message : "Error loading battle data");
      } finally {
        setLoading(false);
      }
    };

  // Removed automatic reload - data will only be loaded when explicitly called (game start or F5)
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
  const { account } = useAccount();
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCharacterData = async () => {
    if (!characterId || !client) {
      console.log("Early return from loadCharacterData - missing requirements");
      return;
    }

    console.log("All requirements met, proceeding with loadCharacterData");
    setLoading(true);
    setError(null);
    
    try {
      console.log("=== loadCharacterData called ===");
      console.log("characterId:", characterId);
      console.log("account?.address:", account?.address);
      console.log("client:", !!client);
      
      // GraphQL query to get character data - using correct schema
      const characterQuery = `
        query GetCharacter($characterId: Int!) {
          destinyCharacterModels(where: { id: $characterId }) {
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

      console.log("Querying Torii GraphQL at:", `${dojoConfig.toriiUrl}/graphql`);
      console.log("Query variables:", { characterId });
      
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
      console.log("Torii GraphQL response:", result);

      let characterData: Character | null = null;
      if (result.data && result.data.model) {
        const characterNode = result.data.model;
        
        console.log("Character node from GraphQL:", characterNode);
          
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


export const useCharacterStatusData = (battleId?: number, characterIndex?: number) => {
  const { client } = useDojoSDK();
  const [characterStatus, setCharacterStatus] = useState<CharacterStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCharacterStatusData = async () => {
    if (!battleId || !characterIndex || !client) {
      console.log("Early return from loadCharacterStatusData - missing requirements");
      return;
    }

    console.log("All requirements met, proceeding with loadCharacterStatusData");
    setLoading(true);
    setError(null);
    
    try {
      console.log("=== loadCharacterStatusData called ===");
      console.log("battleId:", battleId);
      console.log("characterIndex:", characterIndex);
      console.log("client:", !!client);
      
      // GraphQL query to get character status data - using correct schema
      const characterStatusQuery = `
        query GetCharacterStatus($battleId: Int!, $characterIndex: Int!) {
          destinyCharacterStatusModels(where: { battle_id: $battleId, character_index: $characterIndex }) {
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

      console.log("Querying Torii GraphQL at:", `${dojoConfig.toriiUrl}/graphql`);
      console.log("Query variables:", { battleId, characterIndex });
      
      const response = await fetch(`${dojoConfig.toriiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: characterStatusQuery,
          variables: { battleId, characterIndex }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Torii GraphQL response:", result);

      let characterStatusData: CharacterStatus | null = null;
      if (result.data && result.data.model) {
        const characterStatusNode = result.data.model;
        
        console.log("Character status node from GraphQL:", characterStatusNode);
          
          characterStatusData = {
            id: toNumber(characterStatusNode.id),
            battle_id: toNumber(characterStatusNode.battle_id),
            character_index: toNumber(characterStatusNode.character_index),
            character_id: toNumber(characterStatusNode.character_id),
            health: toNumber(characterStatusNode.health),
            attack: toNumber(characterStatusNode.attack),
            defense: toNumber(characterStatusNode.defense),
            critical_chance: toNumber(characterStatusNode.critical_chance),
            evasion: toNumber(characterStatusNode.evasion),
          } as CharacterStatus;
          setCharacterStatus(characterStatusData);
      } else if (result.errors) {
        console.error("GraphQL errors:", result.errors);
        throw new Error(`GraphQL error: ${result.errors[0]?.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (battleId && characterIndex) {
      loadCharacterStatusData();
    }
  }, [battleId, characterIndex]);

  return {
    characterStatus,
    loading,
    error,
    refetch: loadCharacterStatusData,
  };
}; 
