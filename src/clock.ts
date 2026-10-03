let simulatedNow: Date | null = null;

export function now(): Date {
  return simulatedNow ? new Date(simulatedNow.getTime()) : new Date();
}

export function nowIso(): string {
  return now().toISOString().split("T")[0];
}

export function setClock(d: Date | string): void {
  simulatedNow = typeof d === "string" ? new Date(d) : new Date(d.getTime());
}

export function resetClock(): void {
  simulatedNow = null;
}
