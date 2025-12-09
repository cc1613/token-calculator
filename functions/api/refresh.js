// 刷新 Key 信息 API
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
        const { keyId } = await request.json();
        
        // 获取 Key
        const keyRecord = await env.DB.prepare('SELECT api_key FROM api_keys WHERE id = ? AND user_id = ?').bind(keyId, user.id).first();
        if (!keyRecord) {
            return new Response(JSON.stringify({ error: 'Key 不存在' }), { status: 404, headers: corsHeaders });
        }
        
        // 从 Factory API 获取最新信息
        let usageData = null;
        let error = null;
        try {
            const response = await fetch(`https://fk.776523718.xyz/api/check?key=${encodeURIComponent(keyRecord.api_key)}`);
            const data = await response.json();
            if (data.error) {
                error = data.error;
            } else if (data.usage) {
                usageData = JSON.stringify(data.usage);
            }
        } catch (e) {
            error = '获取信息失败';
        }
        
        // 更新数据库
        await env.DB.prepare('UPDATE api_keys SET usage_data = ?, error = ?, updated_at = datetime("now") WHERE id = ?')
            .bind(usageData, error, keyId).run();
        
        return new Response(JSON.stringify({ 
            success: true,
            usageData: usageData ? JSON.parse(usageData) : null,
            error
        }), { headers: corsHeaders });
        
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
}
