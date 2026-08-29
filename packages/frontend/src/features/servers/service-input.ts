import type { ServerService, ServerSummary, ServiceStatus } from './use-servers';

// Form-friendly shape for editing a server's service entries (ports as a
// comma-separated string instead of number[]) — shared between the full
// ServerFormDialog and the quick add/edit flow on the server detail page so
// the two surfaces never drift on parsing/validation.
export interface ServiceInput {
  seq: number;
  name: string;
  commandStart: string;
  commandStop: string;
  commandStatus: string;
  ports: string;
  status: ServiceStatus;
  observations: string;
}

export function csvToList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function serviceToInput(svc: ServerService): ServiceInput {
  return {
    seq: svc.seq,
    name: svc.name,
    commandStart: svc.commandStart ?? '',
    commandStop: svc.commandStop ?? '',
    commandStatus: svc.commandStatus ?? '',
    ports: (svc.ports ?? []).join(', '),
    status: svc.status,
    observations: svc.observations ?? '',
  };
}

export function servicesFromServer(server: ServerSummary): ServiceInput[] {
  return server.services.map(serviceToInput);
}

export function serviceInputToPayload(svc: ServiceInput): ServerService {
  return {
    seq: svc.seq,
    name: svc.name.trim(),
    commandStart: svc.commandStart.trim() || null,
    commandStop: svc.commandStop.trim() || null,
    commandStatus: svc.commandStatus.trim() || null,
    ports: csvToList(svc.ports)
      .map(Number)
      .filter((n) => n >= 1 && n <= 65535),
    status: svc.status,
    observations: svc.observations.trim() || null,
  };
}
