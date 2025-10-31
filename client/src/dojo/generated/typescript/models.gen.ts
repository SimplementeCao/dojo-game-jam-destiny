import type { SchemaType as ISchemaType } from "@dojoengine/sdk";

import { CairoCustomEnum, BigNumberish } from 'starknet';

// Type definition for `dojo_sheep_a_sheep::models::Game` struct
export interface Game {
	game_id: BigNumberish;
	player: string;
	state: GameStateEnum;
	score: BigNumberish;
	moves_used: BigNumberish;
	start_time: BigNumberish;
	end_time: BigNumberish;
	board_width: BigNumberish;
	board_height: BigNumberish;
	max_layers: BigNumberish;
	total_tiles: BigNumberish;
	remaining_tiles: BigNumberish;
}

// Type definition for `dojo_sheep_a_sheep::models::GameValue` struct
export interface GameValue {
	player: string;
	state: GameStateEnum;
	score: BigNumberish;
	moves_used: BigNumberish;
	start_time: BigNumberish;
	end_time: BigNumberish;
	board_width: BigNumberish;
	board_height: BigNumberish;
	max_layers: BigNumberish;
	total_tiles: BigNumberish;
	remaining_tiles: BigNumberish;
}

// Type definition for `dojo_sheep_a_sheep::models::PlayerInventory` struct
export interface PlayerInventory {
	game_id: BigNumberish;
	slots: Array<BigNumberish>;
}

// Type definition for `dojo_sheep_a_sheep::models::PlayerInventoryValue` struct
export interface PlayerInventoryValue {
	slots: Array<BigNumberish>;
}

// Type definition for `dojo_sheep_a_sheep::models::Tile` struct
export interface Tile {
	game_id: BigNumberish;
	position: Vec2;
	layer: BigNumberish;
	tile_type: TileTypeEnum;
	consumed: boolean;
}

// Type definition for `dojo_sheep_a_sheep::models::TileValue` struct
export interface TileValue {
	tile_type: TileTypeEnum;
	consumed: boolean;
}

// Type definition for `dojo_sheep_a_sheep::models::Vec2` struct
export interface Vec2 {
	x: BigNumberish;
	y: BigNumberish;
}

// Type definition for `dojo_sheep_a_sheep::systems::actions::actions::GameFinished` struct
export interface GameFinished {
	player: string;
	game_id: BigNumberish;
	final_state: GameStateEnum;
	final_score: BigNumberish;
	completion_time: BigNumberish;
}

// Type definition for `dojo_sheep_a_sheep::systems::actions::actions::GameFinishedValue` struct
export interface GameFinishedValue {
	game_id: BigNumberish;
	final_state: GameStateEnum;
	final_score: BigNumberish;
	completion_time: BigNumberish;
}

// Type definition for `dojo_sheep_a_sheep::systems::actions::actions::GameStarted` struct
export interface GameStarted {
	player: string;
	game_id: BigNumberish;
	timestamp: BigNumberish;
}

// Type definition for `dojo_sheep_a_sheep::systems::actions::actions::GameStartedValue` struct
export interface GameStartedValue {
	game_id: BigNumberish;
	timestamp: BigNumberish;
}

// Type definition for `dojo_sheep_a_sheep::systems::actions::actions::MatchFound` struct
export interface MatchFound {
	player: string;
	game_id: BigNumberish;
	tile_type: TileTypeEnum;
	score_earned: BigNumberish;
}

// Type definition for `dojo_sheep_a_sheep::systems::actions::actions::MatchFoundValue` struct
export interface MatchFoundValue {
	game_id: BigNumberish;
	tile_type: TileTypeEnum;
	score_earned: BigNumberish;
}

// Type definition for `dojo_sheep_a_sheep::systems::actions::actions::TileSelected` struct
export interface TileSelected {
	player: string;
	game_id: BigNumberish;
	position: Vec2;
	layer: BigNumberish;
	tile_type: TileTypeEnum;
}

// Type definition for `dojo_sheep_a_sheep::systems::actions::actions::TileSelectedValue` struct
export interface TileSelectedValue {
	game_id: BigNumberish;
	position: Vec2;
	layer: BigNumberish;
	tile_type: TileTypeEnum;
}

