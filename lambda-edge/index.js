'use scrict';

exports.handler = async (event) => {
  const request = event.Records[0].cf.request;
  const headers = requests.headers;

  let country = 'DEFAULT';

  const cfCountry = headers['cloudfront-viewer-country'];
  if (cfCountry && cfCountry[0] && cfCountry[0].value) {
    country = cfCountry[0].value.toUpperCase();
  }

  if (request.querystring) {
    const match = request.querystring.match(/(?:^|&)country=(GB|US|SG|AU)(?:&|$)/i);
    if (match) {
      country = match[1].toUpperCase();
    }
  }

  const map = {
    GB: '/assets/uk.html',
    US: '/assets/us.html',
    SG: '/assets/sg.html',
    AU: '/assets/au.html'
  };

  const target = map[country] || '/assets/index.html';

  if (request.uri === '/' || request.uri === '/index.html') {
    request.uri = target;
  }

  console.log(JSON.stringify({
    country,
    target,
    finalUri: request.uri
  }));

  return request;
};
