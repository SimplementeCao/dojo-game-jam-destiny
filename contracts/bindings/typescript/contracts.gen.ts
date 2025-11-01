import { DojoProvider, DojoCall } from "@dojoengine/core";
import { Account, AccountInterface, BigNumberish, CairoOption, CairoCustomEnum } from "starknet";
import * as models from "./models.gen";

export function setupWorld(provider: DojoProvider) {

	const build_actions_view_calldata = (): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "view",
			calldata: [],
		};
	};

	const actions_view = async () => {
		try {
			return await provider.call("destiny", build_actions_view_calldata());
		} catch (error) {
			console.error(error);
			throw error;
		}
	};

	const build_actions_write_calldata = (value: BigNumberish): DojoCall => {
		return {
			contractName: "actions",
			entrypoint: "write",
			calldata: [value],
		};
	};

	const actions_write = async (snAccount: Account | AccountInterface, value: BigNumberish) => {
		try {
			return await provider.execute(
				snAccount,
				build_actions_write_calldata(value),
				"destiny",
			);
		} catch (error) {
			console.error(error);
			throw error;
		}
	};



	return {
		actions: {
			view: actions_view,
			buildViewCalldata: build_actions_view_calldata,
			write: actions_write,
			buildWriteCalldata: build_actions_write_calldata,
		},
	};
}