/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE?: string;
  readonly VITE_GEO_BLOCKED?: string;
  readonly VITE_ARC_RPC_URL?: string;
  readonly VITE_ARC_EXPLORER_URL?: string;
  readonly VITE_ARC_USDC_ADDRESS?: string;
  readonly VITE_NOVA_POOL_ADDRESS?: string;
  readonly VITE_NOVA_SIGNAL_ADDRESS?: string;
  readonly VITE_DEMO_BUY_TX?: string;
  readonly VITE_DEMO_SIGNAL_TX?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
