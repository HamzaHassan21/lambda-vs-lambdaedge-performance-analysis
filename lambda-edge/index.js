'use strict';

exports.handler = async (event) => {
  const cf = event.Records[0].cf;

  // ===== Viewer Response =====
  if (cf.response) {
    const response = cf.response;
    const request = cf.request;

    const country = (request.headers['x-country-debug'] && request.headers['x-country-debug'][0])
      ? request.headers['x-country-debug'][0].value
      : 'NONE';

    // Debug headers (unchanged)
    response.headers['x-debug-country'] = [{ key: 'X-Debug-Country', value: country }];
    response.headers['x-debug-uri'] = [{ key: 'X-Debug-URI', value: request.uri }];

    // CloudWatch log (added)
    console.log("EDGE_VIEWER_RESPONSE", JSON.stringify({
      debugCountry: country,
      uri: request.uri
    }));

    return response;
  }

  // ===== Viewer Request =====
  const request = cf.request;
  const headers = request.headers;

  // 1) Real geo (CloudFront header)
  const h = headers['cloudfront-viewer-country'];
  let country = (h && h[0] && h[0].value) ? h[0].value.toUpperCase() : 'DEFAULT';

  // 2) OPTIONAL: query override for demo/testing
  // e.g. /?country=SG
  if (request.querystring) {
    const m = request.querystring.match(/(?:^|&)country=(GB|US|SG|AU)(?:&|$)/i);
    if (m) country = m[1].toUpperCase();
  }

  // store for viewer-response debug
  request.headers['x-country-debug'] = [{ key: 'X-Country-Debug', value: country }];

  const map = { GB: '/uk.html', US: '/us.html', SG: '/sg.html', AU: '/au.html' };
  const target = map[country] || '/index.html';

  if (request.uri === '/' || request.uri === '/index.html') {
    request.uri = target;
  }

  // CloudWatch log (added)
  console.log("EDGE_VIEWER_REQUEST", JSON.stringify({
    country,
    target,
    uri: request.uri,
    qs: request.querystring
  }));

  return request;
};