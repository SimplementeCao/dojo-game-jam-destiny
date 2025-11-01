// Simplified enums for easier usage in the frontend

// Helper function to convert Dojo GameState to our enum
export function convertGameState(dojoState: any): GameStateEnum {
  if (typeof dojoState === 'number') return dojoState;
  if (typeof dojoState === 'string') return parseInt(dojoState, 10);
  if (typeof dojoState === 'bigint') return Number(dojoState);
  
  // Handle CairoCustomEnum structure
  if (dojoState && typeof dojoState === 'object') {
    const stateMap: Record<string, GameStateEnum> = {
      'NotStarted': GameStateEnum.NotStarted,
      'InProgress': GameStateEnum.InProgress,
      'Won': GameStateEnum.Won,
      'Lost': GameStateEnum.Lost,
      'Paused': GameStateEnum.Paused,
    };
    
    const activeVariant = Object.keys(dojoState).find(key => dojoState[key] !== undefined);
    if (activeVariant && activeVariant in stateMap) {
      return stateMap[activeVariant];
    }
  }
  
  return GameStateEnum.NotStarted; // Default
}

// Helper function to convert Dojo TileType to our enum
export function convertTileType(dojoTileType: any): TileTypeEnum {
  if (typeof dojoTileType === 'number') return dojoTileType;
  if (typeof dojoTileType === 'string') return parseInt(dojoTileType, 10);
  if (typeof dojoTileType === 'bigint') return Number(dojoTileType);
  
  // Handle CairoCustomEnum structure
  if (dojoTileType && typeof dojoTileType === 'object') {
    const tileTypeMap: Record<string, TileTypeEnum> = {

    };
    
    const activeVariant = Object.keys(dojoTileType).find(key => dojoTileType[key] !== undefined);
    if (activeVariant && activeVariant in tileTypeMap) {
      return tileTypeMap[activeVariant];
    }
  }
  
  return TileTypeEnum.Empty; // Default
} 