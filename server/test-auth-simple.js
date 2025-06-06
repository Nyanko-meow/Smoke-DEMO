const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'smokeking_secret_key_ultra_secure_2024';

console.log('🔍 Testing JWT and Authorization Logic...\n');

// Test 1: Create and decode member token
console.log('1️⃣ Testing member token creation and decoding...');
const memberPayload = {
    id: 2,
    email: 'member@example.com',
    role: 'member'
};

const memberToken = jwt.sign(memberPayload, JWT_SECRET, { expiresIn: '24h' });
console.log('✅ Member token created');

const decodedMember = jwt.verify(memberToken, JWT_SECRET);
console.log('✅ Member token decoded:', decodedMember);

// Test 2: Test authorization logic
console.log('\n2️⃣ Testing authorization logic...');
const requiredRoles = ['member', 'guest'];
const userRole = 'member';

console.log('Required roles:', requiredRoles);
console.log('User role:', userRole);
console.log('Role type:', typeof userRole);
console.log('Includes check:', requiredRoles.includes(userRole));

if (requiredRoles.includes(userRole)) {
    console.log('✅ Authorization should PASS');
} else {
    console.log('❌ Authorization should FAIL');
}

// Test 3: Test with guest role
console.log('\n3️⃣ Testing with guest role...');
const guestRole = 'guest';
console.log('Guest role:', guestRole);
console.log('Includes check:', requiredRoles.includes(guestRole));

if (requiredRoles.includes(guestRole)) {
    console.log('✅ Guest authorization should PASS');
} else {
    console.log('❌ Guest authorization should FAIL');
}

// Test 4: Test with coach role (should fail)
console.log('\n4️⃣ Testing with coach role (should fail)...');
const coachRole = 'coach';
console.log('Coach role:', coachRole);
console.log('Includes check:', requiredRoles.includes(coachRole));

if (requiredRoles.includes(coachRole)) {
    console.log('❌ Coach authorization should NOT pass');
} else {
    console.log('✅ Coach authorization correctly FAILS');
}

console.log('\n🎉 Authorization logic test completed!'); 