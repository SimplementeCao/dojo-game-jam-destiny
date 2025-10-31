#[starknet::interface]
pub trait IActions<T> {
    fn write(ref self: T, value: u32);
    fn view(self: @T) -> u32;
}

#[dojo::contract]
pub mod actions {
    use dojo::event::EventStorage;
    use dojo::model::ModelStorage;
    use starknet::ContractAddress;
    use crate::models::Example;

    // Constants
    const EXAMPLE: u32 = 1;

    #[derive(Copy, Drop, Serde)]
    #[dojo::event]
    pub struct ExampleEvent {
        #[key]
        pub player: ContractAddress,
        pub value: u32,
    }

    #[abi(embed_v0)]
    impl ActionsImpl of super::IActions<ContractState> {
        fn write(ref self: ContractState, value: u32) {
            let mut world = self.world_default();
            world.write_model(@Example { id: 1, value });
            world.emit_event(@ExampleEvent { player: starknet::get_caller_address(), value });
        }

        fn view(self: @ContractState) -> u32 {
            let mut world = self.world_default();
            let mut example_value: Example = world.read_model(1);
            example_value.value
        }
    }

    #[generate_trait]
    impl InternalImpl of InternalTrait {
        fn world_default(self: @ContractState) -> dojo::world::WorldStorage {
            self.world(@"destiny")
        }
    }
}
