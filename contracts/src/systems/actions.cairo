use starknet::ContractAddress;
use crate::models::Battle;

#[starknet::interface]
pub trait IActions<T> {
    fn get_player_battle(self: @T, player: ContractAddress) -> Battle;
    fn get_hero_skills(self: @T, hero_id: u32) -> Span<u32>;
    fn get_monster_skills(self: @T, monster_id: u32) -> Span<u32>;
    fn start_battle(ref self: T, level: u32);
    fn play(ref self: T, actions: Span<(u32, u32, u32)>);
}


#[dojo::contract]
pub mod actions {
    use dojo::event::EventStorage;
    use dojo::model::ModelStorage;
    use dojo::world::WorldStorage;
    use starknet::{ContractAddress, get_caller_address};
    use crate::models::{
        Battle, BattleCreatedEvent, BuffEvent, Character, CharacterStatus, CurrentBattle,
        DamageEvent, DebuffEvent, Destiny, HealEvent, MissEvent, PlayerLoseEvent, PlayerWinEvent,
    };
    use crate::random::{Random, RandomTrait};

    fn dojo_init(ref self: ContractState) {
        let mut world = self.world_default();
        world.write_model(@Destiny { key: 1, total_battles: 0 });

        world
            .write_model(
                @Character {
                    id: 1,
                    name: "Aloy",
                    skills: [POWER_ATTACK_ACTION_ID, BUFF_EVASION_ACTION_ID, BUFF_ATTACK_ACTION_ID]
                        .span(),
                    health: 200,
                    attack: 20,
                    defense: 25,
                    critical_chance: 25,
                    evasion: 15,
                },
            );

        world
            .write_model(
                @Character {
                    id: 2,
                    name: "Amber",
                    skills: [BASIC_ATTACK_ACTION_ID, FLAME_ATTACK_ACTION_ID, MASS_HEAL_ACTION_ID]
                        .span(),
                    health: 150,
                    attack: 15,
                    defense: 15,
                    critical_chance: 15,
                    evasion: 15,
                },
            );

        world
            .write_model(
                @Character {
                    id: 3,
                    name: "Ganyu",
                    skills: [
                        FLAME_ATTACK_ACTION_ID, DEBUFF_DEFENSE_ACTION_ID,
                        BUFF_CRITICAL_CHANCE_ACTION_ID,
                    ]
                        .span(),
                    health: 180,
                    attack: 20,
                    defense: 20,
                    critical_chance: 20,
                    evasion: 20,
                },
            );

        world
            .write_model(
                @Character {
                    id: 4,
                    name: "Skeleton",
                    skills: [BASIC_ATTACK_ACTION_ID, BUFF_CRITICAL_CHANCE_ACTION_ID].span(),
                    health: 100,
                    attack: 15,
                    defense: 10,
                    critical_chance: 10,
                    evasion: 10,
                },
            );

        world
            .write_model(
                @Character {
                    id: 5,
                    name: "Assassin",
                    skills: [POWER_ATTACK_ACTION_ID, DEBUFF_DEFENSE_ACTION_ID].span(),
                    health: 70,
                    attack: 10,
                    defense: 15,
                    critical_chance: 25,
                    evasion: 25,
                },
            );

        world
            .write_model(
                @Character {
                    id: 6,
                    name: "Overlord",
                    skills: [
                        FLAME_ATTACK_ACTION_ID, DEBUFF_ATTACK_ACTION_ID,
                        DEBUFF_CRITICAL_CHANCE_ACTION_ID, DEBUFF_DEFENSE_ACTION_ID,
                        DEBUFF_EVASION_ACTION_ID,
                    ]
                        .span(),
                    health: 100,
                    attack: 25,
                    defense: 25,
                    critical_chance: 5,
                    evasion: 10,
                },
            );

        world
            .write_model(
                @Character {
                    id: 7,
                    name: "Ornstein",
                    skills: [
                        BASIC_ATTACK_ACTION_ID, POWER_ATTACK_ACTION_ID, FLAME_ATTACK_ACTION_ID,
                        DEBUFF_DEFENSE_ACTION_ID,
                    ]
                        .span(),
                    health: 180,
                    attack: 30,
                    defense: 20,
                    critical_chance: 10,
                    evasion: 10,
                },
            );
    }


