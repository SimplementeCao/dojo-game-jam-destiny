#[derive(Serde, Copy, Drop, Introspect, PartialEq, Debug)]
pub enum EnumExample {
    Example,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Example {
    #[key]
    pub id: u32,
    pub value: u32,
}

#[derive(Copy, Drop, Serde)]
#[dojo::model]
pub struct Progress {
    #[key]
    pub player: u32,
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
    battle_id: u32,
    #[key]
    character_id: u32,
    pub health: u32,
    pub attack: u32,
    pub defense: u32,
    pub critical_chance: u32,
    pub evasion: u32,
}