// Type definition for `dojo_sheep_a_sheep::models::GameState` enum
export const gameState = [
	'NotStarted',
	'InProgress',
	'Won',
	'Lost',
	'Paused',
] as const;
export type GameState = { [key in typeof gameState[number]]: string };
export type GameStateEnum = CairoCustomEnum;

// Type definition for `dojo_sheep_a_sheep::models::TileType` enum
export const tileType = [
	'Sheep',
	'Wolf',
	'Grass',
	'Flower',
	'Carrot',
	'Bone',
	'Corn',
	'Tool',
	'Bucket',
	'Wood',
	'Glove',
	'Cabbage',
	'Apple',
	'Strawberry',
	'Pumpkin',
	'Cherry',
	'Empty',
] as const;
export type TileType = { [key in typeof tileType[number]]: string };
export type TileTypeEnum = CairoCustomEnum;

export interface SchemaType extends ISchemaType {
	dojo_sheep_a_sheep: {
		Game: Game,
		GameValue: GameValue,
		PlayerInventory: PlayerInventory,
		PlayerInventoryValue: PlayerInventoryValue,
		Tile: Tile,
		TileValue: TileValue,
		Vec2: Vec2,
		GameFinished: GameFinished,
		GameFinishedValue: GameFinishedValue,
		GameStarted: GameStarted,
		GameStartedValue: GameStartedValue,
		MatchFound: MatchFound,
		MatchFoundValue: MatchFoundValue,
		TileSelected: TileSelected,
		TileSelectedValue: TileSelectedValue,
	},
}
export const schema: SchemaType = {
	dojo_sheep_a_sheep: {
		Game: {
			game_id: 0,
			player: "",
		state: new CairoCustomEnum({ 
					NotStarted: "",
				InProgress: undefined,
				Won: undefined,
				Lost: undefined,
				Paused: undefined, }),
			score: 0,
			moves_used: 0,
			start_time: 0,
			end_time: 0,
			board_width: 0,
			board_height: 0,
			max_layers: 0,
			total_tiles: 0,
			remaining_tiles: 0,
		},
		GameValue: {
			player: "",
		state: new CairoCustomEnum({ 
					NotStarted: "",
				InProgress: undefined,
				Won: undefined,
				Lost: undefined,
				Paused: undefined, }),
			score: 0,
			moves_used: 0,
			start_time: 0,
			end_time: 0,
			board_width: 0,
			board_height: 0,
			max_layers: 0,
			total_tiles: 0,
			remaining_tiles: 0,
		},
		PlayerInventory: {
			game_id: 0,
			slots: [0],
		},
		PlayerInventoryValue: {
			slots: [0],
		},
		Tile: {
			game_id: 0,
		position: { x: 0, y: 0, },
			layer: 0,
		tile_type: new CairoCustomEnum({ 
					Sheep: "",
				Wolf: undefined,
				Grass: undefined,
				Flower: undefined,
				Carrot: undefined,
				Bone: undefined,
				Corn: undefined,
				Tool: undefined,
				Bucket: undefined,
				Wood: undefined,
				Glove: undefined,
				Cabbage: undefined,
				Apple: undefined,
				Strawberry: undefined,
				Pumpkin: undefined,
				Cherry: undefined,
				Empty: undefined, }),
			consumed: false,
		},
		TileValue: {
		tile_type: new CairoCustomEnum({ 
					Sheep: "",
				Wolf: undefined,
				Grass: undefined,
				Flower: undefined,
				Carrot: undefined,
				Bone: undefined,
				Corn: undefined,
				Tool: undefined,
				Bucket: undefined,
				Wood: undefined,
				Glove: undefined,
				Cabbage: undefined,
				Apple: undefined,
				Strawberry: undefined,
				Pumpkin: undefined,
				Cherry: undefined,
				Empty: undefined, }),
			consumed: false,
		},
		Vec2: {
			x: 0,
			y: 0,
		},
		GameFinished: {
			player: "",
			game_id: 0,
		final_state: new CairoCustomEnum({ 
					NotStarted: "",
				InProgress: undefined,
				Won: undefined,
				Lost: undefined,
				Paused: undefined, }),
			final_score: 0,
			completion_time: 0,
		},
		GameFinishedValue: {
			game_id: 0,
		final_state: new CairoCustomEnum({ 
					NotStarted: "",
				InProgress: undefined,
				Won: undefined,
				Lost: undefined,
				Paused: undefined, }),
			final_score: 0,
			completion_time: 0,
		},
		GameStarted: {
			player: "",
			game_id: 0,
			timestamp: 0,
		},
		GameStartedValue: {
			game_id: 0,
			timestamp: 0,
		},
		MatchFound: {
			player: "",
			game_id: 0,
		tile_type: new CairoCustomEnum({ 
					Sheep: "",
				Wolf: undefined,
				Grass: undefined,
				Flower: undefined,
				Carrot: undefined,
				Bone: undefined,
				Corn: undefined,
				Tool: undefined,
				Bucket: undefined,
				Wood: undefined,
				Glove: undefined,
				Cabbage: undefined,
				Apple: undefined,
				Strawberry: undefined,
				Pumpkin: undefined,
				Cherry: undefined,
				Empty: undefined, }),
			score_earned: 0,
		},
		MatchFoundValue: {
			game_id: 0,
		tile_type: new CairoCustomEnum({ 
					Sheep: "",
				Wolf: undefined,
				Grass: undefined,
				Flower: undefined,
				Carrot: undefined,
				Bone: undefined,
				Corn: undefined,
				Tool: undefined,
				Bucket: undefined,
				Wood: undefined,
				Glove: undefined,
				Cabbage: undefined,
				Apple: undefined,
				Strawberry: undefined,
				Pumpkin: undefined,
				Cherry: undefined,
				Empty: undefined, }),
			score_earned: 0,
		},
		TileSelected: {
			player: "",
			game_id: 0,
		position: { x: 0, y: 0, },
			layer: 0,
		tile_type: new CairoCustomEnum({ 
					Sheep: "",
				Wolf: undefined,
				Grass: undefined,
				Flower: undefined,
				Carrot: undefined,
				Bone: undefined,
				Corn: undefined,
				Tool: undefined,
				Bucket: undefined,
				Wood: undefined,
				Glove: undefined,
				Cabbage: undefined,
				Apple: undefined,
				Strawberry: undefined,
				Pumpkin: undefined,
				Cherry: undefined,
				Empty: undefined, }),
		},
		TileSelectedValue: {
			game_id: 0,
		position: { x: 0, y: 0, },
			layer: 0,
		tile_type: new CairoCustomEnum({ 
					Sheep: "",
				Wolf: undefined,
				Grass: undefined,
				Flower: undefined,
				Carrot: undefined,
				Bone: undefined,
				Corn: undefined,
				Tool: undefined,
				Bucket: undefined,
				Wood: undefined,
				Glove: undefined,
				Cabbage: undefined,
				Apple: undefined,
				Strawberry: undefined,
				Pumpkin: undefined,
				Cherry: undefined,
				Empty: undefined, }),
		},
	},
};
export enum ModelsMapping {
	Game = 'dojo_sheep_a_sheep-Game',
	GameState = 'dojo_sheep_a_sheep-GameState',
	GameValue = 'dojo_sheep_a_sheep-GameValue',
	PlayerInventory = 'dojo_sheep_a_sheep-PlayerInventory',
	PlayerInventoryValue = 'dojo_sheep_a_sheep-PlayerInventoryValue',
	Tile = 'dojo_sheep_a_sheep-Tile',
	TileType = 'dojo_sheep_a_sheep-TileType',
	TileValue = 'dojo_sheep_a_sheep-TileValue',
	Vec2 = 'dojo_sheep_a_sheep-Vec2',
	GameFinished = 'dojo_sheep_a_sheep-GameFinished',
	GameFinishedValue = 'dojo_sheep_a_sheep-GameFinishedValue',
	GameStarted = 'dojo_sheep_a_sheep-GameStarted',
	GameStartedValue = 'dojo_sheep_a_sheep-GameStartedValue',
	MatchFound = 'dojo_sheep_a_sheep-MatchFound',
	MatchFoundValue = 'dojo_sheep_a_sheep-MatchFoundValue',
	TileSelected = 'dojo_sheep_a_sheep-TileSelected',
	TileSelectedValue = 'dojo_sheep_a_sheep-TileSelectedValue',
}