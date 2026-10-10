interface LiveCompatibilityResult {
  tier: string | null;
  checkedAt: string;
}

const pendingChecks = new Map<number, Promise<LiveCompatibilityResult>>();

function isLiveCompatibilityResult(value: unknown): value is LiveCompatibilityResult {
  if (!value || typeof value !== "object") return false;
  const result = value as Partial<LiveCompatibilityResult>;
  return (result.tier === null || typeof result.tier === "string")
    && typeof result.checkedAt === "string";
}

export function checkLiveCompatibility(steamAppId: number): Promise<LiveCompatibilityResult> {
  const existing = pendingChecks.get(steamAppId);
  if (existing) return existing;

  const request = fetch(`/api/protondb/summary?appId=${steamAppId}`)
    .then(async (response) => {
      if (!response.ok) throw new Error(`Compatibility check returned ${response.status}`);
      const result: unknown = await response.json();
      if (!isLiveCompatibilityResult(result)) throw new Error("Compatibility check returned invalid data");
      return result;
    })
    .catch((error) => {
      pendingChecks.delete(steamAppId);
      throw error;
    });

  pendingChecks.set(steamAppId, request);
  return request;
}
