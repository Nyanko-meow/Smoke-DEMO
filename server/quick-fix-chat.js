const fs = require('fs');
const path = require('path');

console.log('🔧 Quick fix for chat routes...');

const chatRoutesPath = path.join(__dirname, 'src/routes/chat.routes.js');
let content = fs.readFileSync(chatRoutesPath, 'utf8');

// Remove file columns from SELECT statements
const patterns = [
    /\s*m\.FileUrl,\s*/g,
    /\s*m\.FileName,\s*/g,
    /\s*m\.FileSize,\s*/g,
    /\s*m\.FileType,\s*/g,
    /\s*FileUrl,\s*/g,
    /\s*FileName,\s*/g,
    /\s*FileSize,\s*/g,
    /\s*FileType,\s*/g
];

patterns.forEach(pattern => {
    content = content.replace(pattern, '\n                    ');
});

// Remove file parameters from INSERT statements
content = content.replace(
    /INSERT INTO Messages \([^)]*FileUrl[^)]*\)/g,
    'INSERT INTO Messages (SenderID, ReceiverID, Content, MessageType, RelatedPlanID)'
);

content = content.replace(
    /VALUES \([^)]*@fileUrl[^)]*\)/g,
    'VALUES (@senderId, @receiverId, @content, @messageType, @relatedPlanId)'
);

// Remove file input parameters
const inputPatterns = [
    /\.input\('fileUrl'[^)]*\)\s*/g,
    /\.input\('fileName'[^)]*\)\s*/g,
    /\.input\('fileSize'[^)]*\)\s*/g,
    /\.input\('fileType'[^)]*\)\s*/g
];

inputPatterns.forEach(pattern => {
    content = content.replace(pattern, '');
});

// Clean up any remaining file variable declarations
content = content.replace(/fileUrl\s*=\s*[^,;]+[,;]/g, '');
content = content.replace(/fileName\s*=\s*[^,;]+[,;]/g, '');
content = content.replace(/fileSize\s*=\s*[^,;]+[,;]/g, '');
content = content.replace(/fileType\s*=\s*[^,;]+[,;]/g, '');

// Write back
fs.writeFileSync(chatRoutesPath, content, 'utf8');

console.log('✅ Chat routes fixed!');
console.log('📋 Removed all file column references');
console.log('🚀 Chat should work now'); 