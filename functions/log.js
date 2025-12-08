export async function onRequestPost(context) {
  const { request, env } = context;
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const data = await request.json();
    
    await env.DB.prepare(`
      INSERT INTO visitors (timestamp, ip, country, city, region, url, referrer, ua, platform, language, screen, viewport, timezone, cores, memory, connection, touch)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      new Date().toISOString(),
      request.headers.get('CF-Connecting-IP') || '',
      request.headers.get('CF-IPCountry') || '',
      context.cf?.city || '',
      context.cf?.region || '',
      data.url || '',
      data.referrer || '',
      data.ua || '',
      data.platform || '',
      data.language || '',
      data.screen || '',
      data.viewport || '',
      data.timezone || '',
      data.cores || 0,
      data.memory || 0,
      data.connection || '',
      data.touch || 0
    ).run();
    
    const count = await env.DB.prepare('SELECT COUNT(*) as count FROM visitors').first();
    
    return new Response(JSON.stringify({ success: true, count: count.count }), { headers: corsHeaders });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
