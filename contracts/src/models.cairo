use starknet::ContractAddress;

#[derive(Serde, Copy, Drop, PartialEq, Debug)]
pub enum EnumExample {
    Example,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Destiny {
    #[key]
    pub key: u32,
    pub total_battles: u32,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Progress {
    #[key]
    pub player: ContractAddress,
    #[key]
    pub level: u32,
    pub completed: bool,
}

#[derive(Drop, Serde)]
#[dojo::model]
pub struct Character {
    #[key]
    pub id: u32,
    pub name: ByteArray,
    pub skills: Span<u32>,
    pub health: u32,
    pub attack: u32,
    pub defense: u32,
    pub critical_chance: u32,
    pub evasion: u32,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct CharacterStatus {
    #[key]
    pub battle_id: u32,
    #[key]
    pub character_id: u32,
    pub current_hp: u32,
    pub max_hp: u32,
    pub attack: u32,
    pub defense: u32,
    pub critical_chance: u32,
    pub evasion: u32,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct CurrentBattle {
    #[key]
    pub player: ContractAddress,
    pub battle_id: u32,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Battle {
    #[key]
    pub id: u32,
    pub level: u32,
    pub player: ContractAddress,
    pub heroes_ids: Span<u32>,
    pub monsters_ids: Span<u32>,
    pub is_finished: bool,
}

#[derive(Copy, Drop, Serde)]
#[dojo::event]
pub struct DamageEvent {
    #[key]
    pub battle_id: u32,
    pub from_idx: u32,
    pub to_idx: u32,
    pub critical_hit: bool,
    pub damage: u32,
    pub is_monster: bool,
}

#[derive(Copy, Drop, Serde)]
#[dojo::event]
pub struct MissEvent {
    #[key]
    pub battle_id: u32,
    pub from_idx: u32,
    pub to_idx: u32,
    pub is_monster: bool,
}

#[derive(Copy, Drop, Serde)]
#[dojo::event]
pub struct HealEvent {
    #[key]
    pub battle_id: u32,
    pub from_idx: u32,
    pub to_idx: u32,
    pub amount: u32,
    pub is_monster: bool,
}

#[derive(Copy, Drop, Serde)]
#[dojo::event]
pub struct BuffEvent {
    #[key]
    pub battle_id: u32,
    pub from_idx: u32,
    pub to_idx: u32,
    pub buff_id: u32,
    pub amount: u32,
    pub is_monster: bool,
}


#[derive(Copy, Drop, Serde)]
#[dojo::event]
pub struct DebuffEvent {
    #[key]
    pub battle_id: u32,
    pub from_idx: u32,
    pub to_idx: u32,
    pub debuff_id: u32,
    pub amount: u32,
    pub is_monster: bool,
}

#[derive(Copy, Drop, Serde)]
#[dojo::event]
pub struct PlayerWinEvent {
    #[key]
    pub battle_id: u32,
    pub player: ContractAddress,
}

#[derive(Copy, Drop, Serde)]
#[dojo::event]
pub struct PlayerLoseEvent {
    #[key]
    pub battle_id: u32,
    pub player: ContractAddress,
}

#[derive(Copy, Drop, Serde)]
#[dojo::event]
pub struct BattleCreatedEvent {
    #[key]
    pub player: ContractAddress,
    pub id: u32,
}

