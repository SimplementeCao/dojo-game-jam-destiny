import type { SchemaType as ISchemaType } from "@dojoengine/sdk";

import { BigNumberish } from 'starknet';

// Type definition for `destiny::models::Battle` struct
export interface Battle {
	id: BigNumberish;
	level: BigNumberish;
	player: string;
	heroes_ids: Array<BigNumberish>;
	monsters_ids: Array<BigNumberish>;
	is_finished: boolean;
}

// Type definition for `destiny::models::Character` struct
export interface Character {
	id: BigNumberish;
	name: string;
	skills: Array<BigNumberish>;
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

// Type definition for `destiny::models::CurrentBattle` struct
export interface CurrentBattle {
	player: string;
	battle_id: BigNumberish;
}

// Type definition for `destiny::models::Destiny` struct
export interface Destiny {
	key: BigNumberish;
	total_battles: BigNumberish;
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

// Type definition for `destiny::models::BattleCreatedEvent` struct
export interface BattleCreatedEvent {
	player: string;
	id: BigNumberish;
}

// Type definition for `destiny::models::BuffEvent` struct
export interface BuffEvent {
	battle_id: BigNumberish;
	from_idx: BigNumberish;
	to_idx: BigNumberish;
	buff_id: BigNumberish;
	amount: BigNumberish;
}

// Type definition for `destiny::models::DamageEvent` struct
export interface DamageEvent {
	battle_id: BigNumberish;
	from_idx: BigNumberish;
	to_idx: BigNumberish;
	critical_hit: boolean;
	damage: BigNumberish;
}

// Type definition for `destiny::models::DebuffEvent` struct
export interface DebuffEvent {
	battle_id: BigNumberish;
	from_idx: BigNumberish;
	to_idx: BigNumberish;
	debuff_id: BigNumberish;
	amount: BigNumberish;
}

// Type definition for `destiny::models::HealEvent` struct
export interface HealEvent {
	battle_id: BigNumberish;
	from_idx: BigNumberish;
	to_idx: BigNumberish;
	amount: BigNumberish;
}

// Type definition for `destiny::models::MissEvent` struct
export interface MissEvent {
	battle_id: BigNumberish;
	from_idx: BigNumberish;
	to_idx: BigNumberish;
}

// Type definition for `destiny::models::PlayerLoseEvent` struct
export interface PlayerLoseEvent {
	battle_id: BigNumberish;
	player: string;
}

// Type definition for `destiny::models::PlayerWinEvent` struct
export interface PlayerWinEvent {
	battle_id: BigNumberish;
	player: string;
}

export interface SchemaType extends ISchemaType {
	destiny: {
		Battle: Battle,
		Character: Character,
		CharacterStatus: CharacterStatus,
		CurrentBattle: CurrentBattle,
		Destiny: Destiny,
		Progress: Progress,
		Nonce: Nonce,
		BattleCreatedEvent: BattleCreatedEvent,
		BuffEvent: BuffEvent,
		DamageEvent: DamageEvent,
		DebuffEvent: DebuffEvent,
		HealEvent: HealEvent,
		MissEvent: MissEvent,
		PlayerLoseEvent: PlayerLoseEvent,
		PlayerWinEvent: PlayerWinEvent,
	},
}
export const schema: SchemaType = {
	destiny: {
		Battle: {
			id: 0,
			level: 0,
			player: "",
			heroes_ids: [0],
			monsters_ids: [0],
			is_finished: false,
		},
		Character: {
			id: 0,
		name: "",
			skills: [0],
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
		CurrentBattle: {
			player: "",
			battle_id: 0,
		},
		Destiny: {
			key: 0,
			total_battles: 0,
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
		BattleCreatedEvent: {
			player: "",
			id: 0,
		},
		BuffEvent: {
			battle_id: 0,
			from_idx: 0,
			to_idx: 0,
			buff_id: 0,
			amount: 0,
		},
		DamageEvent: {
			battle_id: 0,
			from_idx: 0,
			to_idx: 0,
			critical_hit: false,
			damage: 0,
		},
		DebuffEvent: {
			battle_id: 0,
			from_idx: 0,
			to_idx: 0,
			debuff_id: 0,
			amount: 0,
		},
		HealEvent: {
			battle_id: 0,
			from_idx: 0,
			to_idx: 0,
			amount: 0,
		},
		MissEvent: {
			battle_id: 0,
			from_idx: 0,
			to_idx: 0,
		},
		PlayerLoseEvent: {
			battle_id: 0,
			player: "",
		},
		PlayerWinEvent: {
			battle_id: 0,
			player: "",
		},
	},
};
export enum ModelsMapping {
	Battle = 'destiny-Battle',
	Character = 'destiny-Character',
	CharacterStatus = 'destiny-CharacterStatus',
	CurrentBattle = 'destiny-CurrentBattle',
	Destiny = 'destiny-Destiny',
	Progress = 'destiny-Progress',
	Nonce = 'destiny-Nonce',
	BattleCreatedEvent = 'destiny-BattleCreatedEvent',
	BuffEvent = 'destiny-BuffEvent',
	DamageEvent = 'destiny-DamageEvent',
	DebuffEvent = 'destiny-DebuffEvent',
	HealEvent = 'destiny-HealEvent',
	MissEvent = 'destiny-MissEvent',
	PlayerLoseEvent = 'destiny-PlayerLoseEvent',
	PlayerWinEvent = 'destiny-PlayerWinEvent',
}