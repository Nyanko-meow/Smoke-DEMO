/**
 * Test script for subscription functionality
 * To run: node src/utils/subscription-test.js
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

const testSubscription = async () => {
    try {
        console.log('Starting subscription flow test...');

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

        // Step 2: Get available subscription plans
        console.log('\n2. Fetching available subscription plans...');
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

        // Step 3: Select the first plan
        const selectedPlan = plans[0];
        console.log(`\n3. Selected plan: ${selectedPlan.Name} (${selectedPlan.Price})`);

        // Step 4: Subscribe to the plan
        console.log(`\n4. Subscribing to ${selectedPlan.Name}...`);
        const subscribeRes = await axios.post(
            `${API_URL}/subscriptions/subscribe`,
            { planId: selectedPlan.PlanID },
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        if (subscribeRes.data.success) {
            console.log('Subscription successful!');
            console.log(`Plan: ${subscribeRes.data.data.plan.Name}`);
            console.log(`Amount: ${subscribeRes.data.data.payment.Amount}`);
            console.log(`Start Date: ${subscribeRes.data.data.membership.StartDate}`);
            console.log(`End Date: ${subscribeRes.data.data.membership.EndDate}`);
        } else {
            console.error('Subscription failed:', subscribeRes.data.message);
        }

        // Step 5: Get active subscription
        console.log('\n5. Fetching active subscription...');
        const activeSubRes = await axios.get(
            `${API_URL}/subscriptions/active`,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );

        if (activeSubRes.data.success && activeSubRes.data.data) {
            console.log('Active subscription found:');
            console.log(`Plan: ${activeSubRes.data.data.PlanName}`);
            console.log(`Days Remaining: ${activeSubRes.data.data.DaysRemaining}`);
        } else {
            console.error('No active subscription found');
        }

        console.log('\nSubscription flow test completed successfully!');

    } catch (error) {
        console.error('Error during test:', error.response?.data || error.message);
    }
};

// Run the test
testSubscription(); 