import {
  getMaintenanceMessage,
  isMaintenanceMode,
} from "@/lib/maintenance";

export function MaintenanceNotice() {
  if (!isMaintenanceMode()) return null;

  return (
    <aside
      aria-live="polite"
      className="border-b border-amber-300 bg-amber-50 px-4 py-3 text-center text-sm text-amber-950"
      role="status"
    >
      <strong className="font-semibold">Scheduled authentication maintenance:</strong>{" "}
      {getMaintenanceMessage()}
    </aside>
  );
}
