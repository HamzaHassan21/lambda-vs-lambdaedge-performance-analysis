'use strict';

const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({ region: 'eu-west-2' });
const BUCKET = 'fyp-geo-site-hh-2121';

const streamToBuffer = async (stream) =>
  await new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });

const getContentType = (key) => {
  if (key.endsWith('.html')) return 'text/html; charset=utf-8';
  if (key.endsWith('.css')) return 'text/css; charset=utf-8';
  if (key.endsWith('.js')) return 'application/javascript; charset=utf-8';
  if (key.endsWith('.json')) return 'application/json; charset=utf-8';
  if (key.endsWith('.svg')) return 'image/svg+xml';
  if (key.endsWith('.png')) return 'image/png';
  if (key.endsWith('.jpg') || key.endsWith('.jpeg')) return 'image/jpeg';
  return 'application/octet-stream';
};

exports.handler = async (event) => {
  try {
    const path =
      event.rawPath ||
      event.path ||
      event.requestContext?.http?.path ||
      '/';

    const headers = event.headers || {};
    const qs = event.queryStringParameters || {};

    const normalizedHeaders = Object.fromEntries(
      Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])
    );

    let key;

    // Asset request: /assets/styles.css
    if (path.startsWith('/assets/')) {
      key = path.replace(/^\/+/, '');
    } else {
      // HTML request
      const qpRaw = qs.country || qs.Country || qs.c || '';
      const hdrRaw = normalizedHeaders['x-test-country'] || '';
      const raw = qpRaw || hdrRaw || 'DEFAULT';
      const country = String(raw).toUpperCase();

      const map = {
        GB: 'assets/uk.html',
        US: 'assets/us.html',
        SG: 'assets/sg.html',
        AU: 'assets/au.html'
      };

      key = map[country] || 'assets/index.html';
    }

    const result = await s3.send(
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: key
      })
    );

    const bodyBuffer = await streamToBuffer(result.Body);
    const contentType = result.ContentType || getContentType(key);

    const isText =
      contentType.startsWith('text/') ||
      contentType.includes('javascript') ||
      contentType.includes('json') ||
      contentType.includes('svg');

    console.log(JSON.stringify({
      msg: 'regional-s3-response',
      path,
      key,
      contentType,
      requestId: event.requestContext?.requestId || null,
      timestamp: new Date().toISOString()
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType
      },
      body: isText ? bodyBuffer.toString('utf-8') : bodyBuffer.toString('base64'),
      isBase64Encoded: !isText
    };
  } catch (error) {
    console.error('regional-s3-error', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Failed to load object from S3',
        error: error.message
      })
    };
  }
};
