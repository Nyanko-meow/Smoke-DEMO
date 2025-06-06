// Test the selectedPlan validation logic
function testSelectedPlanValidation() {
    console.log('🧪 Testing selectedPlan validation logic\n');

    // Test cases
    const testCases = [
        {
            name: 'Valid plan object',
            selectedPlan: {
                PlanID: 1,
                Name: 'Premium',
                Price: 199000,
                Duration: 60
            },
            expected: 'PASS'
        },
        {
            name: 'Plan with missing PlanID',
            selectedPlan: {
                Name: 'Premium',
                Price: 199000,
                Duration: 60
            },
            expected: 'FAIL - No PlanID'
        },
        {
            name: 'Plan with null PlanID',
            selectedPlan: {
                PlanID: null,
                Name: 'Premium',
                Price: 199000,
                Duration: 60
            },
            expected: 'FAIL - Null PlanID'
        },
        {
            name: 'Plan with undefined PlanID',
            selectedPlan: {
                PlanID: undefined,
                Name: 'Premium',
                Price: 199000,
                Duration: 60
            },
            expected: 'FAIL - Undefined PlanID'
        },
        {
            name: 'Null selectedPlan',
            selectedPlan: null,
            expected: 'FAIL - Null plan'
        },
        {
            name: 'Undefined selectedPlan',
            selectedPlan: undefined,
            expected: 'FAIL - Undefined plan'
        }
    ];

    testCases.forEach((testCase, index) => {
        console.log(`\n${index + 1}. Testing: ${testCase.name}`);
        console.log('Input:', testCase.selectedPlan);

        // Apply the validation logic
        let result = 'UNKNOWN';

        if (!testCase.selectedPlan) {
            result = 'FAIL - selectedPlan is null or undefined';
        } else if (!testCase.selectedPlan.PlanID) {
            result = 'FAIL - selectedPlan exists but PlanID is missing/null/undefined';
        } else {
            result = 'PASS - validation successful';
        }

        console.log('Result:', result);
        console.log('Expected:', testCase.expected);
        console.log('Status:', result.includes('PASS') === testCase.expected.includes('PASS') ? '✅ CORRECT' : '❌ MISMATCH');
    });

    console.log('\n🎉 Validation logic test completed!');
}

// Run the test
testSelectedPlanValidation(); 