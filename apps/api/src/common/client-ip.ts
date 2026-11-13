import type { Request } from 'express';

export function normalizeIp(value: string | undefined): string {
  if (!value) {
    return 'unknown';
  }

  return value.startsWith('::ffff:') ? value.slice('::ffff:'.length) : value;
}

export function clientIp(request: Request): string {
  return normalizeIp(request.ip ?? request.socket.remoteAddress);
}

export function requestSocketIp(request: { socket?: { remoteAddress?: string } }): string {
  return normalizeIp(request.socket?.remoteAddress);
}
