import { clearRateLimitCounters } from './helpers/redis';

export default function globalSetup(): void {
  try {
    clearRateLimitCounters();
  } catch (error) {
    console.warn('Não foi possível limpar os contadores de rate limit do Redis:', error);
  }
}
