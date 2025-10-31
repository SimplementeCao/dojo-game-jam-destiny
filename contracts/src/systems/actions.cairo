use dojo_sheep_a_sheep::models::Vec2;

#[starknet::interface]
pub trait ISheepASheepActions<T> {
    fn start_new_game(ref self: T) -> u32;
    fn select_tile(ref self: T, game_id: u32, position: Vec2, layer: u8);
}

#[dojo::contract]
pub mod actions {
    use super::ISheepASheepActions;
    use dojo_sheep_a_sheep::models::{
        TileType, GameState, Vec2, Tile, Game, PlayerInventory, TileTypeTrait,
    };
    use starknet::{ContractAddress, get_caller_address, get_block_timestamp};
    use dojo::model::{ModelStorage};
    use dojo::event::EventStorage;
    use dojo::world::IWorldDispatcherTrait;
    use dojo_sheep_a_sheep::random;
    use dojo_sheep_a_sheep::constants::get_vectores;

    // Constants
    const GAME_SETTINGS_ID: u32 = 999999999;
    const MAX_BOARD_WIDTH: u32 = 14; // 8 * 2 for fractional support
    const MAX_BOARD_HEIGHT: u32 = 12; // 7 * 2 for fractional support
    const MAX_LAYERS: u8 = 6;
    const DEFAULT_INVENTORY_SLOTS: u32 = 7;
    const TILES_PER_MATCH: u8 = 3;

