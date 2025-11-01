import type { SchemaType as ISchemaType } from "@dojoengine/sdk";

import { BigNumberish } from 'starknet';

// Type definition for `destiny::models::Character` struct
export interface Character {
	id: BigNumberish;
	name: string;
	health: BigNumberish;
	attack: BigNumberish;
	defense: BigNumberish;
	critical_chance: BigNumberish;
	evasion: BigNumberish;
}

// Type definition for `destiny::models::CharacterStatus` struct
export interface CharacterStatus {
	battle_id: BigNumberish;
	character_id: BigNumberish;
	health: BigNumberish;
	attack: BigNumberish;
	defense: BigNumberish;
	critical_chance: BigNumberish;
	evasion: BigNumberish;
}

// Type definition for `destiny::models::Example` struct
export interface Example {
	id: BigNumberish;
	value: BigNumberish;
}

// Type definition for `destiny::models::Progress` struct
export interface Progress {
	player: BigNumberish;
	level: BigNumberish;
	completed: boolean;
}

// Type definition for `destiny::random::Nonce` struct
export interface Nonce {
	key: BigNumberish;
	value: BigNumberish;
}

// Type definition for `destiny::systems::actions::actions::ExampleEvent` struct
export interface ExampleEvent {
	player: string;
	value: BigNumberish;
}

export interface SchemaType extends ISchemaType {
	destiny: {
		Character: Character,
		CharacterStatus: CharacterStatus,
		Example: Example,
		Progress: Progress,
		Nonce: Nonce,
		ExampleEvent: ExampleEvent,
	},
}
export const schema: SchemaType = {
	destiny: {
		Character: {
			id: 0,
		name: "",
			health: 0,
			attack: 0,
			defense: 0,
			critical_chance: 0,
			evasion: 0,
		},
		CharacterStatus: {
			battle_id: 0,
			character_id: 0,
			health: 0,
			attack: 0,
			defense: 0,
			critical_chance: 0,
			evasion: 0,
		},
		Example: {
			id: 0,
			value: 0,
		},
		Progress: {
			player: 0,
			level: 0,
			completed: false,
		},
		Nonce: {
			key: 0,
			value: 0,
		},
		ExampleEvent: {
			player: "",
			value: 0,
		},
	},
};
export enum ModelsMapping {
	Character = 'destiny-Character',
	CharacterStatus = 'destiny-CharacterStatus',
	Example = 'destiny-Example',
	Progress = 'destiny-Progress',
	Nonce = 'destiny-Nonce',
	ExampleEvent = 'destiny-ExampleEvent',
}