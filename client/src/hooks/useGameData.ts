import { useState, useEffect } from "react";
import { useAccount } from "@starknet-react/core";
import { useDojoSDK } from "@dojoengine/sdk/react";
import type { Game, PlayerInventory, PlayerStats, Tile } from "../dojo/models.gen";
import { CairoCustomEnum } from "starknet";
import { dojoConfig } from '../dojo/dojoConfig'

// Helper function to convert BigNumberish to number
const toNumber = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseInt(value, 10);
  if (typeof value === 'bigint') return Number(value);
  return 0;
};

export const useGameData = (gameId?: number) => {
  const { account } = useAccount();
  const { client } = useDojoSDK();
  
  const [game, setGame] = useState<Game | null>(null);
  const [inventory, setInventory] = useState<PlayerInventory | null>(null);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [powerUps, setPowerUps] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGameData = async () => {
    console.log("=== loadGameData called ===");
    console.log("gameId:", gameId);
    console.log("account?.address:", account?.address);
    console.log("client:", !!client);
    
    if (!gameId || !account?.address || !client) {
      console.log("Early return from loadGameData - missing requirements");
      return;
    }

    console.log("All requirements met, proceeding with loadGameData");
    setLoading(true);
    setError(null);

    try {
      console.log("Loading game data for game:", gameId, "player:", account.address);
      
      // Use Torii's GraphQL client to query game data directly
      
      // GraphQL query to get game data
      const gameQuery = `
        query GetGame($gameId: Int!, $player: String!) {
          dojoSheepASheepGameModels(where: { game_id: $gameId, player: $player }) {
            edges {
              node {
                game_id
                player
                state
                score
                moves_used
                start_time
                end_time
                board_width
                board_height
                max_layers
                total_tiles
                remaining_tiles
              }
            }
          }
        }
      `;

      // GraphQL query to get player inventory
      const inventoryQuery = `
        query GetPlayerInventory($gameId: Int!) {
          dojoSheepASheepPlayerInventoryModels(where: { game_id: $gameId }) {
            edges {
              node {
                game_id
                slots
              }
            }
          }
        }
      `;

      console.log("Querying Torii GraphQL at:", `${dojoConfig.toriiUrl}/graphql`);
      console.log("Query variables:", { gameId, player: account.address });
      
      // Execute both queries in parallel
      const [gameResponse, inventoryResponse] = await Promise.all([
        fetch(`${dojoConfig.toriiUrl}/graphql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: gameQuery,
            variables: { gameId, player: account.address }
          }),
        }),
        fetch(`${dojoConfig.toriiUrl}/graphql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: inventoryQuery,
            variables: { gameId }
          }),
        })
      ]);

      if (!gameResponse.ok || !inventoryResponse.ok) {
        throw new Error(`HTTP error! Game: ${gameResponse.status}, Inventory: ${inventoryResponse.status}`);
      }

      console.log("=== GraphQL requests completed ===");
      
      const [gameResult, inventoryResult] = await Promise.all([
        gameResponse.json(),
        inventoryResponse.json()
      ]);

      console.log("Torii GraphQL game response:", gameResult);
      console.log("Torii GraphQL inventory response:", JSON.stringify(inventoryResult, null, 2));

      let gameData: Game | null = null;
      let inventoryData: PlayerInventory | null = null;

      // Process game data
      if (gameResult.data && gameResult.data.dojoSheepASheepGameModels && gameResult.data.dojoSheepASheepGameModels.edges.length > 0) {
        const gameNode = gameResult.data.dojoSheepASheepGameModels.edges[0].node;
        
        console.log("Game node from GraphQL:", gameNode);
        
        // For now, let's use a simpler approach for game state to avoid CairoCustomEnum issues
        gameData = {
          game_id: toNumber(gameNode.game_id),
          player: gameNode.player,
          state: gameNode.state as any, // Use raw state for now
          score: toNumber(gameNode.score),
          moves_used: toNumber(gameNode.moves_used),
          start_time: toNumber(gameNode.start_time),
          end_time: toNumber(gameNode.end_time),
          board_width: toNumber(gameNode.board_width),
          board_height: toNumber(gameNode.board_height),
          max_layers: toNumber(gameNode.max_layers),
          total_tiles: toNumber(gameNode.total_tiles),
          remaining_tiles: toNumber(gameNode.remaining_tiles),
        } as Game;
        
        console.log("Successfully loaded game data from Torii:", gameData);
      } else if (gameResult.errors) {
        console.error("GraphQL game errors:", gameResult.errors);
        throw new Error(`GraphQL game error: ${gameResult.errors[0]?.message || 'Unknown error'}`);
      } else {
        console.log("No game data found");
        gameData = null;
      }

      // Process inventory data
      console.log("Processing inventory data...");
      console.log("inventoryResult.data exists:", !!inventoryResult.data);
      console.log("dojoSheepASheepPlayerInventoryModels exists:", !!inventoryResult.data?.dojoSheepASheepPlayerInventoryModels);
      console.log("edges length:", inventoryResult.data?.dojoSheepASheepPlayerInventoryModels?.edges?.length);
      
      if (inventoryResult.data && inventoryResult.data.dojoSheepASheepPlayerInventoryModels && inventoryResult.data.dojoSheepASheepPlayerInventoryModels.edges.length > 0) {
        const inventoryNode = inventoryResult.data.dojoSheepASheepPlayerInventoryModels.edges[0].node;
        console.log("Raw inventory node:", inventoryNode);
        
        // Convert slots array - the slots come as numbers directly
        const slots = Array.isArray(inventoryNode.slots) 
          ? inventoryNode.slots.map((slot: any) => {
              console.log("Processing slot:", slot, "type:", typeof slot);
              // Convert to number if it's a string
              const slotNumber = typeof slot === 'string' ? parseInt(slot) : toNumber(slot);
              console.log("Converted slot to number:", slotNumber);
              return slotNumber;
            })
          : [];
        
        console.log("Processed slots:", slots);
        
        inventoryData = {
          player: account.address, // Use current account since player field was removed from query
          game_id: toNumber(inventoryNode.game_id),
          slots: slots,
        } as PlayerInventory;
        
        console.log("Successfully loaded inventory data from Torii:", inventoryData);
      } else if (inventoryResult.errors) {
        console.error("GraphQL inventory errors:", inventoryResult.errors);
        throw new Error(`GraphQL inventory error: ${inventoryResult.errors[0]?.message || 'Unknown error'}`);
      } else {
        console.log("No inventory data found - this is normal for new games");
        // Create empty inventory for new games
        inventoryData = {
          player: account.address,
          game_id: gameId,
          slots: [],
        } as PlayerInventory;
      }

      // Create mock stats for now
      const mockStats: PlayerStats = {
        player: account.address,
        games_played: 1,
        games_won: 0,
        total_score: gameData?.score || 0,
        best_score: gameData?.score || 0,
        level_reached: 1,
      };
      
      // Create mock powerups (simple object since PowerUps type doesn't exist)
      const mockPowerUps = {
        player: account.address,
        game_id: gameId,
        shuffle_count: 3,
        hint_count: 3,
        undo_count: 3,
        bomb_count: 1,
      };
      
      console.log("Setting final data...");
      console.log("Final gameData:", gameData);
      console.log("Final inventoryData:", inventoryData);
      
      setGame(gameData);
      setInventory(inventoryData);
      setStats(mockStats);
      setPowerUps(mockPowerUps);
      
      console.log("Data set successfully!");
      
    } catch (err) {
      console.error("Error loading game data:", err);
      setError(err instanceof Error ? err.message : "Error loading game data");
    } finally {
      setLoading(false);
    }
  };

  // Removed automatic reload - data will only be loaded when explicitly called (game start or F5)
  // useEffect(() => {
  //   loadGameData();
  // }, [gameId, account?.address]);

  return {
    game,
    inventory,
    stats,
    powerUps,
    loading,
    error,
    refetch: loadGameData,
  };
};

