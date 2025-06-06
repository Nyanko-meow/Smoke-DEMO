// Instructions for clearing frontend cache

console.log('🧹 Frontend Cache Clearing Instructions');
console.log('=====================================\n');

console.log('🔍 Problem Analysis:');
console.log('   - Database has 3 test pending payments');
console.log('   - Admin dashboard shows 14 duplicate notifications');
console.log('   - This indicates frontend cache or old data issue\n');

console.log('✅ Solutions to Try:');
console.log('');

console.log('1. 📱 Clear Browser Cache:');
console.log('   - Press F12 (open DevTools)');
console.log('   - Right-click refresh button → "Empty Cache and Hard Reload"');
console.log('   - Or Ctrl+Shift+Delete → Clear all data');
console.log('');

console.log('2. 🔄 Restart Development Servers:');
console.log('   - Stop backend server (Ctrl+C)');
console.log('   - Stop frontend server (Ctrl+C)');
console.log('   - Restart backend: cd server && node src/index.js');
console.log('   - Restart frontend: cd client && npm start');
console.log('');

console.log('3. 💾 Clear Local Storage:');
console.log('   - Open DevTools (F12)');
console.log('   - Go to Application tab');
console.log('   - Clear Local Storage and Session Storage');
console.log('   - Clear all cookies for localhost');
console.log('');

console.log('4. 🗑️ Clear Database and Restart Fresh:');
console.log('   - Run: node clear-test-payments.js');
console.log('   - Run: node create-test-payments.js');
console.log('   - Restart backend server');
console.log('');

console.log('5. 🔧 Check API Endpoint Directly:');
console.log('   - Use Postman or curl to test:');
console.log('   - GET http://localhost:4000/api/admin/pending-payments');
console.log('   - This will show actual API response');
console.log('');

console.log('6. 🎯 Force Refresh Admin Dashboard:');
console.log('   - Login as admin');
console.log('   - Go to Payment Management');
console.log('   - Click "Làm mới" button');
console.log('   - Should reload data from backend');
console.log('');

console.log('🚀 Quick Fix Command Sequence:');
console.log('   cd server');
console.log('   node clear-test-payments.js');
console.log('   node create-test-payments.js');
console.log('   node src/index.js');
console.log('');
console.log('   Then in browser:');
console.log('   - Clear cache (Ctrl+Shift+Delete)');
console.log('   - Refresh admin page (F5)');
console.log('');

console.log('✅ Expected Result:');
console.log('   - Should see exactly 3 pending payments');
console.log('   - All for user "Tran Huy (leghenkiz@gmail.com)"');
console.log('   - No duplicates or old cached data');

// Additional help script for testing
const testQueries = `
-- Quick SQL test queries for checking data:

-- Check assigned coach
SELECT c.FirstName + ' ' + c.LastName as CoachName, qp.Status 
FROM QuitPlans qp 
INNER JOIN Users c ON qp.CoachID = c.UserID 
WHERE qp.UserID = 2 AND qp.Status = 'active';

-- Check completed appointments needing feedback
SELECT ca.AppointmentID, ca.Status, c.FirstName as Coach
FROM ConsultationAppointments ca
INNER JOIN Users c ON ca.CoachID = c.UserID
LEFT JOIN CoachFeedback cf ON ca.AppointmentID = cf.AppointmentID AND cf.MemberID = 2
WHERE ca.MemberID = 2 AND ca.Status = 'completed' AND cf.FeedbackID IS NULL;
`;

console.log('');
console.log('📋 SQL Test Queries:');
console.log(testQueries); 