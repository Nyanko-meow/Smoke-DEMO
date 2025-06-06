const fs = require('fs');
const path = require('path');

// Read the chat routes file
const filePath = path.join(__dirname, 'src/routes/chat.routes.js');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Fixing chat queries to remove file columns temporarily...');

// Remove file columns from all SELECT queries
const fileColumnsPattern = /\s*m\.FileUrl,\s*m\.FileName,\s*m\.FileSize,\s*m\.FileType,\s*/g;

// Replace all occurrences
content = content.replace(fileColumnsPattern, '\n                    ');

// Also remove duplicate file columns that might exist
const duplicateFilePattern = /\s*m\.FileUrl,\s*m\.FileName,\s*m\.FileSize,\s*m\.FileType,\s*m\.FileUrl,\s*m\.FileName,/g;
content = content.replace(duplicateFilePattern, '\n                    ');

// Clean up any remaining file column references
content = content.replace(/\s*m\.FileUrl,/g, '');
content = content.replace(/\s*m\.FileName,/g, '');
content = content.replace(/\s*m\.FileSize,/g, '');
content = content.replace(/\s*m\.FileType,/g, '');

// Write the updated content back to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Removed file columns from all Messages queries');
console.log('📋 Chat should work now without database update');
console.log('🔄 After updating database, you can add file columns back');

// Also fix the send message query to not include file columns
content = content.replace(
    /INSERT INTO Messages \(SenderID, ReceiverID, Content, MessageType, RelatedPlanID, FileUrl, FileName, FileSize, FileType\)/g,
    'INSERT INTO Messages (SenderID, ReceiverID, Content, MessageType, RelatedPlanID)'
);

content = content.replace(
    /VALUES \(@senderId, @receiverId, @content, @messageType, @relatedPlanId, @fileUrl, @fileName, @fileSize, @fileType\)/g,
    'VALUES (@senderId, @receiverId, @content, @messageType, @relatedPlanId)'
);

// Remove file input parameters
content = content.replace(/\.input\('fileUrl', fileUrl\)\s*/g, '');
content = content.replace(/\.input\('fileName', fileName\)\s*/g, '');
content = content.replace(/\.input\('fileSize', fileSize\)\s*/g, '');
content = content.replace(/\.input\('fileType', fileType\)\s*/g, '');

// Write the final content
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Fixed INSERT queries to not include file columns');
console.log('🎉 Chat routes should work now!'); 