    // Events
    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct GameStarted {
        #[key]
        pub player: ContractAddress,
        pub game_id: u32,
        pub timestamp: u64,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct TileSelected {
        #[key]
        pub player: ContractAddress,
        pub game_id: u32,
        pub position: Vec2,
        pub layer: u8,
        pub tile_type: TileType,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct MatchFound {
        #[key]
        pub player: ContractAddress,
        pub game_id: u32,
        pub tile_type: TileType,
        pub score_earned: u32,
    }

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct GameFinished {
        #[key]
        pub player: ContractAddress,
        #[key]
        pub game_id: u32,
        pub final_state: GameState,
        pub final_score: u32,
        pub completion_time: u64,
    }

    #[abi(embed_v0)]
    impl SheepASheepActionsImpl of ISheepASheepActions<ContractState> {
        fn start_new_game(ref self: ContractState) -> u32 {
            let mut world = self.world_default();
            let player = get_caller_address();
            let timestamp = get_block_timestamp();

            // Generate a unique game ID
            let game_id = world.dispatcher.uuid() + 1;

            // Create new game
            let mut game = Game {
                game_id,
                player,
                state: GameState::InProgress,
                score: 0,
                moves_used: 0,
                start_time: timestamp,
                end_time: 0,
                board_width: MAX_BOARD_WIDTH,
                board_height: MAX_BOARD_HEIGHT,
                max_layers: MAX_LAYERS,
                total_tiles: 0,
                remaining_tiles: 0,
            };

            let inventory = PlayerInventory { game_id, slots: array![] };

            game.total_tiles = 144;
            game.remaining_tiles = 144;

            world.write_model(@game);
            world.write_model(@inventory);

            let random_hash = random::get_random_hash();
            let mut seed: u128 = random::get_entropy(random_hash);

            let mut tiles_dict: Felt252Dict<u16> = Default::default();
            let mut i: u32 = 1;
            while i <= 16 {
                tiles_dict.insert(i.into(), 9);
                i += 1;
            };
            self.create_layer(ref world, game_id, 0, 19, ref seed, ref tiles_dict);
            self.create_layer(ref world, game_id, 1, 19, ref seed, ref tiles_dict);
            self.create_layer(ref world, game_id, 2, 19, ref seed, ref tiles_dict);
            self.create_layer(ref world, game_id, 3, 19, ref seed, ref tiles_dict);
            self.create_layer(ref world, game_id, 4, 19, ref seed, ref tiles_dict);
            self.create_layer(ref world, game_id, 5, 19, ref seed, ref tiles_dict);
            self
                .create_base(
                    ref world, game_id, 0, 15, Vec2 { x: 4, y: 16 }, ref seed, ref tiles_dict,
                );
            self
                .create_base(
                    ref world, game_id, 0, 15, Vec2 { x: 10, y: 16 }, ref seed, ref tiles_dict,
                );

            // world
            //     .write_model(
            //         @Tile {
            //             game_id,
            //             position: Vec2 { x: 1, y: 5 },
            //             layer: 0,
            //             tile_type: TileType::Sheep,
            //             consumed: false,
            //         },
            //     );
        
            // world
            //     .write_model(
            //         @Tile {
            //             game_id,
            //             position: Vec2 { x: 3, y: 5 },
            //             layer: 0,
            //             tile_type: TileType::Sheep,
            //             consumed: false,
            //         },
            //     );

            // world
            //     .write_model(
            //         @Tile {
            //             game_id,
            //             position: Vec2 { x: 5, y: 5 },
            //             layer: 0,
            //             tile_type: TileType::Sheep,
            //             consumed: false,
            //         },
            //     );

            world.emit_event(@GameStarted { player, game_id, timestamp });

            game_id
        }

        fn select_tile(ref self: ContractState, game_id: u32, position: Vec2, layer: u8) {
            let mut world = self.world_default();
            let player = get_caller_address();

            let mut game: Game = world.read_model(game_id);
            assert(game.state == GameState::InProgress, 'Game is not in progress');

            let mut tile: Tile = world.read_model((game_id, position, layer));
            assert(!tile.consumed, 'Tile is already consumed');

            // TODO: validar que no este tapado por otro tile

            let mut inventory: PlayerInventory = world.read_model(game_id);

            inventory.slots.append(tile.tile_type.into());

            let match_found = self.check_for_matches(ref inventory, tile.tile_type.into());

            if match_found {
                world
                    .emit_event(
                        @MatchFound {
                            player, game_id, tile_type: tile.tile_type, score_earned: 10,
                        },
                    );
            }

            tile.consumed = true;

            game.remaining_tiles -= 1;
            game.moves_used += 1;

            game.state = self.check_game_end_condition(ref world, game, ref inventory);

            world
                .emit_event(
                    @TileSelected { player, game_id, position, layer, tile_type: tile.tile_type },
                );

            if game.state == GameState::Won {
                println!("game won");
                game.end_time = get_block_timestamp() - game.start_time;
                world.emit_event(@GameFinished {
                    player,
                    game_id: game.game_id,
                    final_state: game.state,
                    final_score: game.score,
                    completion_time: game.end_time,
                });
            };

            world.write_model(@game);
            world.write_model(@inventory);
            world.write_model(@tile);
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"dojo_sheep_a_sheep")
        }

        fn check_for_matches(
            self: @ContractState, ref inventory: PlayerInventory, tile_type: u16,
        ) -> bool {
            if inventory.slots.len() < TILES_PER_MATCH.into() {
                return false;
            }

            let mut count = 0;
            let mut i = 0;

            while i < inventory.slots.len() {
                if *inventory.slots.at(i) == tile_type {
                    count += 1;
                }
                i += 1;
            };

            if count == TILES_PER_MATCH {
                // Remove matched tiles from inventory
                let mut new_slots = array![];
                let mut removed = 0;
                i = 0;

                while i < inventory.slots.len() {
                    if *inventory.slots.at(i) != tile_type {
                        new_slots.append(*inventory.slots.at(i));
                    } else {
                        removed += 1;
                    }
                    i += 1;
                };

                inventory.slots = new_slots;
                true
            } else {
                false
            }
        }

        fn check_game_end_condition(
            self: @ContractState,
            ref world: dojo::world::WorldStorage,
            game: Game,
            ref inventory: PlayerInventory,
        ) -> GameState {
            if inventory.slots.len() >= DEFAULT_INVENTORY_SLOTS {
                return GameState::Lost;
            }

            if game.remaining_tiles == 0 {
                return GameState::Won;
            }

            GameState::InProgress
        }

        fn create_layer(
            self: @ContractState,
            ref world: dojo::world::WorldStorage,
            game_id: u32,
            layer: u8,
            total_tiles: u32,
            ref seed: u128,
            ref tiles_dict: Felt252Dict<u16>,
        ) {
            let mut vectores_dict: Felt252Dict<bool> = Default::default();
            let vectores = get_vectores();
            let mut i = 0;
            while i < total_tiles {
                seed = random::LCG(seed);
                let random_index = random::get_random_number_zero_indexed(seed, vectores.len());
                let vector = *vectores.at(random_index);
                let vector_key: felt252 = (16 * vector.x + vector.y).into();
                let is_covered = vectores_dict.get(vector_key);
                if is_covered {
                    continue;
                }

                // Verificar adyacentes usando offsets con i32
                let mut ocupado = false;
                let offsets: Array<(i32, i32)> = array![
                    (-1, -1),
                    (-1, 0),
                    (-1, 1), // arriba-izq, arriba, arriba-der
                    (0, -1),
                    (0, 1), // izquierda, derecha
                    (1, -1),
                    (1, 0),
                    (1, 1) // abajo-izq, abajo, abajo-der
                ];

                let mut offset_idx = 0;
                while offset_idx < offsets.len() && !ocupado {
                    let (dx, dy) = *offsets.at(offset_idx);

                    // Convertir coordenadas u32 a i32 para hacer cálculos seguros
                    let current_x: i32 = vector.x.try_into().unwrap();
                    let current_y: i32 = vector.y.try_into().unwrap();

                    let new_x = current_x + dx;
                    let new_y = current_y + dy;

                    // Verificar que las coordenadas resultantes estén dentro de los límites
                     if new_x >= 0
                         && new_y >= 0
                         && new_x <= MAX_BOARD_WIDTH.try_into().unwrap()
                         && new_y <= MAX_BOARD_HEIGHT.try_into().unwrap() {
                        let nx: u32 = new_x.try_into().unwrap();
                        let ny: u32 = new_y.try_into().unwrap();
                        let adj_key: felt252 = (16 * nx + ny).into();

                        if vectores_dict.get(adj_key) {
                            ocupado = true;
                        }
                    }

                    offset_idx += 1;
                };

                if ocupado {
                    continue;
                }

                seed = random::LCG(seed);
                let tile_random_id = random::get_random_number_zero_indexed(seed, 16) + 1;
                let count_tiles = tiles_dict.get(tile_random_id.into());

                if count_tiles == 0 {
                    continue;
                }

                tiles_dict.insert(tile_random_id.into(), count_tiles - 1);

                vectores_dict.insert(vector_key, true);
                world
                    .write_model(
                        @Tile {
                            game_id,
                            position: vector,
                            layer,
                            tile_type: TileTypeTrait::from_id(tile_random_id.try_into().unwrap()),
                            consumed: false,
                        },
                    );
                i += 1;
            };
        }

        fn create_base(
            self: @ContractState,
            ref world: dojo::world::WorldStorage,
            game_id: u32,
            layer: u8,
            total_tiles: u32,
            vector: Vec2,
            ref seed: u128,
            ref tiles_dict: Felt252Dict<u16>,
        ) {
            let mut i = 0;
            while i < total_tiles {
                seed = random::LCG(seed);
                let tile_random_id = random::get_random_number_zero_indexed(seed, 16) + 1;
                let count_tiles = tiles_dict.get(tile_random_id.into());

                if count_tiles == 0 {
                    continue;
                }

                tiles_dict.insert(tile_random_id.into(), count_tiles - 1);

                world
                    .write_model(
                        @Tile {
                            game_id,
                            position: vector,
                            layer: i.try_into().unwrap(),
                            tile_type: TileTypeTrait::from_id(tile_random_id.try_into().unwrap()),
                            consumed: false,
                        },
                    );
                i += 1;
            };
            // i = 1;
        // while i <= 16 {
        //     println!("ID: {}, count_tiles: {}", i, tiles_dict.get(i.into()));
        //     i += 1;
        // };
        }
    }
}
