import { createDojoConfig } from "@dojoengine/core";

import manifest_dev from "../../../contracts/manifest_dev.json";

export const dojoConfig = createDojoConfig({
  manifest: manifest_dev,
  rpcUrl: import.meta.env.VITE_RPC_URL || "http://localhost:5050",
  toriiUrl: import.meta.env.VITE_TORII_URL || "http://localhost:8080",
}); 