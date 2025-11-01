#[starknet::interface]
pub trait IActions<T> {
    fn start_battle(ref self: T, level: u32);
    fn play(ref self: T, battle_id: u32, actions: Span<(u32, u32, u32)>);
}

#[dojo::contract]
pub mod actions {
    use dojo::event::EventStorage;
    use dojo::model::ModelStorage;
    use dojo::world::WorldStorage;
    use crate::models::{
        Battle, BuffEvent, Character, CharacterStatus, DamageEvent, DebuffEvent, Destiny, HealEvent,
        MissEvent, PlayerLoseEvent, PlayerWinEvent,
    };
    use crate::random::{Random, RandomTrait};

    #[abi(embed_v0)]
    impl ActionsImpl of super::IActions<ContractState> {
        fn start_battle(ref self: ContractState, level: u32) {
            let mut world = self.world_default();

            let mut destiny: Destiny = world.read_model(1_u32);
            destiny.total_battles += 1;
            world.write_model(@destiny);

            let heroes_indexes = self.set_battle_heroes(destiny.total_battles, level);
            let monsters_indexes = self.set_battle_monsters(destiny.total_battles, level);

            world
                .write_model(
                    @Battle {
                        id: destiny.total_battles,
                        level,
                        player: starknet::get_caller_address(),
                        is_finished: false,
                        heroes_indexes,
                        monsters_indexes,
                    },
                );
        }

        fn play(ref self: ContractState, battle_id: u32, actions: Span<(u32, u32, u32)>) {
            let mut world = self.world_default();
            let mut random = RandomTrait::new();
            let battle: Battle = world.read_model(battle_id);

            for action in actions {
                let (hero_index, monster_index, action_id) = *action;
                self
                    .do_action(
                        ref world, ref random, battle_id, hero_index, monster_index, action_id,
                    );
            }

            let mut monsters_alive_indexes = array![];
            for monster_index in battle.monsters_indexes {
                let monster_status: CharacterStatus = world.read_model((battle_id, *monster_index));
                if monster_status.health > 0 {
                    monsters_alive_indexes.append(*monster_index);
                }
            }

            if monsters_alive_indexes.is_empty() {
                world.emit_event(@PlayerWinEvent { battle_id, player: battle.player });
                return;
            }

            let mut enemy_actions: Array<(u32, u32, u32)> = array![];
            for monster_index in monsters_alive_indexes {
                let monster: Character = world.read_model(monster_index);
                let skill_id = random
                    .between(0, (monster.skills.len() - 1).try_into().unwrap())
                    .try_into()
                    .unwrap();
                if is_attack_action(skill_id) {
                    let target_index = random
                        .between(0, (battle.heroes_indexes.len() - 1).try_into().unwrap())
                        .try_into()
                        .unwrap();
                    enemy_actions.append((monster_index, target_index, skill_id));
                } else if is_heal_action(skill_id) {
                    let target_index = random
                        .between(0, (battle.monsters_indexes.len() - 1).try_into().unwrap())
                        .try_into()
                        .unwrap();
                    enemy_actions.append((monster_index, target_index, skill_id));
                } else if is_buff_action(skill_id) {
                    let target_index = random
                        .between(0, (battle.monsters_indexes.len() - 1).try_into().unwrap())
                        .try_into()
                        .unwrap();
                    enemy_actions.append((monster_index, target_index, skill_id));
                } else if is_debuff_action(skill_id) {
                    let target_index = random
                        .between(0, (battle.heroes_indexes.len() - 1).try_into().unwrap())
                        .try_into()
                        .unwrap();
                    enemy_actions.append((monster_index, target_index, skill_id));
                } else {}
            }

            for action in enemy_actions {
                let (monster_index, hero_index, action_id) = action;
                self
                    .do_action(
                        ref world, ref random, battle_id, monster_index, hero_index, action_id,
                    );
            }

            let mut heroes_alive_indexes = array![];
            for hero_index in battle.heroes_indexes {
                let hero_status: CharacterStatus = world.read_model((battle_id, *hero_index));
                if hero_status.health > 0 {
                    heroes_alive_indexes.append(hero_index);
                }
            }

            if heroes_alive_indexes.is_empty() {
                world.emit_event(@PlayerLoseEvent { battle_id, player: battle.player });
                return;
            }
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> WorldStorage {
            self.world(@"destiny")
        }

        fn do_action(
            ref self: ContractState,
            ref world: WorldStorage,
            ref random: Random,
            battle_id: u32,
            from_idx: u32,
            to_idx: u32,
            action_id: u32,
        ) {
            let mut from_status: CharacterStatus = world.read_model((battle_id, from_idx));
            let mut to_status: CharacterStatus = world.read_model((battle_id, to_idx));

            if is_attack_action(action_id) {
                let miss = random.between(0, 100) < (to_status.evasion).try_into().unwrap();
                if miss {
                    world.emit_event(@MissEvent { battle_id, from_idx, to_idx });
                    return;
                }

                let mut damage = if action_id == BASIC_ATTACK_ACTION_ID {
                    from_status.attack + 10
                } else if action_id == POWER_ATTACK_ACTION_ID {
                    from_status.attack + 20
                } else if action_id == FLAME_ATTACK_ACTION_ID {
                    from_status.attack + 30
                } else {
                    0
                };

                let critical_hit = random
                    .between(0, 100) < (25 + from_status.critical_chance)
                    .try_into()
                    .unwrap();
                if critical_hit {
                    damage = damage * 2;
                }

                to_status
                    .health =
                        if damage > (to_status.health + to_status.defense) {
                            0
                        } else {
                            to_status.health + to_status.defense - damage
                        };
                world
                    .emit_event(@DamageEvent { battle_id, from_idx, to_idx, critical_hit, damage });
                world.write_model(@to_status);
            } else if is_heal_action(action_id) {
                let amount = if action_id == HEAL_ACTION_ID {
                    20
                } else if action_id == MASS_HEAL_ACTION_ID {
                    30
                } else {
                    0
                };

                let character: Character = world.read_model(to_status.character_id);
                to_status
                    .health =
                        if to_status.health + amount > character.health {
                            character.health
                        } else {
                            to_status.health + amount
                        };
                world.emit_event(@HealEvent { battle_id, from_idx, to_idx, amount });
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
                        @BuffEvent { battle_id, from_idx, to_idx, buff_id: action_id, amount },
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
                        @DebuffEvent { battle_id, from_idx, to_idx, debuff_id: action_id, amount },
                    );
                world.write_model(@to_status);
            }
        }

