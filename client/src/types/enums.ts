// Simplified enums for easier usage in the frontend

export enum GameStateEnum {
  NotStarted = 0,
  InProgress = 1,
  Won = 2,
  Lost = 3,
  Paused = 4,
}

export enum TileTypeEnum {
  Empty = 0,
  Sheep = 1,
  Wolf = 2,
  Grass = 3,
  Flower = 4,
  Carrot = 5,
  Bone = 6,
  Corn = 7,
  Tool = 8,
  Bucket = 9,
  Wood = 10,
  Glove = 11,
  Cabbage = 12,
  Apple = 13,
  Strawberry = 14,
  Pumpkin = 15,
  Cherry = 16,
}

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
      'Empty': TileTypeEnum.Empty,
      'Sheep': TileTypeEnum.Sheep,
      'Wolf': TileTypeEnum.Wolf,
      'Grass': TileTypeEnum.Grass,
      'Flower': TileTypeEnum.Flower,
      'Carrot': TileTypeEnum.Carrot,
      'Bone': TileTypeEnum.Bone,
      'Corn': TileTypeEnum.Corn,
      'Tool': TileTypeEnum.Tool,
      'Bucket': TileTypeEnum.Bucket,
      'Wood': TileTypeEnum.Wood,
      'Glove': TileTypeEnum.Glove,
      'Cabbage': TileTypeEnum.Cabbage,
      'Apple': TileTypeEnum.Apple,
      'Strawberry': TileTypeEnum.Strawberry,
      'Pumpkin': TileTypeEnum.Pumpkin,
      'Cherry': TileTypeEnum.Cherry,
    };
    
    const activeVariant = Object.keys(dojoTileType).find(key => dojoTileType[key] !== undefined);
    if (activeVariant && activeVariant in tileTypeMap) {
      return tileTypeMap[activeVariant];
    }
  }
  
  return TileTypeEnum.Empty; // Default
} 