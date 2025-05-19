/**
 * Test script for payment processing functionality
 * To run: node src/utils/payment-test.js
 */

const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:3001/api';
let authToken = '';

// Test user credentials 
const testUser = {
    email: 'test@example.com',
    password: 'password123'
};

// Test payment details
const testPayment = {
    planId: 1, // Assuming plan ID 1 exists
    cardNumber: '4242424242424242', // Test card number
    cardHolder: 'John Doe',
    expiryDate: '12/25',
    cvv: '123',
    billingAddress: '123 Test Street, Test City, 12345'
};

const testPaymentFlow = async () => {
    try {
        console.log('Starting payment flow test...');

        // Step 1: Login to get auth token
        console.log('\n1. Logging in as test user...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, testUser);

        if (loginRes.data.success) {
            authToken = loginRes.data.token;
            console.log('Login successful, received auth token');
        } else {
            console.error('Login failed:', loginRes.data.message);
            return;
        }

        // Step 2: Get user status before payment
        console.log('\n2. Checking user status before payment...');
        const beforeStatusRes = await axios.get(
            `${API_URL}/users/status`,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        if (beforeStatusRes.data.success) {
            console.log(`Current role: ${beforeStatusRes.data.data.user.role}`);
            console.log(`Subscribed: ${beforeStatusRes.data.data.isSubscribed}`);
        } else {
            console.error('Failed to get user status');
        }

        // Step 3: Get available plans
        console.log('\n3. Fetching available subscription plans...');
        const plansRes = await axios.get(`${API_URL}/subscriptions/plans`);

        if (!plansRes.data.success || !plansRes.data.data.length) {
            console.error('Failed to fetch plans or no plans available');
            return;
        }

        const plans = plansRes.data.data;
        console.log(`Found ${plans.length} subscription plans:`);
        plans.forEach(plan => {
            console.log(`- ${plan.Name}: ${plan.Price} (${plan.Duration} days)`);
        });

        // Update test payment with actual plan ID if available
        if (plans.length > 0) {
            testPayment.planId = plans[0].PlanID;
        }

        // Step 4: Process payment
        console.log('\n4. Processing payment...');
        const paymentRes = await axios.post(
            `${API_URL}/payments/process`,
            testPayment,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        if (paymentRes.data.success) {
            console.log('Payment successful!');
            console.log(`Transaction ID: ${paymentRes.data.data.payment.TransactionID}`);
            console.log(`Card: ${paymentRes.data.data.payment.cardDetails.cardNumber}`);
            console.log(`End Date: ${paymentRes.data.data.membershipEndDate}`);
        } else {
            console.error('Payment failed:', paymentRes.data.message);
            return;
        }

        // Step 5: Get user status after payment
        console.log('\n5. Checking user status after payment...');
        const afterStatusRes = await axios.get(
            `${API_URL}/users/status`,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        if (afterStatusRes.data.success) {
            console.log(`New role: ${afterStatusRes.data.data.user.role}`);
            console.log(`Subscribed: ${afterStatusRes.data.data.isSubscribed}`);
            if (afterStatusRes.data.data.membership) {
                console.log(`Plan: ${afterStatusRes.data.data.membership.planName}`);
                console.log(`Days remaining: ${afterStatusRes.data.data.membership.daysRemaining}`);
            }
        } else {
            console.error('Failed to get updated user status');
        }

        console.log('\nPayment flow test completed successfully!');

    } catch (error) {
        console.error('Error during test:', error.response?.data || error.message);
    }
};

// Run the test
testPaymentFlow(); 