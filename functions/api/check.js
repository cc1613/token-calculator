export async function onRequest(context) {
    const url = new URL(context.request.url);
    const key = url.searchParams.get('key');
    
    if (!key) {
        return new Response(JSON.stringify({ error: 'Missing key parameter' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
    
    try {
        // Use the reference site's API as proxy for now
        const response = await fetch(`https://fk.776523718.xyz/api/check?key=${encodeURIComponent(key)}`);
        const data = await response.json();
        
        return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to check key' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }
}
