import { useState, useCallback } from 'react';
import type { Tile } from '../dojo/models.gen';

// Helper function to convert BigNumberish to number
const toNumber = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseInt(value, 10);
  if (typeof value === 'bigint') return Number(value);
  return 0;
};

// Helper function to get tile type as number
const getTileTypeNumber = (tileType: any): number => {
  // Handle CairoCustomEnum
  if (tileType && typeof tileType === 'object' && 'activeVariant' in tileType) {
    const variant = tileType.activeVariant();
    const typeMap: Record<string, number> = {
      'Empty': 0, 'Sheep': 1, 'Wolf': 2, 'Grass': 3, 'Flower': 4, 'Carrot': 5,
      'Bone': 6, 'Corn': 7, 'Tool': 8, 'Bucket': 9, 'Wood': 10, 'Glove': 11,
      'Cabbage': 12, 'Apple': 13, 'Strawberry': 14, 'Pumpkin': 15, 'Cherry': 16,
    };
    return typeMap[variant] || 0;
  }
  
  // Handle numeric values
  return toNumber(tileType);
};

export const useGameLogic = () => {
  const [localTiles, setLocalTiles] = useState<Tile[]>([]);
  const [localSlotTemporal, setLocalSlotTemporal] = useState<number[]>([]);
  const [localScore, setLocalScore] = useState<number>(0);
  const [dataInitialized, setDataInitialized] = useState<boolean>(false);

  // Initialize local state with backend data (only called on game start or F5)
  const initializeGameData = useCallback((tiles: Tile[], inventory: number[], score: number = 0) => {
    console.log('Initializing local game data:', { tiles: tiles.length, inventory: inventory.length, score });
    setLocalTiles([...tiles]);
    setLocalSlotTemporal([...inventory]);
    setLocalScore(score);
    setDataInitialized(true);
  }, []);

  // Check if a tile is accessible (no tiles on top of it)
  const isTileAccessible = useCallback((tile: Tile, allTiles: Tile[]): boolean => {
    const tileX = toNumber(tile.position.x);
    const tileY = toNumber(tile.position.y);
    const tileLayer = toNumber(tile.layer);

    // Check if there's any tile in a higher layer that overlaps this tile
    const hasOverlappingTileAbove = allTiles.some(otherTile => {
      const otherX = toNumber(otherTile.position.x);
      const otherY = toNumber(otherTile.position.y);
      const otherLayer = toNumber(otherTile.layer);

      // Skip same tile
      if (otherX === tileX && otherY === tileY && otherLayer === tileLayer) {
        return false;
      }

      // Check if other tile is in a higher layer
      if (otherLayer <= tileLayer) {
        return false;
      }

      // Check if tiles overlap (allowing for partial overlap)
      const xOverlap = Math.abs(otherX - tileX) < 1;
      const yOverlap = Math.abs(otherY - tileY) < 1;

      return xOverlap && yOverlap;
    });

    return !hasOverlappingTileAbove;
  }, []);

  // Handle tile selection with immediate UI update
  const selectTileLocal = useCallback((position: { x: number; y: number }, layer: number): boolean => {
    if (!dataInitialized) {
      console.warn('Game data not initialized yet');
      return false;
    }

    console.log('=== LOCAL TILE SELECTION ===');
    console.log('Position:', position, 'Layer:', layer);
    console.log('Current tiles:', localTiles.length);
    console.log('Current slot temporal:', localSlotTemporal);

    // Find the selected tile
    const selectedTile = localTiles.find(tile => 
      toNumber(tile.position.x) === position.x && 
      toNumber(tile.position.y) === position.y && 
      toNumber(tile.layer) === layer
    );

    if (!selectedTile) {
      console.warn('Tile not found');
      return false;
    }

    // Check if tile is accessible
    if (!isTileAccessible(selectedTile, localTiles)) {
      console.warn('Tile is not accessible');
      return false;
    }

    // Check if slot temporal is full
    if (localSlotTemporal.length >= 7) {
      console.warn('Slot temporal is full');
      return false;
    }

    const tileType = getTileTypeNumber(selectedTile.tile_type);
    console.log('Selected tile type:', tileType);

    // Remove tile from board immediately
    const newTiles = localTiles.filter(tile => 
      !(toNumber(tile.position.x) === position.x && 
        toNumber(tile.position.y) === position.y && 
        toNumber(tile.layer) === layer)
    );

    // Add tile to slot temporal
    const newSlotTemporal = [...localSlotTemporal, tileType];

    // Check for matches and remove them
    const { updatedSlot, matchesFound } = processMatches(newSlotTemporal);

    // Update score based on matches
    const newScore = localScore + (matchesFound * 10);

    // Update local state immediately
    setLocalTiles(newTiles);
    setLocalSlotTemporal(updatedSlot);
    setLocalScore(newScore);

    console.log('Updated state:', {
      tiles: newTiles.length,
      slotTemporal: updatedSlot,
      score: newScore,
      matchesFound
    });

    return true;
  }, [localTiles, localSlotTemporal, localScore, dataInitialized, isTileAccessible]);

  // Process matches in slot temporal
  const processMatches = useCallback((slot: number[]): { updatedSlot: number[], matchesFound: number } => {
    let updatedSlot = [...slot];
    let matchesFound = 0;

    // Keep checking for matches until no more are found
    let foundMatch = true;
    while (foundMatch) {
      foundMatch = false;

      // Count occurrences of each tile type
      const typeCounts: Record<number, number> = {};
      updatedSlot.forEach(type => {
        typeCounts[type] = (typeCounts[type] || 0) + 1;
      });

      // Find first type with 3 or more tiles
      for (const [type, count] of Object.entries(typeCounts)) {
        if (count >= 3) {
          const typeNum = parseInt(type);
          console.log(`Found match for type ${typeNum}, count: ${count}`);
          
          // Remove 3 tiles of this type
          let removed = 0;
          updatedSlot = updatedSlot.filter(slotType => {
            if (slotType === typeNum && removed < 3) {
              removed++;
              return false;
            }
            return true;
          });

          matchesFound++;
          foundMatch = true;
          break;
        }
      }
    }

    return { updatedSlot, matchesFound };
  }, []);

  // Get accessible tiles for rendering
  const getAccessibleTiles = useCallback((): Tile[] => {
    return localTiles.filter(tile => isTileAccessible(tile, localTiles));
  }, [localTiles, isTileAccessible]);

  // Check if game is won (no tiles left)
  const isGameWon = useCallback((): boolean => {
    return dataInitialized && localTiles.length === 0;
  }, [localTiles, dataInitialized]);

  // Check if game is lost (slot temporal full and no matches possible)
  const isGameLost = useCallback((): boolean => {
    if (!dataInitialized || localSlotTemporal.length < 7) {
      return false;
    }

    // If slot is full, check if there are any possible matches
    const typeCounts: Record<number, number> = {};
    localSlotTemporal.forEach(type => {
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    // If any type has 3 or more, game is not lost yet
    const hasMatch = Object.values(typeCounts).some(count => count >= 3);
    
    console.log('Checking game lost condition:', {
      slotLength: localSlotTemporal.length,
      typeCounts,
      hasMatch,
      isLost: !hasMatch
    });
    
    return !hasMatch;
  }, [localSlotTemporal, dataInitialized]);

  // Reset local state
  const resetLocalState = useCallback(() => {
    setLocalTiles([]);
    setLocalSlotTemporal([]);
    setLocalScore(0);
    setDataInitialized(false);
  }, []);

  return {
    // State
    localTiles,
    localSlotTemporal,
    localScore,
    dataInitialized,

    // Actions
    initializeGameData,
    selectTileLocal,
    resetLocalState,

    // Utils
    getAccessibleTiles,
    isTileAccessible,
    isGameWon,
    isGameLost,
  };
}; 