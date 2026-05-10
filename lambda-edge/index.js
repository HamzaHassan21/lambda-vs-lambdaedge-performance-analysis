'use strict';

// Lambda@Edge entry point
exports.handler = async (event) => {

  // Extract CloudFront request object
  const request = event.Records[0].cf.request;

  // Extract request headers
  const headers = request.headers;

  // Default fallback country
  let country = 'DEFAULT';

  // Read CloudFront viewer country header
  // Example values: GB, US, SG, AU
  const cfCountry = headers['cloudfront-viewer-country'];

  // Validate header exists before accessing value
  if (cfCountry && cfCountry[0] && cfCountry[0].value) {

    // Convert country code to uppercase for consistency
    country = cfCountry[0].value.toUpperCase();
  }

  // Controlled testing override using query parameters
  // Example:
  // ?country=GB
  // ?country=US
  if (request.querystring) {

    // Regex checks for supported country values
    const match = request.querystring.match(
      /(?:^|&)country=(GB|US|SG|AU)(?:&|$)/i
    );

    // Override detected country if query parameter exists
    if (match) {
      country = match[1].toUpperCase();
    }
  }

  // Map country codes to specific HTML files
  const map = {
    GB: '/assets/uk.html',
    US: '/assets/us.html',
    SG: '/assets/sg.html',
    AU: '/assets/au.html'
  };

  // Fallback to default page if country not recognised
  const target = map[country] || '/assets/index.html';

  // Rewrite request URI only for root requests
  // Example:
  // /  -> /assets/uk.html
  if (request.uri === '/' || request.uri === '/index.html') {
    request.uri = target;
  }

  // Log routing information for debugging/validation
  console.log(JSON.stringify({
    country,
    target,
    finalUri: request.uri
  }));

  // Return modified request back to CloudFront
  // CloudFront then handles caching and S3 retrieval
  return request;
};
