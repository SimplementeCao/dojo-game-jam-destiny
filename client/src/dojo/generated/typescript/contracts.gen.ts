import { DojoProvider, DojoCall } from "@dojoengine/core";
import { Account, AccountInterface, BigNumberish, CairoOption, CairoCustomEnum } from "starknet";
import * as models from "./models.gen";

export function setupWorld(provider: DojoProvider) {

	const build_actions_getHeroSkills_calldata = (heroId: BigNumberish): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "get_hero_skills",
			calldata: [heroId],
		};
	};

	const actions_getHeroSkills = async (heroId: BigNumberish) => {
		try {
			return await provider.call("destiny6", build_actions_getHeroSkills_calldata(heroId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_getMonsterSkills_calldata = (monsterId: BigNumberish): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "get_monster_skills",
			calldata: [monsterId],
		};
	};

	const actions_getMonsterSkills = async (monsterId: BigNumberish) => {
		try {
			return await provider.call("destiny6", build_actions_getMonsterSkills_calldata(monsterId));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_getPlayerBattle_calldata = (player: string): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "get_player_battle",
			calldata: [player],
		};
	};

	const actions_getPlayerBattle = async (player: string) => {
		try {
			return await provider.call("destiny6", build_actions_getPlayerBattle_calldata(player));
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_play_calldata = (actions: Array<[BigNumberish, BigNumberish, BigNumberish]>): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "play",
			calldata: [actions],
		};
	};

	const actions_play = async (snAccount: Account | AccountInterface, actions: Array<[BigNumberish, BigNumberish, BigNumberish]>) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_play_calldata(actions),
				"destiny6",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_startBattle_calldata = (level: BigNumberish): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "start_battle",
			calldata: [level],
		};
	};

	const actions_startBattle = async (snAccount: Account | AccountInterface, level: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_startBattle_calldata(level),
				"destiny6",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};



	return {
		actions: {
			getHeroSkills: actions_getHeroSkills,
			buildGetHeroSkillsCalldata: build_actions_getHeroSkills_calldata,
			getMonsterSkills: actions_getMonsterSkills,
			buildGetMonsterSkillsCalldata: build_actions_getMonsterSkills_calldata,
			getPlayerBattle: actions_getPlayerBattle,
			buildGetPlayerBattleCalldata: build_actions_getPlayerBattle_calldata,
			play: actions_play,
			buildPlayCalldata: build_actions_play_calldata,
			startBattle: actions_startBattle,
			buildStartBattleCalldata: build_actions_startBattle_calldata,
		},
	};
}