        fn set_battle_heroes(ref self: ContractState, battle_id: u32, level: u32) -> Span<u32> {
            let mut world = self.world_default();
            let heroes_indexes = if level == 1 {
                [0, 1].span()
            } else if level == 2 {
                [0, 1, 2].span()
            } else if level == 3 {
                [0, 1, 2].span()
            } else {
                [].span()
            };

            for hero_index in heroes_indexes {
                let hero: Character = world.read_model(*hero_index);
                world
                    .write_model(
                        @CharacterStatus {
                            battle_id: battle_id,
                            character_index: *hero_index,
                            character_id: hero.id,
                            health: hero.health,
                            attack: hero.attack,
                            defense: hero.defense,
                            critical_chance: hero.critical_chance,
                            evasion: hero.evasion,
                        },
                    );
            }
            heroes_indexes
        }

        fn set_battle_monsters(ref self: ContractState, battle_id: u32, level: u32) -> Span<u32> {
            let mut world = self.world_default();
            let monsters_indexes = if level == 1 {
                [0, 1].span()
            } else if level == 2 {
                [0, 1, 2].span()
            } else if level == 3 {
                [0, 1, 2].span()
            } else {
                [].span()
            };

            for monster_index in monsters_indexes {
                let monster: Character = world.read_model(*monster_index + 10);
                world
                    .write_model(
                        @CharacterStatus {
                            battle_id: battle_id,
                            character_index: *monster_index,
                            character_id: monster.id,
                            health: monster.health,
                            attack: monster.attack,
                            defense: monster.defense,
                            critical_chance: monster.critical_chance,
                            evasion: monster.evasion,
                        },
                    );
            }
            monsters_indexes
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
