import { execFileSync } from 'node:child_process';

export function clearRateLimitCounters(): void {
  execFileSync(
    'docker',
    [
      'compose',
      '-f',
      'infra/docker-compose.yml',
      'exec',
      '-T',
      'redis',
      'sh',
      '-lc',
      "redis-cli --scan --pattern 'throttle:*' | xargs -r redis-cli del",
    ],
    { stdio: 'pipe' },
  );
}
