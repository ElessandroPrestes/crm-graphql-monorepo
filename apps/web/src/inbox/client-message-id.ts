let counter = 0;

export function createClientMessageId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  counter += 1;

  return `msg-${Date.now()}-${counter}`;
}
