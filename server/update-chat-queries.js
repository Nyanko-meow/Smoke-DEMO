const fs = require('fs');
const path = require('path');

// Read the chat routes file
const filePath = path.join(__dirname, 'src/routes/chat.routes.js');
let content = fs.readFileSync(filePath, 'utf8');

// Define the file columns to add
const fileColumns = `                    m.FileUrl,
                    m.FileName,
                    m.FileSize,
                    m.FileType,`;

// Pattern to match SELECT queries from Messages table
const selectPattern = /(SELECT\s+[\s\S]*?m\.CreatedAt,)([\s\S]*?u\.FirstName \+ ' ' \+ u\.LastName as SenderName,)/g;

// Replace all occurrences
content = content.replace(selectPattern, (match, selectPart, userPart) => {
    return selectPart + '\n' + fileColumns + '\n' + userPart;
});

// Write the updated content back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Updated all Messages queries in chat.routes.js to include file columns');
console.log('📁 File columns added: FileUrl, FileName, FileSize, FileType'); 