    #[abi(embed_v0)]
    impl ActionsImpl of super::IActions<ContractState> {
        fn start_battle(ref self: ContractState, level: u32) {
            let mut world = self.world_default();

            let mut destiny: Destiny = world.read_model(1_u32);
            destiny.total_battles += 1;
            world.write_model(@destiny);

            let heroes_ids = self.set_battle_heroes(destiny.total_battles, level);
            let monsters_ids = self.set_battle_monsters(destiny.total_battles, level);

            world
                .write_model(
                    @CurrentBattle {
                        player: starknet::get_caller_address(), battle_id: destiny.total_battles,
                    },
                );

            world
                .write_model(
                    @Battle {
                        id: destiny.total_battles,
                        level,
                        player: starknet::get_caller_address(),
                        is_finished: false,
                        heroes_ids,
                        monsters_ids,
                    },
                );

            world
                .emit_event(
                    @BattleCreatedEvent {
                        player: starknet::get_caller_address(), id: destiny.total_battles,
                    },
                );
        }

        fn play(ref self: ContractState, actions: Span<(u32, u32, u32)>) {
            let mut world = self.world_default();
            let mut random = RandomTrait::new();
            let current_battle: CurrentBattle = world.read_model(get_caller_address());
            let battle_id = current_battle.battle_id;
            let battle: Battle = world.read_model(current_battle.battle_id);
            let mut is_finished = false;

            for action in actions {
                let (hero_index, monster_index, action_id) = *action;
                self
                    .do_action(
                        ref world,
                        ref random,
                        battle_id,
                        hero_index,
                        monster_index,
                        action_id,
                        is_monster_attack: false,
                    );
            }

            let mut monsters_alive_ids = array![];
            for monster_id in battle.monsters_ids {
                let monster_status: CharacterStatus = world.read_model((battle_id, *monster_id));
                if monster_status.current_hp > 0 {
                    monsters_alive_ids.append(*monster_id);
                }
            }

            if monsters_alive_ids.is_empty() {
                world.emit_event(@PlayerWinEvent { battle_id, player: battle.player });
                world.write_model(@CurrentBattle { player: battle.player, battle_id: 0 });
                is_finished = true;
            }

            if !is_finished {
                let mut enemy_actions: Array<(u32, u32, u32)> = array![];
                let mut monster_index = 0;
                for monster_id in monsters_alive_ids.clone() {
                    let monster: Character = world.read_model(monster_id);
                    let skill_id = random
                        .between(0, (monster.skills.len() - 1).try_into().unwrap())
                        .try_into()
                        .unwrap();

                    if is_attack_action(skill_id) {
                        let target_index = random
                            .between(0, (battle.heroes_ids.len() - 1).try_into().unwrap())
                            .try_into()
                            .unwrap();
                        enemy_actions.append((monster_index, target_index, skill_id));
                    } else if is_heal_action(skill_id) {
                        let target_index = random
                            .between(0, (battle.monsters_ids.len() - 1).try_into().unwrap())
                            .try_into()
                            .unwrap();
                        enemy_actions.append((monster_index, target_index, skill_id));
                    } else if is_buff_action(skill_id) {
                        let target_index = random
                            .between(0, (battle.monsters_ids.len() - 1).try_into().unwrap())
                            .try_into()
                            .unwrap();
                        enemy_actions.append((monster_index, target_index, skill_id));
                    } else if is_debuff_action(skill_id) {
                        let target_index = random
                            .between(0, (battle.heroes_ids.len() - 1).try_into().unwrap())
                            .try_into()
                            .unwrap();
                        enemy_actions.append((monster_index, target_index, skill_id));
                    } else {}
                    monster_index += 1;
                }

                for action in enemy_actions {
                    let (monster_index, hero_index, action_id) = action;
                    self
                        .do_action(
                            ref world,
                            ref random,
                            battle_id,
                            monster_index,
                            hero_index,
                            action_id,
                            true,
                        );
                }

                let mut heroes_alive_ids = array![];
                for hero_id in battle.heroes_ids {
                    let hero_status: CharacterStatus = world.read_model((battle_id, *hero_id));
                    if hero_status.current_hp > 0 {
                        heroes_alive_ids.append(*hero_id);
                    }
                }

                if heroes_alive_ids.is_empty() {
                    world.emit_event(@PlayerLoseEvent { battle_id, player: battle.player });
                    world.write_model(@CurrentBattle { player: battle.player, battle_id: 0 });
                    is_finished = true;
                }

                world
                    .write_model(
                        @Battle {
                            id: battle_id,
                            level: battle.level,
                            player: battle.player,
                            heroes_ids: heroes_alive_ids.span(),
                            monsters_ids: monsters_alive_ids.span(),
                            is_finished,
                        },
                    );
            } else {
                world
                    .write_model(
                        @Battle {
                            id: battle_id,
                            level: battle.level,
                            player: battle.player,
                            heroes_ids: battle.heroes_ids,
                            monsters_ids: monsters_alive_ids.span(),
                            is_finished,
                        },
                    );
            }
        }

