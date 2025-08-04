// Request/Response logging middleware
const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    
    // Log incoming request
    console.log('\n🌐 ========== INCOMING REQUEST ==========');
    console.log('📍 URL:', req.method, req.originalUrl);
    console.log('⏰ Time:', new Date().toISOString());
    console.log('🌐 IP:', req.ip || req.connection.remoteAddress);
    console.log('📧 Headers:', JSON.stringify(req.headers, null, 2));
    console.log('📦 Query:', JSON.stringify(req.query, null, 2));
    console.log('📄 Body:', JSON.stringify(req.body, null, 2));
    
    // Capture original response methods
    const originalSend = res.send;
    const originalJson = res.json;
    
    // Override res.send to log response
    res.send = function(data) {
        const duration = Date.now() - startTime;
        console.log('\n📤 ========== OUTGOING RESPONSE ==========');
        console.log('📍 URL:', req.method, req.originalUrl);
        console.log('📊 Status:', res.statusCode);
        console.log('⏱️ Duration:', duration + 'ms');
        console.log('📄 Response Data:', typeof data === 'string' ? data.substring(0, 500) + (data.length > 500 ? '...' : '') : data);
        console.log('📤 ========== RESPONSE END ==========\n');
        
        return originalSend.call(this, data);
    };
    
    // Override res.json to log response
    res.json = function(data) {
        const duration = Date.now() - startTime;
        console.log('\n📤 ========== OUTGOING JSON RESPONSE ==========');
        console.log('📍 URL:', req.method, req.originalUrl);
        console.log('📊 Status:', res.statusCode);
        console.log('⏱️ Duration:', duration + 'ms');
        console.log('📄 JSON Data:', JSON.stringify(data, null, 2));
        console.log('📤 ========== JSON RESPONSE END ==========\n');
        
        return originalJson.call(this, data);
    };
    
    next();
};

module.exports = requestLogger;