import { delay, http, HttpResponse } from 'msw';
import { db } from './db';

const BASE = '/api/v1/agents/:agentId/knowledge';
const LATENCY = 250;

export const handlers = [
  http.get(`${BASE}/graph`, async () => {
    await delay(LATENCY);
    return HttpResponse.json(db.graph());
  }),
  http.get(`${BASE}/nodes/:nodeId`, async ({ params }) => {
    await delay(120);
    const n = db.node(String(params.nodeId));
    return n ? HttpResponse.json(n) : HttpResponse.json({ message: 'not found' }, { status: 404 });
  }),
  http.get(`${BASE}/health`, async () => {
    await delay(LATENCY);
    return HttpResponse.json(db.health());
  }),
  http.get(`${BASE}/pipeline`, async () => {
    await delay(LATENCY);
    return HttpResponse.json(db.pipeline());
  }),
  http.get(`${BASE}/proposals`, async ({ request }) => {
    await delay(LATENCY);
    const decision = new URL(request.url).searchParams.get('decision');
    return HttpResponse.json(db.proposals(decision));
  }),
  http.get(`${BASE}/logs`, async ({ request }) => {
    await delay(LATENCY);
    const u = new URL(request.url);
    return HttpResponse.json(db.logs(u.searchParams.get('cursor'), Number(u.searchParams.get('limit') ?? 20)));
  }),
  http.post(`${BASE}/proposals/:proposalId/decision`, async ({ params, request }) => {
    await delay(400);
    const body = (await request.json()) as { decision?: string };
    if (body.decision !== 'approved' && body.decision !== 'deferred') {
      return HttpResponse.json({ message: 'invalid decision' }, { status: 400 });
    }
    const r = db.decide(String(params.proposalId), body.decision);
    if ('error' in r) return HttpResponse.json({ message: 'conflict' }, { status: r.error });
    return HttpResponse.json(r.result);
  }),
  http.post(`${BASE}/proposals/:proposalId/undo`, async ({ params }) => {
    await delay(300);
    const r = db.undo(String(params.proposalId));
    if ('error' in r) return HttpResponse.json({ message: 'conflict' }, { status: r.error });
    return HttpResponse.json(r.result);
  }),
];