        fn get_player_battle(self: @ContractState, player: ContractAddress) -> Battle {
            let mut world = self.world_default();
            let current_battle: CurrentBattle = world.read_model(player);
            world.read_model(current_battle.battle_id)
        }

        fn get_hero_skills(self: @ContractState, hero_id: u32) -> Span<u32> {
            let mut world = self.world_default();
            let hero: Character = world.read_model(hero_id);
            hero.skills
        }

        fn get_monster_skills(self: @ContractState, monster_id: u32) -> Span<u32> {
            let mut world = self.world_default();
            let monster: Character = world.read_model(monster_id);
            monster.skills
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> WorldStorage {
            self.world(@"destiny4")
        }

        fn do_action(
            ref self: ContractState,
            ref world: WorldStorage,
            ref random: Random,
            battle_id: u32,
            from_idx: u32,
            to_idx: u32,
            action_id: u32,
            is_monster_attack: bool,
        ) {
            let battle: Battle = world.read_model(battle_id);
            let mut from_status: CharacterStatus = if is_monster_attack {
                world.read_model((battle_id, *battle.monsters_ids[from_idx]))
            } else {
                world.read_model((battle_id, *battle.heroes_ids[from_idx]))
            };

            let mut to_status: CharacterStatus = if is_monster_attack {
                world.read_model((battle_id, *battle.heroes_ids[to_idx]))
            } else {
                world.read_model((battle_id, *battle.monsters_ids[to_idx]))
            };

            if is_attack_action(action_id) {
                let miss = random.between(0, 100) < (to_status.evasion).try_into().unwrap();
                if miss {
                    world.emit_event(@MissEvent { battle_id, from_idx, to_idx, is_monster: is_monster_attack });
                    return;
                }

                let mut damage = if action_id == BASIC_ATTACK_ACTION_ID {
                    from_status.attack + 10
                } else if action_id == POWER_ATTACK_ACTION_ID {
                    from_status.attack + 25
                } else if action_id == FLAME_ATTACK_ACTION_ID {
                    from_status.attack + 30
                } else {
                    0
                };
                damage = damage
                    + random
                        .between(0, (from_status.attack / 2).try_into().unwrap())
                        .try_into()
                        .unwrap();

                let critical_hit = random
                    .between(0, 100) < (25 + from_status.critical_chance)
                    .try_into()
                    .unwrap();
                if critical_hit {
                    damage = damage * 2;
                }

                to_status
                    .current_hp =
                        if damage > (to_status.current_hp + to_status.defense) {
                            0
                        } else {
                            to_status.current_hp + to_status.defense - damage
                        };
                world
                    .emit_event(@DamageEvent { battle_id, from_idx, to_idx, critical_hit, damage, is_monster: is_monster_attack });
                world.write_model(@to_status);
            } else if is_heal_action(action_id) {
                let amount = if action_id == HEAL_ACTION_ID {
                    20
                } else if action_id == MASS_HEAL_ACTION_ID {
                    30
                } else {
                    0
                };

                to_status
                    .current_hp =
                        if to_status.current_hp + amount > to_status.max_hp {
                            to_status.max_hp
                        } else {
                            to_status.current_hp + amount
                        };
                world.emit_event(@HealEvent { battle_id, from_idx, to_idx, amount, is_monster: is_monster_attack });
                world.write_model(@to_status);
            }
            if is_buff_action(action_id) {
                let amount = if action_id == BUFF_DEFENSE_ACTION_ID {
                    10
                } else if action_id == BUFF_ATTACK_ACTION_ID {
                    20
                } else if action_id == BUFF_CRITICAL_CHANCE_ACTION_ID {
                    10
                } else if action_id == BUFF_EVASION_ACTION_ID {
                    10
                } else {
                    0
                };

                if action_id == BUFF_DEFENSE_ACTION_ID {
                    to_status.defense = to_status.defense + amount;
                } else if action_id == BUFF_ATTACK_ACTION_ID {
                    to_status.attack = to_status.attack + amount;
                } else if action_id == BUFF_CRITICAL_CHANCE_ACTION_ID {
                    to_status.critical_chance = to_status.critical_chance + amount;
                } else if action_id == BUFF_EVASION_ACTION_ID {
                    to_status.evasion = to_status.evasion + amount;
                }
                world
                    .emit_event(
                        @BuffEvent { battle_id, from_idx, to_idx, buff_id: action_id, amount, is_monster: is_monster_attack },
                    );
                world.write_model(@to_status);
            } else if is_debuff_action(action_id) {
                let amount = if action_id == DEBUFF_DEFENSE_ACTION_ID {
                    10
                } else if action_id == DEBUFF_ATTACK_ACTION_ID {
                    20
                } else if action_id == DEBUFF_CRITICAL_CHANCE_ACTION_ID {
                    10
                } else if action_id == DEBUFF_EVASION_ACTION_ID {
                    10
                } else {
                    0
                };

                if action_id == DEBUFF_DEFENSE_ACTION_ID {
                    to_status.defense = to_status.defense - amount;
                } else if action_id == DEBUFF_ATTACK_ACTION_ID {
                    to_status.attack = to_status.attack - amount;
                } else if action_id == DEBUFF_CRITICAL_CHANCE_ACTION_ID {
                    to_status.critical_chance = to_status.critical_chance - amount;
                } else if action_id == DEBUFF_EVASION_ACTION_ID {
                    to_status.evasion = to_status.evasion - amount;
                }
                world
                    .emit_event(
                        @DebuffEvent { battle_id, from_idx, to_idx, debuff_id: action_id, amount, is_monster: is_monster_attack },
                    );
                world.write_model(@to_status);
            }
        }

        fn set_battle_heroes(ref self: ContractState, battle_id: u32, level: u32) -> Span<u32> {
            let mut world = self.world_default();
            let heroes_ids = if level == 1 {
                [1, 2].span()
            } else if level == 2 {
                [1, 2, 3].span()
            } else if level == 3 {
                [1, 2, 3].span()
            } else {
                [].span()
            };

            for hero_id in heroes_ids {
                let hero: Character = world.read_model(*hero_id);
                world
                    .write_model(
                        @CharacterStatus {
                            battle_id: battle_id,
                            character_id: hero.id,
                            current_hp: hero.health,
                            max_hp: hero.health,
                            attack: hero.attack,
                            defense: hero.defense,
                            critical_chance: hero.critical_chance,
                            evasion: hero.evasion,
                        },
                    );
            }
            heroes_ids
        }

        fn set_battle_monsters(ref self: ContractState, battle_id: u32, level: u32) -> Span<u32> {
            let mut world = self.world_default();
            let monsters_ids = if level == 1 {
                [4, 5].span()
            } else if level == 2 {
                [4, 5, 6].span()
            } else if level == 3 {
                [5, 7, 6].span()
            } else {
                [].span()
            };

            for monster_id in monsters_ids {
                let monster: Character = world.read_model(*monster_id);
                world
                    .write_model(
                        @CharacterStatus {
                            battle_id: battle_id,
                            character_id: monster.id,
                            current_hp: monster.health,
                            max_hp: monster.health,
                            attack: monster.attack,
                            defense: monster.defense,
                            critical_chance: monster.critical_chance,
                            evasion: monster.evasion,
                        },
                    );
            }
            monsters_ids
        }
    }

