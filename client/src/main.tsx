import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

import { dojoConfig } from './dojo/dojoConfig'
import { init } from '@dojoengine/sdk'
import { DojoSdkProvider } from '@dojoengine/sdk/react'
import { setupWorld } from './dojo/generated/typescript/contracts.gen'
import type { SchemaType } from './dojo/generated/typescript/models.gen'
import StarknetProvider from './store/starknetProvider.tsx'

async function main() {
  const sdk = await init<SchemaType>({
    client: {
      toriiUrl: dojoConfig.toriiUrl,
      worldAddress: dojoConfig.manifest.world.address,
    },
    domain: {
      name: 'WP_DESTINY5',
      version: '1.0',
      chainId: 'KATANA',
      revision: '1',
    },
  })

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <StarknetProvider>
          <DojoSdkProvider
            sdk={sdk}
            dojoConfig={dojoConfig}
            clientFn={setupWorld}
          >
            <App />
          </DojoSdkProvider>
        </StarknetProvider>
      </BrowserRouter>
    </StrictMode>,
  )
}

main().catch(console.error)