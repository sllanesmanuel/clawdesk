/**
 * Cache del estado de instalación para evitar llamadas lentas al backend.
 */

export interface InstallationStatus {
  installed: boolean;
  ready: boolean;
  gateway_running?: boolean;
  model_configured?: boolean;
}

let cached: InstallationStatus | null = null;

export function getCached(): InstallationStatus | null {
  return cached;
}

export function setCached(s: InstallationStatus) {
  cached = s;
}

export function invalidate() {
  cached = null;
}
