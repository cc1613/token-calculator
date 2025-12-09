// 保存 Key 顺序 API
export async function onRequest(context) {
    const { request, env } = context;
    
    const corsHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };
    
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }
    
    // 验证用户 token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: '未登录' }), { status: 401, headers: corsHeaders });
    }
    
    const token = authHeader.substring(7);
    const user = await env.DB.prepare('SELECT id FROM users WHERE token = ?').bind(token).first();
    if (!user) {
        return new Response(JSON.stringify({ error: '登录已过期' }), { status: 401, headers: corsHeaders });
    }
    
    try {
        const { order } = await request.json();
        
        if (!Array.isArray(order)) {
            return new Response(JSON.stringify({ error: '无效的顺序数据' }), { status: 400, headers: corsHeaders });
        }
        
        // 更新每个 key 的排序值
        for (let i = 0; i < order.length; i++) {
            await env.DB.prepare('UPDATE api_keys SET sort_order = ? WHERE id = ? AND user_id = ?')
                .bind(i, order[i], user.id).run();
        }
        
        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
}
