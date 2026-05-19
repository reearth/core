/**
 * Custom Provider Resolver
 * ----------------------
 * Utility functions to look up URLs and metadata
 * from CustomProviderConfig nested structure.
 */

import type { CustomProviderConfig, TerrainProviderEntry } from "../../../Map/types/customProvider";

export function resolveTerrainEntry(config: CustomProviderConfig | undefined): TerrainProviderEntry | null {
  const providers = config?.terrain?.providers;
  if (!providers?.length) return null;
  return providers.find(p => p.id === "default") ?? providers[0];
}

export function resolveTerrainUrl(config: CustomProviderConfig | undefined): string | null {
  return resolveTerrainEntry(config)?.url ?? null;
}

export function resolveImageryUrl(config: CustomProviderConfig | undefined, presetName: string): string | null {
  return config?.imagery?.providers?.find(p => p.id === presetName)?.url ?? null;
}

export function resolveImageryCredit(config: CustomProviderConfig | undefined, presetName: string): string | undefined {
  return config?.imagery?.providers?.find(p => p.id === presetName)?.credit;
}

export function resolveImageryMaxZoom(config: CustomProviderConfig | undefined, presetName: string): number | undefined {
  return config?.imagery?.providers?.find(p => p.id === presetName)?.maximumLevel;
}

export function resolveTilesetUrl(config: CustomProviderConfig | undefined, tilesetId: string): string | null {
  return config?.layers?.providers?.find(p => p.id === tilesetId)?.url ?? null;
}
