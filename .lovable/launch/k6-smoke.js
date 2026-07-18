// k6 smoke + light-load test for Startuplabs production readiness.
// Run: k6 run -e BASE_URL=https://startuplabs.online .lovable/launch/k6-smoke.js
//
// Two scenarios:
//   - smoke: 1 VU, iterates the full public route list. Fails the run on any non-2xx or slow p95.
//   - ramp:  0 -> 25 -> 50 VUs over 5m against the highest-traffic marketing pages.
//
// Thresholds are intentionally conservative for a marketing site behind a CDN.

import http from 'k6/http';
import { check, group, sleep } from 'k6';

const BASE = __ENV.BASE_URL || 'https://startuplabs.online';

export const options = {
  scenarios: {
    smoke: {
      executor: 'per-vu-iterations',
      vus: 1,
      iterations: 3,
      maxDuration: '2m',
      exec: 'smoke',
    },
    ramp: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 25 },
        { duration: '2m', target: 50 },
        { duration: '1m', target: 50 },
        { duration: '1m', target: 0 },
      ],
      exec: 'ramp',
      startTime: '10s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1500', 'p(99)<3000'],
    checks: ['rate>0.99'],
  },
};

const PUBLIC_ROUTES = [
  '/', '/facilitator', '/build', '/one-on-one', '/services',
  '/contact', '/schedule', '/webinar', '/privacy', '/terms',
];

const HOT_ROUTES = ['/', '/facilitator', '/build', '/webinar'];

function hit(path) {
  const res = http.get(`${BASE}${path}`, { tags: { route: path } });
  check(res, {
    [`${path} 200`]: (r) => r.status === 200,
    [`${path} has <title>`]: (r) => r.body && r.body.includes('<title>'),
  });
  return res;
}

export function smoke() {
  group('public routes', () => {
    for (const r of PUBLIC_ROUTES) {
      hit(r);
      sleep(0.3);
    }
  });
}

export function ramp() {
  hit(HOT_ROUTES[Math.floor(Math.random() * HOT_ROUTES.length)]);
  sleep(Math.random() * 2 + 0.5);
}
