export async function onRequestGet(context) {
  const { env } = context;
  
  try {
    // 从旧表读取数据
    const oldData = await env.DB.prepare('SELECT * FROM visitors ORDER BY id').all();
    const rows = oldData.results || [];
    
    let migrated = 0;
    for (const r of rows) {
      await env.DB.prepare(`
        INSERT INTO visitors2 (timestamp, ip, country, city, region, asn, url, referrer, ua, platform, language, languages, screen, viewport, colorDepth, pixelRatio, timezone, cores, memory, connection, downlink, rtt, touch, cookieEnabled, doNotTrack, webdriver, plugins, online, battery, webgl, historyLen)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        r.timestamp || '',
        r.ip || '',
        r.country || '',
        r.city || '',
        r.region || '',
        '',
        r.url || '',
        r.referrer || '',
        r.ua || '',
        r.platform || '',
        r.language || '',
        '',
        r.screen || '',
        r.viewport || '',
        0,
        1,
        r.timezone || '',
        r.cores || 0,
        r.memory || 0,
        r.connection || '',
        0,
        0,
        r.touch || 0,
        0,
        '',
        0,
        0,
        1,
        '',
        '',
        0
      ).run();
      migrated++;
    }
    
    // 删除旧表
    await env.DB.prepare('DROP TABLE IF EXISTS visitors').run();
    
    return new Response(`Migration complete. Migrated ${migrated} records. Old table dropped.`);
  } catch (e) {
    return new Response('Error: ' + e.message, { status: 500 });
  }
}
