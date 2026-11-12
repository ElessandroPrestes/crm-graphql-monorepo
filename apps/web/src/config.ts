const configuredApiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3202';

export const API_URL = configuredApiUrl.replace(/\/$/, '');
export const GRAPHQL_HTTP_URL = `${API_URL}/graphql`;
export const GRAPHQL_WS_URL = GRAPHQL_HTTP_URL.replace(/^http/, 'ws');
