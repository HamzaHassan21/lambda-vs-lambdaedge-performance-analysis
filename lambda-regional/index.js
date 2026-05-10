'use strict';

// Import AWS SDK v3 S3 client and command
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

// Create S3 client in London region
const s3 = new S3Client({ region: 'eu-west-2' });

// Shared S3 bucket used by both architectures
const BUCKET = 'fyp-geo-site-hh-2121';

// Convert S3 response stream into a buffer
// AWS SDK v3 returns object bodies as streams
const streamToBuffer = async (stream) =>
  await new Promise((resolve, reject) => {
    const chunks = [];

    stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });

// Determine correct MIME type based on file extension
const getContentType = (key) => {
  if (key.endsWith('.html')) return 'text/html; charset=utf-8';
  if (key.endsWith('.css')) return 'text/css; charset=utf-8';
  if (key.endsWith('.js')) return 'application/javascript; charset=utf-8';
  if (key.endsWith('.json')) return 'application/json; charset=utf-8';
  if (key.endsWith('.svg')) return 'image/svg+xml';
  if (key.endsWith('.png')) return 'image/png';
  if (key.endsWith('.jpg') || key.endsWith('.jpeg')) return 'image/jpeg';

  // Default fallback for unknown file types
  return 'application/octet-stream';
};

// Regional Lambda entry point
exports.handler = async (event) => {
  try {

    // Extract request path from different possible API Gateway formats
    const path =
      event.rawPath ||
      event.path ||
      event.requestContext?.http?.path ||
      '/';

    // Extract headers and query string parameters
    const headers = event.headers || {};
    const qs = event.queryStringParameters || {};

    // Normalise headers to lowercase to avoid case-sensitivity issues
    const normalizedHeaders = Object.fromEntries(
      Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])
    );

    let key;

    // Static asset request
    // Example: /assets/styles.css -> assets/styles.css
    if (path.startsWith('/assets/')) {
      key = path.replace(/^\/+/, '');
    } else {

      // HTML page request
      // Query parameter controls which page is returned
      // Supports: ?country=GB, ?country=US, ?country=SG, ?country=AU
      const qpRaw = qs.country || qs.Country || qs.c || '';

      // Header fallback used for testing if no query parameter is provided
      const hdrRaw = normalizedHeaders['x-test-country'] || '';

      // Query parameter takes priority, then header, then default
      const raw = qpRaw || hdrRaw || 'DEFAULT';

      // Convert input to uppercase for consistent matching
      const country = String(raw).toUpperCase();

      // Map country codes to S3 object keys
      const map = {
        GB: 'assets/uk.html',
        US: 'assets/us.html',
        SG: 'assets/sg.html',
        AU: 'assets/au.html'
      };

      // Fallback to default page if country is missing or unsupported
      key = map[country] || 'assets/index.html';
    }

    // Retrieve selected file from shared S3 bucket
    const result = await s3.send(
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: key
      })
    );

    // Convert S3 object stream into buffer
    const bodyBuffer = await streamToBuffer(result.Body);

    // Use S3 metadata content type if available, otherwise infer it
    const contentType = result.ContentType || getContentType(key);

    // Identify whether response should be returned as text or base64
    const isText =
      contentType.startsWith('text/') ||
      contentType.includes('javascript') ||
      contentType.includes('json') ||
      contentType.includes('svg');

    // Log routing and response information for validation/debugging
    console.log(JSON.stringify({
      msg: 'regional-s3-response',
      path,
      key,
      contentType,
      requestId: event.requestContext?.requestId || null,
      timestamp: new Date().toISOString()
    }));

    // Return HTTP response through API Gateway
    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType
      },

      // Text files return as UTF-8, binary files return as base64
      body: isText
        ? bodyBuffer.toString('utf-8')
        : bodyBuffer.toString('base64'),

      // API Gateway needs this flag for binary content
      isBase64Encoded: !isText
    };
  } catch (error) {

    // Log any S3 or processing errors
    console.error('regional-s3-error', error);

    // Return structured error response
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
