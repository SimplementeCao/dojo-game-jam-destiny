use starknet::ContractAddress;

#[derive(Serde, Copy, Drop, Introspect, PartialEq, Debug)]
pub enum TileType {
    Sheep,
    Wolf,
    Grass,
    Flower,
    Carrot,
    Bone,
    Corn,
    Tool,
    Bucket,
    Wood,
    Glove,
    Cabbage,
    Apple,
    Strawberry,
    Pumpkin,
    Cherry,
    Empty,
}

#[derive(Serde, Copy, Drop, Introspect, PartialEq, Debug)]
pub enum GameState {
    NotStarted,
    InProgress,
    Won,
    Lost,
    Paused,
}

#[derive(Copy, Drop, Serde, IntrospectPacked, Debug)]
pub struct Vec2 {
    pub x: u32,
    pub y: u32,
}

#[derive(Copy, Drop, Serde, Debug)]
#[dojo::model]
pub struct Tile {
    #[key]
    pub game_id: u32,
    #[key]
    pub position: Vec2,
    #[key]
    pub layer: u8,
    pub tile_type: TileType,
    pub consumed: bool,
}

#[derive(Copy, Drop, Serde, Debug)]
#[dojo::model]
pub struct Game {
    #[key]
    pub game_id: u32,
    pub player: ContractAddress,
    pub state: GameState,
    pub score: u32,
    pub moves_used: u32,
    pub start_time: u64,
    pub end_time: u64,
    pub board_width: u32,
    pub board_height: u32,
    pub max_layers: u8,
    pub total_tiles: u32,
    pub remaining_tiles: u32,
}

#[derive(Drop, Serde, Debug)]
#[dojo::model]
pub struct PlayerInventory {
    #[key]
    pub game_id: u32,
    pub slots: Array<u16>,
}

impl TileTypeIntoU16 of Into<TileType, u16> {
    fn into(self: TileType) -> u16 {
        match self {
            TileType::Empty => 0,
            TileType::Sheep => 1,
            TileType::Wolf => 2,
            TileType::Grass => 3,
            TileType::Flower => 4,
            TileType::Carrot => 5,
            TileType::Bone => 6,
            TileType::Corn => 7,
            TileType::Tool => 8,
            TileType::Bucket => 9,
            TileType::Wood => 10,
            TileType::Glove => 11,
            TileType::Cabbage => 12,
            TileType::Apple => 13,
            TileType::Strawberry => 14,
            TileType::Pumpkin => 15,
            TileType::Cherry => 16,
        }
    }
}

impl GameStateIntoFelt252 of Into<GameState, felt252> {
    fn into(self: GameState) -> felt252 {
        match self {
            GameState::NotStarted => 0,
            GameState::InProgress => 1,
            GameState::Won => 2,
            GameState::Lost => 3,
            GameState::Paused => 4,
        }
    }
}

#[generate_trait]
impl Vec2Impl of Vec2Trait {
    fn is_zero(self: Vec2) -> bool {
        self.x == 0 && self.y == 0
    }

    fn is_equal(self: Vec2, b: Vec2) -> bool {
        self.x == b.x && self.y == b.y
    }

    fn manhattan_distance(self: Vec2, other: Vec2) -> u32 {
        let dx = if self.x > other.x {
            self.x - other.x
        } else {
            other.x - self.x
        };
        let dy = if self.y > other.y {
            self.y - other.y
        } else {
            other.y - self.y
        };
        dx + dy
    }

    // Convert from fractional coordinates to fixed-point
    fn from_fractional(x_frac: u32, y_frac: u32, x_half: bool, y_half: bool) -> Vec2 {
        let x = x_frac * 2 + (if x_half {
            1
        } else {
            0
        });
        let y = y_frac * 2 + (if y_half {
            1
        } else {
            0
        });
        Vec2 { x, y }
    }

    // Get the integer part of coordinates
    fn get_integer_x(self: Vec2) -> u32 {
        self.x / 2
    }

    fn get_integer_y(self: Vec2) -> u32 {
        self.y / 2
    }

    // Check if position has half coordinates
    fn has_half_x(self: Vec2) -> bool {
        self.x % 2 == 1
    }

    fn has_half_y(self: Vec2) -> bool {
        self.y % 2 == 1
    }

    // Check if two positions overlap (for tiles that might cover each other)
    fn overlaps_with(self: Vec2, other: Vec2, tile_size: u32) -> bool {
        let self_min_x = self.x;
        let self_max_x = self.x + tile_size;
        let self_min_y = self.y;
        let self_max_y = self.y + tile_size;

        let other_min_x = other.x;
        let other_max_x = other.x + tile_size;
        let other_min_y = other.y;
        let other_max_y = other.y + tile_size;

        // Check if rectangles overlap
        !(self_max_x <= other_min_x
            || other_max_x <= self_min_x
            || self_max_y <= other_min_y
            || other_max_y <= self_min_y)
    }
}

// Helper trait for TileType
#[generate_trait]
impl TileTypeImpl of TileTypeTrait {
    fn can_match(self: TileType, other: TileType) -> bool {
        self == other && self != TileType::Empty
    }

    fn is_empty(self: TileType) -> bool {
        self == TileType::Empty
    }

    // Get tile type from the expanded set based on ID
    fn from_id(id: u16) -> TileType {
        match id {
            0 => TileType::Empty,
            1 => TileType::Sheep,
            2 => TileType::Wolf,
            3 => TileType::Grass,
            4 => TileType::Flower,
            5 => TileType::Carrot,
            6 => TileType::Bone,
            7 => TileType::Corn,
            8 => TileType::Tool,
            9 => TileType::Bucket,
            10 => TileType::Wood,
            11 => TileType::Glove,
            12 => TileType::Cabbage,
            13 => TileType::Apple,
            14 => TileType::Strawberry,
            15 => TileType::Pumpkin,
            16 => TileType::Cherry,
            _ => TileType::Empty,
        }
    }
}

// Helper trait for GameState
#[generate_trait]
impl GameStateImpl of GameStateTrait {
    fn is_active(self: GameState) -> bool {
        self == GameState::InProgress || self == GameState::Paused
    }

    fn is_finished(self: GameState) -> bool {
        self == GameState::Won || self == GameState::Lost
    }
}
