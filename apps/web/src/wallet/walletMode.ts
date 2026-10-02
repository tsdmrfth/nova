/** Offline previews are explicitly opt-in and never enabled in production. */
export function offlineWalletPreview(): boolean {
  return import.meta.env.DEV && import.meta.env.VITE_WALLET_MODE === "mock";
}
