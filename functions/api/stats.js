export async function onRequestGet(context) {
  const { env } = context;
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const count = await env.DB.prepare('SELECT COUNT(*) as count FROM visitors3').first();
    const visitors = await env.DB.prepare('SELECT * FROM visitors3 ORDER BY id DESC LIMIT 500').all();
    
    return new Response(JSON.stringify({ 
      count: count.count, 
      visitors: visitors.results 
    }), { headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
