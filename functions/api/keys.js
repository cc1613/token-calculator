// API Key 管理 API
export async function onRequest(context) {
    const { request, env } = context;
    
    const corsHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
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
    const user = await env.DB.prepare('SELECT id, username FROM users WHERE token = ?').bind(token).first();
    if (!user) {
        return new Response(JSON.stringify({ error: '登录已过期，请重新登录' }), { status: 401, headers: corsHeaders });
    }
    
    try {
        const url = new URL(request.url);
        
        // GET - 获取用户的所有 Key
        if (request.method === 'GET') {
            const keys = await env.DB.prepare(
                'SELECT id, api_key, usage_data, error, note, created_at, updated_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC'
            ).bind(user.id).all();
            
            return new Response(JSON.stringify({ keys: keys.results }), { headers: corsHeaders });
        }
        
        // POST - 添加新 Key
        if (request.method === 'POST') {
            const { apiKey } = await request.json();
            if (!apiKey) {
                return new Response(JSON.stringify({ error: '请输入 API Key' }), { status: 400, headers: corsHeaders });
            }
            
            // 检查 Key 是否已存在
            const existing = await env.DB.prepare('SELECT id FROM api_keys WHERE user_id = ? AND api_key = ?').bind(user.id, apiKey).first();
            if (existing) {
                return new Response(JSON.stringify({ error: '此 Key 已存在' }), { status: 400, headers: corsHeaders });
            }
            
            // 从 Factory API 获取 Key 信息
            let usageData = null;
            let error = null;
            try {
                const response = await fetch(`https://fk.776523718.xyz/api/check?key=${encodeURIComponent(apiKey)}`);
                const data = await response.json();
                if (data.error) {
                    error = data.error;
                } else if (data.usage) {
                    usageData = JSON.stringify(data.usage);
                }
            } catch (e) {
                error = '获取信息失败';
            }
            
            const result = await env.DB.prepare(
                'INSERT INTO api_keys (user_id, api_key, usage_data, error, created_at, updated_at) VALUES (?, ?, ?, ?, datetime("now"), datetime("now"))'
            ).bind(user.id, apiKey, usageData, error).run();
            
            return new Response(JSON.stringify({ 
                success: true, 
                id: result.meta.last_row_id,
                apiKey,
                usageData: usageData ? JSON.parse(usageData) : null,
                error
            }), { headers: corsHeaders });
        }
        
        // PATCH - 更新备注
        if (request.method === 'PATCH') {
            const { keyId, note } = await request.json();
            if (!keyId) {
                return new Response(JSON.stringify({ error: '缺少 Key ID' }), { status: 400, headers: corsHeaders });
            }
            
            await env.DB.prepare('UPDATE api_keys SET note = ?, updated_at = datetime("now") WHERE id = ? AND user_id = ?')
                .bind(note || null, keyId, user.id).run();
            
            return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        }
        
        // DELETE - 删除 Key
        if (request.method === 'DELETE') {
            const keyId = url.searchParams.get('id');
            if (!keyId) {
                return new Response(JSON.stringify({ error: '缺少 Key ID' }), { status: 400, headers: corsHeaders });
            }
            
            await env.DB.prepare('DELETE FROM api_keys WHERE id = ? AND user_id = ?').bind(keyId, user.id).run();
            return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        }
        
        return new Response(JSON.stringify({ error: '无效请求' }), { status: 400, headers: corsHeaders });
        
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
}
