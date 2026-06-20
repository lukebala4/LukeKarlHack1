/**
 * Server-only environment + provider configuration.
 * NEVER import this into a client component. All secrets stay server-side.
 */
import "server-only";

function read(name: string): string {
  return (process.env[name] ?? "").trim();
}

export const env = {
  unifyApiKey: read("UNIFY_API_KEY"),
  zeroApiKey: read("ZERO_API_KEY"),
  zeroWorkspaceId: read("ZERO_WORKSPACE_ID"),
  scaileApiKey: read("SCAILE_API_KEY"),
  scaileApiBase: read("SCAILE_API_BASE"),
  anthropicApiKey: read("ANTHROPIC_API_KEY"),
  championMinScore: Number(read("CHAMPION_MIN_SCORE") || 70),
  enrichMinScore: Number(read("ENRICH_MIN_SCORE") || 50),
} as const;

/** True if a provider has the minimum config it needs to make a request. */
export const providerConfigured = {
  unify: () => env.unifyApiKey.length > 0,
  zero: () => env.zeroApiKey.length > 0 && env.zeroWorkspaceId.length > 0,
  scaile: () => env.scaileApiKey.length > 0 && env.scaileApiBase.length > 0,
  anthropic: () => env.anthropicApiKey.length > 0,
} as const;
