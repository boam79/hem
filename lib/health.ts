export type HealthStatus = {
  anthropic: boolean;
  openai: boolean;
  google: boolean;
  supabase: boolean;
};

export function isLiveDebateReady(health: HealthStatus): boolean {
  return (
    health.anthropic && health.openai && health.google && health.supabase
  );
}
