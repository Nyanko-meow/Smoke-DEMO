// Script to set up test token for frontend testing
// Run this in browser console after opening the app

const jwt = require('jsonwebtoken');
const JWT_SECRET = 'smokeking_secret_key_ultra_secure_2024';

// Create member token
const memberPayload = {
    id: 2,
    email: 'member@example.com',
    role: 'member'
};

const memberToken = jwt.sign(memberPayload, JWT_SECRET, { expiresIn: '24h' });

console.log('🔑 Copy and paste these commands in browser console:');
console.log('');
console.log('// Set token');
console.log(`localStorage.setItem('token', '${memberToken}');`);
console.log('');
console.log('// Set user info');
console.log(`localStorage.setItem('user', '${JSON.stringify({
    UserID: 2,
    id: 2,
    Email: 'member@example.com',
    Role: 'member',
    FirstName: 'Member',
    LastName: 'User'
})}');`);
console.log('');
console.log('// Also set member-specific storage');
console.log(`localStorage.setItem('memberToken', '${memberToken}');`);
console.log(`localStorage.setItem('member', '${JSON.stringify({
    UserID: 2,
    id: 2,
    Email: 'member@example.com',
    Role: 'member',
    FirstName: 'Member',
    LastName: 'User'
})}');`);
console.log('');
console.log('✅ After running these commands, refresh the page and try the feedback feature!'); 