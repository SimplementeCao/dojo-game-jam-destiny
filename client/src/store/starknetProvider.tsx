import { type PropsWithChildren } from "react";
import { Chain } from "@starknet-react/chains";
import { jsonRpcProvider, StarknetConfig, voyager } from "@starknet-react/core";
// import {
//   predeployedAccounts,
//   type PredeployedAccountsConnector,
// } from "@dojoengine/predeployed-connector";
import { ControllerConnector } from "@cartridge/connector";
import { num, shortString } from "starknet";
import { getContractByName } from "@dojoengine/core";
import { dojoConfig } from "../dojo/dojoConfig";
import { SessionPolicies } from "@cartridge/presets";

const actions_contract = getContractByName(
  dojoConfig.manifest,
  "dojo_sheep_a_sheep",
  "actions"
);

// Define session policies for sheep-a-sheep game
const policies: SessionPolicies = {
  contracts: {
    [actions_contract.address]: {
      methods: [
        {
          name: "start_new_game",
          entrypoint: "start_new_game",
          description: "Start a new sheep-a-sheep game",
        },
        { 
          name: "select_tile", 
          entrypoint: "select_tile",
          description: "Select a tile in the game"
        },
      ],
    },
  },
};

const controller = new ControllerConnector({
  chains: [
    {
      rpcUrl: import.meta.env.VITE_RPC_URL || "http://localhost:5050",
    },
  ],
  defaultChainId: shortString.encodeShortString("WP_PANDA_PANDA"),
  policies,
});

const appchain: Chain = {
  id: num.toBigInt(shortString.encodeShortString("WP_PANDA_PANDA")),
  network: "katana",
  name: "Panda Panda Chain",
  rpcUrls: {
    default: import.meta.env.VITE_RPC_URL || "http://localhost:5050",
    public: import.meta.env.VITE_RPC_URL || "http://localhost:5050",
  },
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
    address: import.meta.env.VITE_ETH_ADDRESS,
  },
};

// Configure RPC provider
const provider = jsonRpcProvider({
  rpc: () => ({ nodeUrl: dojoConfig.rpcUrl }),
});

export default function StarknetProvider({ children }: PropsWithChildren) {
  // const [connectors, setConnectors] = useState<PredeployedAccountsConnector[]>(
  //   []
  // );

  // useEffect(() => {
  //   if (connectors.length === 0) {
  //     predeployedAccounts({
  //       rpc: dojoConfig.rpcUrl as string,
  //       id: "katana",
  //       name: "Katana",
  //     }).then((connectors) => {
  //       console.log({ connectors });
  //       setConnectors(connectors);
  //     });
  //   }
  // }, [connectors]);

  return (
    <StarknetConfig
      chains={[appchain]}
      provider={provider}
      connectors={[controller]}
      explorer={voyager}
    >
      {children}
    </StarknetConfig>
  );
} 