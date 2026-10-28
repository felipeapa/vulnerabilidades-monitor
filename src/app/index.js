// Fastify server with file-based storage and real data from OSV.dev + NIST NVD.
import fastify from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { queryPackage } from '../services/osv.js';
import { getTechnologies } from '../services/technologies.js';
import { refreshAll } from '../services/refresh.js';
import { buildReport, reportFilename } from '../services/report.js';
import {
  getVulnerabilities,
  saveVulnerabilities,
  mergeVulnerabilities,
  setVulnerabilityResolved,
  vulnerabilityKey,
  getScanState,
} from '../utils/storage.js';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;

const server = fastify({ logger: { level: 'info' } });

await server.register(cors, { origin: '*' });

// Routes
server.get('/', async () => ({
  message: 'Vulnerabilidades Monitor API v1.1',
  sources: ['OSV.dev', 'NIST NVD'],
}));

server.get('/health', async () => {
  const vulnerabilities = await getVulnerabilities();
  const state = await getScanState();
  return {
    status: 'ok',
    vulnerabilitiesCount: vulnerabilities.length,
    lastScanAt: state.lastScanAt,
  };
});

server.get('/api/vulnerabilidades', async () => {
  const [data, technologies, state] = await Promise.all([
    getVulnerabilities(),
    getTechnologies(),
    getScanState(),
  ]);

  return {
    // The client cannot rebuild the storage key on its own (it needs the
    // technology), so the server exposes it for status updates.
    data: data.map(vuln => ({ ...vuln, recordKey: vulnerabilityKey(vuln) })),
    technologies,
    lastScanAt: state.lastScanAt,
    source: 'OSV.dev + NIST NVD',
  };
});

// Mark a finding as resolved (or reopen it) without waiting for the next scan.
server.post('/api/vulnerabilidades/estado', async ({ body }, reply) => {
  const key = String(body?.key || '').trim();
  if (!key) {
    return reply.status(400).send({ error: 'Missing key' });
  }

  const record = await setVulnerabilityResolved(key, Boolean(body?.resolved));
  if (!record) {
    return reply.status(404).send({ error: 'Vulnerability not found' });
  }

  return reply.send({ success: true, record });
});

server.get('/api/tecnologias', async () => ({
  data: await getTechnologies(),
}));

// Real lookup against OSV.dev for a single package@version
server.post('/api/check', async ({ body }, reply) => {
  const { packageName, version, ecosystem = 'npm', technologyId } = body || {};
  if (!packageName) {
    return reply.status(400).send({ error: 'Missing packageName' });
  }

  try {
    const registry = await getTechnologies();
    const technology =
      registry.find(item => item.id === technologyId) ||
      registry.find(item => item.ecosystem === ecosystem) ||
      null;

    const found = await queryPackage(packageName, version, { ecosystem, technology });
    const stored = await getVulnerabilities();
    const data = mergeVulnerabilities(stored, found);
    await saveVulnerabilities(data);

    return reply.send({
      success: true,
      source: 'OSV.dev',
      packageName,
      version: version || 'latest',
      found: found.length,
      count: data.length,
      data: found,
    });
  } catch (error) {
    return reply.status(502).send({ error: `OSV query failed: ${error.message}` });
  }
});

// Scans every enabled technology and stores real findings
server.post('/api/refresh', async (request, reply) => {
  try {
    const result = await refreshAll({ force: Boolean(request.body?.force) });
    return reply.send({ success: true, ...result });
  } catch (error) {
    return reply.status(502).send({ error: `Refresh failed: ${error.message}` });
  }
});

// Downloadable report for a period and technology selection
server.get('/api/report', async (request, reply) => {
  const requestedDays = Number(request.query?.days ?? 30);
  const days = Number.isFinite(requestedDays) ? Math.max(0, requestedDays) : 30;
  const format = ['txt', 'csv', 'json'].includes(request.query?.format)
    ? request.query.format
    : 'txt';
  const technologies = String(request.query?.technologies || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);

  const [data, registry] = await Promise.all([getVulnerabilities(), getTechnologies()]);
  const report = buildReport(data, { days, technologies, format, registry });

  return reply
    .header('Content-Type', report.contentType)
    .header('Cache-Control', 'no-store')
    .header(
      'Content-Disposition',
      `attachment; filename="${reportFilename({ days, extension: report.extension })}"`
    )
    .send(report.body);
});

// Start server
try {
  await server.listen({ port: PORT, host: '0.0.0.0' });
  console.log('✅ Running at http://localhost:' + PORT);
} catch (err) {
  if (err.code !== 'EADDRINUSE') throw err;
}
