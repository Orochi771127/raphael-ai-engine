import { runMockGatewayTurn } from './mock-gateway.js';

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === 'GET' && url.pathname === '/v1/health') {
      return json({
        ok: true,
        service: 'raphael-ai-engine',
        mode: 'mock-gateway-maturity',
        frontendApiKeyRequired: false,
        finalAuthority: 'RaphaelCore',
      });
    }

    if (request.method === 'POST' && url.pathname === '/v1/raphael/turn') {
      const body = await request.json();
      return json(runMockGatewayTurn(body));
    }

    return json({ ok: false, error: 'NOT_FOUND' }, 404);
  },
};

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
  });
}
