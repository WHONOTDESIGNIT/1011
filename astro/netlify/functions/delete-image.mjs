import { getStore } from '@netlify/blobs';

export const handler = async (event, context) => {
  if (event.httpMethod !== 'DELETE') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const key = event.queryStringParameters?.key;

  if (!key) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing key parameter' }),
    };
  }

  try {
    const imageStore = getStore({
      name: 'user-uploads',
      consistency: 'strong',
      siteID: process.env.MY_SITE_ID || process.env.SITE_ID || process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_ACCESS_TOKEN,
    });

    await imageStore.delete(key);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, key }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message, stack: error.stack }),
    };
  }
};
