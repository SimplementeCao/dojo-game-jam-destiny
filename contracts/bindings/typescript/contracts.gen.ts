import { DojoProvider, DojoCall } from "@dojoengine/core";
import { Account, AccountInterface, BigNumberish, CairoOption, CairoCustomEnum, ByteArray } from "starknet";
import * as models from "./models.gen";

export function setupWorld(provider: DojoProvider) {

	const build_actions_selectTile_calldata = (gameId: BigNumberish, position: models.Vec2, layer: BigNumberish): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "select_tile",
			calldata: [gameId, position, layer],
		};
	};

	const actions_selectTile = async (snAccount: Account | AccountInterface, gameId: BigNumberish, position: models.Vec2, layer: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_selectTile_calldata(gameId, position, layer),
				"dojo_sheep_a_sheep",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_startNewGame_calldata = (): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "start_new_game",
			calldata: [],
		};
	};

	const actions_startNewGame = async (snAccount: Account | AccountInterface) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_startNewGame_calldata(),
				"dojo_sheep_a_sheep",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};



	return {
		actions: {
			selectTile: actions_selectTile,
			buildSelectTileCalldata: build_actions_selectTile_calldata,
			startNewGame: actions_startNewGame,
			buildStartNewGameCalldata: build_actions_startNewGame_calldata,
		},
	};
}