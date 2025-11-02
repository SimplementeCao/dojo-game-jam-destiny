import type { SchemaType as ISchemaType } from "@dojoengine/sdk";

import { BigNumberish } from 'starknet';

// Type definition for `destiny5::models::Battle` struct
export interface Battle {
	id: BigNumberish;
	level: BigNumberish;
	player: string;
	heroes_ids: Array<BigNumberish>;
	monsters_ids: Array<BigNumberish>;
	is_finished: boolean;
}

// Type definition for `destiny5::models::Character` struct
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

// Type definition for `destiny5::models::CharacterStatus` struct
export interface CharacterStatus {
	battle_id: BigNumberish;
	character_id: BigNumberish;
	current_hp: BigNumberish;
	max_hp: BigNumberish;
	attack: BigNumberish;
	defense: BigNumberish;
	critical_chance: BigNumberish;
	evasion: BigNumberish;
}

// Type definition for `destiny5::models::CurrentBattle` struct
export interface CurrentBattle {
	player: string;
	battle_id: BigNumberish;
}

// Type definition for `destiny5::models::Destiny` struct
export interface Destiny {
	key: BigNumberish;
	total_battles: BigNumberish;
}

// Type definition for `destiny5::models::Progress` struct
export interface Progress {
	player: string;
	level: BigNumberish;
	completed: boolean;
}

// Type definition for `destiny5::random::Nonce` struct
export interface Nonce {
	key: BigNumberish;
	value: BigNumberish;
}

// Type definition for `destiny5::models::BattleCreatedEvent` struct
export interface BattleCreatedEvent {
	player: string;
	id: BigNumberish;
}

// Type definition for `destiny5::models::BuffEvent` struct
export interface BuffEvent {
	battle_id: BigNumberish;
	from_idx: BigNumberish;
	to_idx: BigNumberish;
	buff_id: BigNumberish;
	amount: BigNumberish;
	is_monster: boolean;
}

// Type definition for `destiny5::models::DamageEvent` struct
export interface DamageEvent {
	battle_id: BigNumberish;
	from_idx: BigNumberish;
	to_idx: BigNumberish;
	critical_hit: boolean;
	damage: BigNumberish;
	is_monster: boolean;
}

// Type definition for `destiny5::models::DebuffEvent` struct
export interface DebuffEvent {
	battle_id: BigNumberish;
	from_idx: BigNumberish;
	to_idx: BigNumberish;
	debuff_id: BigNumberish;
	amount: BigNumberish;
	is_monster: boolean;
}

// Type definition for `destiny5::models::HealEvent` struct
export interface HealEvent {
	battle_id: BigNumberish;
	from_idx: BigNumberish;
	to_idx: BigNumberish;
	amount: BigNumberish;
	is_monster: boolean;
}

// Type definition for `destiny5::models::MissEvent` struct
export interface MissEvent {
	battle_id: BigNumberish;
	from_idx: BigNumberish;
	to_idx: BigNumberish;
	is_monster: boolean;
}

// Type definition for `destiny5::models::PlayerLoseEvent` struct
export interface PlayerLoseEvent {
	battle_id: BigNumberish;
	player: string;
}

// Type definition for `destiny5::models::PlayerWinEvent` struct
export interface PlayerWinEvent {
	battle_id: BigNumberish;
	player: string;
}

export interface SchemaType extends ISchemaType {
	destiny5: {
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
	destiny5: {
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
			current_hp: 0,
			max_hp: 0,
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
			player: "",
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
			is_monster: false,
		},
		DamageEvent: {
			battle_id: 0,
			from_idx: 0,
			to_idx: 0,
			critical_hit: false,
			damage: 0,
			is_monster: false,
		},
		DebuffEvent: {
			battle_id: 0,
			from_idx: 0,
			to_idx: 0,
			debuff_id: 0,
			amount: 0,
			is_monster: false,
		},
		HealEvent: {
			battle_id: 0,
			from_idx: 0,
			to_idx: 0,
			amount: 0,
			is_monster: false,
		},
		MissEvent: {
			battle_id: 0,
			from_idx: 0,
			to_idx: 0,
			is_monster: false,
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
	Battle = 'destiny5-Battle',
	Character = 'destiny5-Character',
	CharacterStatus = 'destiny5-CharacterStatus',
	CurrentBattle = 'destiny5-CurrentBattle',
	Destiny = 'destiny5-Destiny',
	Progress = 'destiny5-Progress',
	Nonce = 'destiny5-Nonce',
	BattleCreatedEvent = 'destiny5-BattleCreatedEvent',
	BuffEvent = 'destiny5-BuffEvent',
	DamageEvent = 'destiny5-DamageEvent',
	DebuffEvent = 'destiny5-DebuffEvent',
	HealEvent = 'destiny5-HealEvent',
	MissEvent = 'destiny5-MissEvent',
	PlayerLoseEvent = 'destiny5-PlayerLoseEvent',
	PlayerWinEvent = 'destiny5-PlayerWinEvent',
}