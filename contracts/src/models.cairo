#[derive(Serde, Copy, Drop, Introspect, PartialEq, Debug)]
pub enum EnumExample {
    Example,
}

#[derive(Copy, Drop, Serde, IntrospectPacked, Debug)]
#[dojo::model]
pub struct Example {
    #[key]
    pub id: u32,
    pub value: u32,
}
