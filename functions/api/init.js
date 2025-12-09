export async function onRequestGet(context) {
  const { env } = context;
  
  try {
    // 访客统计表
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS visitors3 (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT,
        fingerprint TEXT,
        ip TEXT,
        country TEXT,
        city TEXT,
        region TEXT,
        asn TEXT,
        url TEXT,
        referrer TEXT,
        ua TEXT,
        deviceType TEXT,
        os TEXT,
        osVer TEXT,
        device TEXT,
        browser TEXT,
        browserVer TEXT,
        platform TEXT,
        language TEXT,
        languages TEXT,
        screen TEXT,
        viewport TEXT,
        colorDepth INTEGER,
        pixelRatio REAL,
        timezone TEXT,
        cores INTEGER,
        memory REAL,
        gpu TEXT,
        connection TEXT,
        downlink REAL,
        rtt INTEGER,
        touch INTEGER,
        cookieEnabled INTEGER,
        doNotTrack TEXT,
        webdriver INTEGER,
        plugins INTEGER,
        online INTEGER,
        battery TEXT,
        historyLen INTEGER,
        arch TEXT,
        bits TEXT
      )
    `).run();
    
    // 用户表
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        token TEXT,
        created_at TEXT,
        last_login TEXT
      )
    `).run();
    
    // API Key 表
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        api_key TEXT NOT NULL,
        usage_data TEXT,
        error TEXT,
        note TEXT,
        created_at TEXT,
        updated_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `).run();
    
    // 添加 note 字段（如果表已存在）
    try {
      await env.DB.prepare('ALTER TABLE api_keys ADD COLUMN note TEXT').run();
    } catch (e) {
      // 字段已存在，忽略错误
    }
    
    // 添加 sort_order 字段
    try {
      await env.DB.prepare('ALTER TABLE api_keys ADD COLUMN sort_order INTEGER DEFAULT 0').run();
    } catch (e) {
      // 字段已存在，忽略错误
    }
    
    return new Response('Database initialized successfully (visitors3, users, api_keys)');
  } catch (e) {
    return new Response('Error: ' + e.message, { status: 500 });
  }
}
