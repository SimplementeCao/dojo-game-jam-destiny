use core::{integer::{U256DivRem, u256_try_as_non_zero}};
use starknet::get_block_timestamp;

const U128_MAX: u128 = 340282366920938463463374607431768211455;
const LCG_PRIME: u128 = 281474976710656;

pub fn get_random_hash() -> felt252 {
    get_block_timestamp().into()
}

pub fn get_entropy(felt_to_split: felt252) -> u128 {
    let (_d, r) = U256DivRem::div_rem(
        felt_to_split.into(), u256_try_as_non_zero(U128_MAX.into()).unwrap(),
    );

    r.try_into().unwrap() % LCG_PRIME
}

pub fn LCG(seed: u128) -> u128 {
    let a = 25214903917;
    let c = 11;
    let m = LCG_PRIME;

    (a * seed + c) % m
}

pub fn get_random_number_zero_indexed(seed: u128, range: u32) -> u32 {
    if range == 0 {
        return 0;
    }

    (seed % range.into()).try_into().unwrap()
}