    // Constants
    const BASIC_ATTACK_ACTION_ID: u32 = 1;
    const POWER_ATTACK_ACTION_ID: u32 = 2;
    const FLAME_ATTACK_ACTION_ID: u32 = 3;

    const HEAL_ACTION_ID: u32 = 11;
    const MASS_HEAL_ACTION_ID: u32 = 12;

    const BUFF_DEFENSE_ACTION_ID: u32 = 21;
    const BUFF_ATTACK_ACTION_ID: u32 = 22;
    const BUFF_CRITICAL_CHANCE_ACTION_ID: u32 = 23;
    const BUFF_EVASION_ACTION_ID: u32 = 24;

    const DEBUFF_DEFENSE_ACTION_ID: u32 = 31;
    const DEBUFF_ATTACK_ACTION_ID: u32 = 32;
    const DEBUFF_CRITICAL_CHANCE_ACTION_ID: u32 = 33;
    const DEBUFF_EVASION_ACTION_ID: u32 = 34;

    fn is_attack_action(action_id: u32) -> bool {
        action_id == BASIC_ATTACK_ACTION_ID
            || action_id == POWER_ATTACK_ACTION_ID
            || action_id == FLAME_ATTACK_ACTION_ID
    }

    fn is_heal_action(action_id: u32) -> bool {
        action_id == HEAL_ACTION_ID || action_id == MASS_HEAL_ACTION_ID
    }

    fn is_buff_action(action_id: u32) -> bool {
        action_id == BUFF_DEFENSE_ACTION_ID
            || action_id == BUFF_ATTACK_ACTION_ID
            || action_id == BUFF_CRITICAL_CHANCE_ACTION_ID
            || action_id == BUFF_EVASION_ACTION_ID
    }

    fn is_debuff_action(action_id: u32) -> bool {
        action_id == DEBUFF_DEFENSE_ACTION_ID
            || action_id == DEBUFF_ATTACK_ACTION_ID
            || action_id == DEBUFF_CRITICAL_CHANCE_ACTION_ID
            || action_id == DEBUFF_EVASION_ACTION_ID
    }
}
