export async function onRequestGet(context) {
  const { env } = context;
  
  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS visitors2 (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT,
        ip TEXT,
        country TEXT,
        city TEXT,
        region TEXT,
        asn TEXT,
        url TEXT,
        referrer TEXT,
        ua TEXT,
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
        webgl TEXT,
        historyLen INTEGER
      )
    `).run();
    return new Response('Database v2 initialized successfully');
  } catch (e) {
    return new Response('Error: ' + e.message, { status: 500 });
  }
}