export const useBoardData = (gameId?: number) => {
  const { client } = useDojoSDK();
  const { account } = useAccount();
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBoardData = async () => {
    if (!gameId || !client || !account) {
      console.log("Missing requirements:", { gameId, client: !!client, account: !!account });
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log("Loading board data for game:", gameId);
      
      // GraphQL query to get all tiles for the game - using correct schema
      const tilesQuery = `
        query GetTiles($gameId: Int!) {
          dojoSheepASheepTileModels(first: 1000, where: { game_id: $gameId, consumed: false }) {
            edges {
              node {
                game_id
                position {
                  x
                  y
                }
                layer
                tile_type
                consumed
              }
            }
          }
        }
      `;

      console.log("Querying Torii GraphQL at:", `${dojoConfig.toriiUrl}/graphql`);
      console.log("Query variables:", { gameId });
      
      const response = await fetch(`${dojoConfig.toriiUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: tilesQuery,
          variables: { gameId }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Torii GraphQL response:", result);

      let boardTiles: Tile[] = [];
      
      if (result.data && result.data.dojoSheepASheepTileModels && result.data.dojoSheepASheepTileModels.edges) {
        console.log("=== PROCESSING BOARD TILES ===");
        console.log("Total tiles from GraphQL:", result.data.dojoSheepASheepTileModels.edges.length);
        
        // Convert GraphQL response to our tile format
        boardTiles = result.data.dojoSheepASheepTileModels.edges.map((edge: any, index: number) => {
          const node = edge.node;
          
          console.log(`Tile ${index}:`, {
            game_id: node.game_id,
            position: node.position,
            layer: node.layer,
            tile_type: node.tile_type,
            consumed: node.consumed
          });
          
          // Convert tile_type from string enum to number
          const tileTypeMap: Record<string, number> = {
            'Empty': 0,
            'Sheep': 1,
            'Wolf': 2,
            'Grass': 3,
            'Flower': 4,
            'Carrot': 5,
            'Bone': 6,
            'Corn': 7,
            'Tool': 8,
            'Bucket': 9,
            'Wood': 10,
            'Glove': 11,
            'Cabbage': 12,
            'Apple': 13,
            'Strawberry': 14,
            'Pumpkin': 15,
            'Cherry': 16,
          };
          
          const processedTile = {
            game_id: toNumber(node.game_id),
            position: {
              x: toNumber(node.position.x),
              y: toNumber(node.position.y),
            },
            layer: toNumber(node.layer),
            tile_type: tileTypeMap[node.tile_type] || 0,
            consumed: node.consumed,
          } as any as Tile; // Temporary fix for type compatibility
          
          console.log(`Processed tile ${index}:`, processedTile);
          return processedTile;
        });
        
        console.log("Successfully loaded tiles from Torii:", boardTiles);
        console.log("Final board tiles count:", boardTiles.length);
        console.log("================================");
      } else if (result.errors) {
        console.error("GraphQL errors:", result.errors);
        throw new Error(`GraphQL error: ${result.errors[0]?.message || 'Unknown error'}`);
      } else {
        console.warn("No tiles found in Torii response for gameId:", gameId);
        
        // Try to initialize the game if no tiles found
        try {
          console.log("Attempting to start game to generate board data");
          const gameResult = await client.actions.startNewGame(account);
          console.log("Game start result:", gameResult);
          
          // Wait a bit for the transaction to be processed and indexed by Torii
          console.log("Waiting for transaction to be indexed...");
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // Retry the query
          const retryResponse = await fetch(`${dojoConfig.toriiUrl}/graphql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: tilesQuery,
              variables: { gameId }
            }),
          });
          
          if (retryResponse.ok) {
            const retryResult = await retryResponse.json();
            console.log("Retry response:", retryResult);
            
            if (retryResult.data && retryResult.data.dojoSheepASheepTileModels && retryResult.data.dojoSheepASheepTileModels.edges) {
              boardTiles = retryResult.data.dojoSheepASheepTileModels.edges.map((edge: any) => {
                const node = edge.node;
                const tileTypeMap: Record<string, number> = {
                  'Empty': 0, 'Sheep': 1, 'Wolf': 2, 'Grass': 3, 'Flower': 4, 'Carrot': 5,
                  'Bone': 6, 'Corn': 7, 'Tool': 8, 'Bucket': 9, 'Wood': 10, 'Glove': 11,
                  'Cabbage': 12, 'Apple': 13, 'Strawberry': 14, 'Pumpkin': 15, 'Cherry': 16,
                };
                
                return {
                  game_id: toNumber(node.game_id),
                  position: {
                    x: toNumber(node.position.x),
                    y: toNumber(node.position.y),
                  },
                  layer: toNumber(node.layer),
                  tile_type: tileTypeMap[node.tile_type] || 0,
                  consumed: node.consumed,
                } as Tile;
              });
              console.log("Successfully loaded tiles after retry:", boardTiles);
            }
          }
        } catch (gameError) {
          console.error("Error starting game:", gameError);
        }
      }
      
      if (boardTiles.length === 0) {
        console.error("No board data received from backend after all attempts");
        throw new Error(`No board data available from backend for game ${gameId}. Try starting a new game or check if the game exists.`);
      }
      
      setTiles(boardTiles);
      
    } catch (err) {
      console.error("Error loading board data from backend:", err);
      setError(err instanceof Error ? err.message : "Error loading board data from backend");
      
      // Don't set empty arrays - let the UI show the error
      // setTiles([]);
      // setAccessibleTiles([]);
    } finally {
      setLoading(false);
    }
  };

  // Removed automatic board data loading - will only load on game start or F5
  // useEffect(() => {
  //   if (gameId) {
  //     loadBoardData();
  //   }
  // }, [gameId, account?.address]);

  return {
    tiles,
    loading,
    error,
    refetch: loadBoardData,
  };
}; 