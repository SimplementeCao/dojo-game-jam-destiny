import { type PropsWithChildren } from "react";
import type { Chain } from "@starknet-react/chains";
import { Connector, jsonRpcProvider, StarknetConfig, voyager } from "@starknet-react/core";
import { ControllerConnector } from "@cartridge/connector";
import { num, shortString } from "starknet";
import { getContractByName } from "@dojoengine/core";
import { dojoConfig } from "../dojo/dojoConfig";
import { SessionPolicies } from "@cartridge/presets";
import { WalletSessionManager } from "../components/WalletSessionManager";

const actions_contract = getContractByName(
  dojoConfig.manifest,
  "destiny4",
  "actions"
);

const policies: SessionPolicies = {
  contracts: {
    [actions_contract.address]: {
      methods: [
        {
          name: "start_battle",
          entrypoint: "start_battle",
          description: "Start a new battle",
        },
        { 
          name: "play", 
          entrypoint: "play",
          description: "Play a turn in the battle"
        },
        {
          name: "initialize",
          entrypoint: "initialize",
          description: "Initialize the battle"
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
  defaultChainId: shortString.encodeShortString("WP_DESTINY4"),
  policies,
});

const slot: Chain = {
  id: num.toBigInt(shortString.encodeShortString("WP_DESTINY4")),
  name: "Destiny",
  network: "destiny4",
  rpcUrls: {
    default: {
      http: [import.meta.env.VITE_RPC_URL],
    },
    public: {
      http: [import.meta.env.VITE_RPC_URL],
    },
  },  
  nativeCurrency: {
    name: "Starknet",
    symbol: "STRK",
    decimals: 18,
    address: "0x04718f5a0Fc34cC1AF16A1cdee98fFB20C31f5cD61D6Ab07201858f4287c938D",
  },
  paymasterRpcUrls: {
    avnu: {
       http: ["http://localhost:5050"],
    },
  },
}

const provider = jsonRpcProvider({
  rpc: () => ({ nodeUrl: dojoConfig.rpcUrl }),
});

export default function StarknetProvider({ children }: PropsWithChildren) {

  return (
    <StarknetConfig
      chains={[slot]}
      provider={provider}
      connectors={[controller as unknown as Connector]}
      explorer={voyager}
      autoConnect
    >
      <WalletSessionManager />
      {children}
    </StarknetConfig>
  );
} 