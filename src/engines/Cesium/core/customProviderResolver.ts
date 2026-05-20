import type { CustomProviderConfig } from "../../../Map/types/customProvider";

export function resolveImageryUrl(
  config: CustomProviderConfig | undefined,
  presetName: string,
): string | null {
  return config?.imagery?.providers?.find(p => p.id === presetName)?.url ?? null;
}

export function resolveImageryCredit(
  config: CustomProviderConfig | undefined,
  presetName: string,
): string | undefined {
  return config?.imagery?.providers?.find(p => p.id === presetName)?.credit;
}

export function resolveImageryMaxZoom(
  config: CustomProviderConfig | undefined,
  presetName: string,
): number | undefined {
  return config?.imagery?.providers?.find(p => p.id === presetName)?.maximumLevel;
}
