export async function onRequestGet(context) {
  const { env } = context;
  
  try {
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
    return new Response('Database initialized successfully');
  } catch (e) {
    return new Response('Error: ' + e.message, { status: 500 });
  }
}
