import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const graphqlErrors = new Rate('graphql_errors');
const graphqlDuration = new Trend('graphql_duration', true);

const API_URL = __ENV.API_URL || 'http://127.0.0.1:3202';
const EMAIL = __ENV.EMAIL || 'admin@nexo.local';
const PASSWORD = __ENV.PASSWORD || 'NexoDemo!2026';
const FIRST = Number(__ENV.FIRST || 100);
const RATE = Number(__ENV.RATE || 20);
const DURATION = __ENV.DURATION || '20s';
const DATALOADER_MODE = __ENV.DATALOADER_MODE || 'loader';

export const options = {
  scenarios: {
    deals: {
      executor: 'constant-arrival-rate',
      rate: RATE,
      timeUnit: '1s',
      duration: DURATION,
      preAllocatedVUs: 20,
      maxVUs: 80,
      gracefulStop: '5s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    graphql_errors: ['rate<0.01'],
    graphql_duration: ['p(95)<3000'],
  },
  tags: {
    scenario: 'deals-dataloader',
    dataloader: DATALOADER_MODE,
  },
};

const DEALS_QUERY = `
  query BenchmarkDeals($first: Int!) {
    deals(first: $first) {
      edges {
        node {
          id
          title
          stage
          valueCents
          contact {
            id
            firstName
            lastName
            email
          }
          company {
            id
            name
            domain
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export function setup() {
  const response = http.post(
    `${API_URL}/auth/login`,
    JSON.stringify({ email: EMAIL, password: PASSWORD }),
    { headers: { 'Content-Type': 'application/json' }, tags: { request: 'login' } },
  );

  if (response.status !== 200) {
    throw new Error(`Login falhou: HTTP ${response.status} ${response.body}`);
  }

  const body = response.json();
  if (!body.accessToken) {
    throw new Error('Login não retornou accessToken');
  }

  return { accessToken: body.accessToken };
}

export default function (data) {
  const response = http.post(
    `${API_URL}/graphql`,
    JSON.stringify({ query: DEALS_QUERY, variables: { first: FIRST } }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${data.accessToken}`,
      },
      tags: { request: 'deals' },
    },
  );

  const body = response.json();
  const failed = response.status !== 200 || Boolean(body.errors);
  graphqlErrors.add(failed);
  graphqlDuration.add(response.timings.duration);

  check(response, {
    'status 200': (result) => result.status === 200,
    'sem erros GraphQL': () => !body.errors,
    'retorna negócios': () => (body.data?.deals?.edges?.length ?? 0) > 0,
  });

  sleep(0.01);
}
