const ENABLED_VALUES = new Set(["1", "true", "yes", "on"]);

export function isMaintenanceMode(
  value: string | undefined = process.env.MAINTENANCE_MODE
): boolean {
  return ENABLED_VALUES.has(value?.trim().toLowerCase() || "");
}

export function getMaintenanceMessage(): string {
  return (
    process.env.MAINTENANCE_MESSAGE?.trim() ||
    "Authentication is being migrated. Existing sessions may be signed out briefly, and new purchases are temporarily paused."
  );
}
