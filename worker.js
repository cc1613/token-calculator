// Cloudflare Worker - 访客统计 (D1 数据库版)
// 设置步骤：
// 1. 创建 D1 数据库: wrangler d1 create visitors
// 2. 绑定到 Worker: 变量名 DB
// 3. 初始化表: 访问 /init

export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // 初始化数据库表
    if (url.pathname === '/init') {
      await env.DB.exec(`
        CREATE TABLE IF NOT EXISTS visitors (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp TEXT,
          ip TEXT,
          country TEXT,
          city TEXT,
          region TEXT,
          url TEXT,
          referrer TEXT,
          ua TEXT,
          platform TEXT,
          language TEXT,
          screen TEXT,
          viewport TEXT,
          timezone TEXT,
          cores INTEGER,
          memory REAL,
          connection TEXT,
          touch INTEGER
        )
      `);
      return new Response('Database initialized', { headers: corsHeaders });
    }

    // 记录访客
    if (request.method === 'POST' && url.pathname === '/log') {
      try {
        const data = await request.json();
        
        await env.DB.prepare(`
          INSERT INTO visitors (timestamp, ip, country, city, region, url, referrer, ua, platform, language, screen, viewport, timezone, cores, memory, connection, touch)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          new Date().toISOString(),
          request.headers.get('CF-Connecting-IP') || '',
          request.headers.get('CF-IPCountry') || '',
          request.cf?.city || '',
          request.cf?.region || '',
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
        
        return new Response(JSON.stringify({ success: true, count: count.count }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 获取统计
    if (request.method === 'GET' && url.pathname === '/stats') {
      const count = await env.DB.prepare('SELECT COUNT(*) as count FROM visitors').first();
      const visitors = await env.DB.prepare('SELECT * FROM visitors ORDER BY id DESC LIMIT 500').all();
      
      return new Response(JSON.stringify({ 
        count: count.count, 
        visitors: visitors.results 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response('Visitor Stats API', { headers: corsHeaders });
  }
};
