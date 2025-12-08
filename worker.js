// Cloudflare Worker - 访客统计
// 使用前需要：1. 创建 KV namespace 命名为 VISITORS  2. 绑定到此 Worker

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

    // 记录访客
    if (request.method === 'POST' && url.pathname === '/log') {
      try {
        const data = await request.json();
        const id = Date.now() + '_' + Math.random().toString(36).slice(2);
        
        // 添加 IP 和时间戳
        data.ip = request.headers.get('CF-Connecting-IP') || 'unknown';
        data.country = request.headers.get('CF-IPCountry') || 'unknown';
        data.city = request.cf?.city || 'unknown';
        data.timestamp = new Date().toISOString();
        
        await env.VISITORS.put(id, JSON.stringify(data), { expirationTtl: 86400 * 30 }); // 保存30天
        
        // 更新计数
        const count = parseInt(await env.VISITORS.get('_count') || '0') + 1;
        await env.VISITORS.put('_count', count.toString());
        
        return new Response(JSON.stringify({ success: true, count }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 获取统计（可选：添加密码保护）
    if (request.method === 'GET' && url.pathname === '/stats') {
      const list = await env.VISITORS.list();
      const visitors = [];
      
      for (const key of list.keys) {
        if (!key.name.startsWith('_')) {
          const data = await env.VISITORS.get(key.name);
          if (data) visitors.push(JSON.parse(data));
        }
      }
      
      const count = await env.VISITORS.get('_count') || '0';
      
      return new Response(JSON.stringify({ count: parseInt(count), visitors }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response('Token Calculator Visitor API', { headers: corsHeaders });
  }
};
