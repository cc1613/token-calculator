// 用户注册/登录 API
export async function onRequest(context) {
    const { request, env } = context;
    
    const corsHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };
    
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }
    
    try {
        const { action, username, password } = await request.json();
        
        if (!username || !password) {
            return new Response(JSON.stringify({ error: '请输入用户名和密码' }), { status: 400, headers: corsHeaders });
        }
        
        // 简单的密码哈希（生产环境应使用更安全的方式）
        const hashPassword = async (pwd) => {
            const encoder = new TextEncoder();
            const data = encoder.encode(pwd + 'factory_salt_2024');
            const hash = await crypto.subtle.digest('SHA-256', data);
            return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
        };
        
        const pwdHash = await hashPassword(password);
        
        if (action === 'register') {
            // 检查用户名是否存在
            const existing = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
            if (existing) {
                return new Response(JSON.stringify({ error: '用户名已存在' }), { status: 400, headers: corsHeaders });
            }
            
            // 创建用户
            const result = await env.DB.prepare('INSERT INTO users (username, password, created_at) VALUES (?, ?, datetime("now"))').bind(username, pwdHash).run();
            const userId = result.meta.last_row_id;
            
            // 生成 token
            const token = crypto.randomUUID();
            await env.DB.prepare('UPDATE users SET token = ? WHERE id = ?').bind(token, userId).run();
            
            return new Response(JSON.stringify({ success: true, userId, username, token }), { headers: corsHeaders });
            
        } else if (action === 'login') {
            const user = await env.DB.prepare('SELECT id, username, password FROM users WHERE username = ?').bind(username).first();
            if (!user || user.password !== pwdHash) {
                return new Response(JSON.stringify({ error: '用户名或密码错误' }), { status: 401, headers: corsHeaders });
            }
            
            // 生成新 token
            const token = crypto.randomUUID();
            await env.DB.prepare('UPDATE users SET token = ?, last_login = datetime("now") WHERE id = ?').bind(token, user.id).run();
            
            return new Response(JSON.stringify({ success: true, userId: user.id, username: user.username, token }), { headers: corsHeaders });
        }
        
        return new Response(JSON.stringify({ error: '无效操作' }), { status: 400, headers: corsHeaders });
        
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
}
