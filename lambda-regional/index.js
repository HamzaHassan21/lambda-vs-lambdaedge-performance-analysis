'use strict';

exports.handler = async (event) => {
  const headers = event.headers || {};
  const qs = event.queryStringParameters || {};

  // Browser-friendly override: ?country=GB
  const qpRaw = qs.country || qs.Country || qs.c || '';
  // Controlled testing header: X-Test-Country
  const hdrRaw = headers['x-test-country'] || headers['X-Test-Country'] || '';
  // Fallback
  const raw = qpRaw || hdrRaw || 'DEFAULT';

  const country = String(raw).toUpperCase();

  const map = { GB: 'uk.html', US: 'us.html', SG: 'sg.html', AU: 'au.html' };
  const variant = map[country] || 'index.html';

  const payload = {
    country,
    variant,
    source: qpRaw ? 'query' : (hdrRaw ? 'header' : 'default'),
    requestId: event.requestContext?.requestId || null,
    timestamp: new Date().toISOString()
  };

  console.log(JSON.stringify({ msg: 'regional-baseline', ...payload }));

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Geo-Variant': variant
    },
    body: JSON.stringify(payload)
  };
};