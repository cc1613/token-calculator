export async function onRequestPost(context) {
  const { request, env } = context;
  const cf = request.cf || {};
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const data = await request.json();
    
    await env.DB.prepare(`
      INSERT INTO visitors3 (timestamp, fingerprint, ip, country, city, region, asn, url, referrer, ua, deviceType, os, osVer, device, browser, browserVer, platform, language, languages, screen, viewport, colorDepth, pixelRatio, timezone, cores, memory, gpu, connection, downlink, rtt, touch, cookieEnabled, doNotTrack, webdriver, plugins, online, battery, historyLen, arch, bits)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      new Date().toISOString(),
      data.fingerprint || '',
      request.headers.get('CF-Connecting-IP') || '',
      request.headers.get('CF-IPCountry') || '',
      cf.city || '',
      cf.region || '',
      cf.asn ? 'AS' + cf.asn : '',
      data.url || '',
      data.referrer || '',
      data.ua || '',
      data.deviceType || '',
      data.os || '',
      data.osVer || '',
      data.device || '',
      data.browser || '',
      data.browserVer || '',
      data.platform || '',
      data.language || '',
      data.languages || '',
      data.screen || '',
      data.viewport || '',
      data.colorDepth || 0,
      data.pixelRatio || 1,
      data.timezone || '',
      data.cores || 0,
      data.memory || 0,
      data.gpu || '',
      data.connection || '',
      data.downlink || 0,
      data.rtt || 0,
      data.touch || 0,
      data.cookieEnabled ? 1 : 0,
      data.doNotTrack || '',
      data.webdriver ? 1 : 0,
      data.plugins || 0,
      data.online ? 1 : 0,
      data.battery || '',
      data.historyLen || 0,
      data.arch || '',
      data.bits || ''
    ).run();
    
    const count = await env.DB.prepare('SELECT COUNT(*) as count FROM visitors3').first();
    
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
