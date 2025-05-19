-- Check if plans already exist
IF NOT EXISTS (SELECT 1 FROM MembershipPlans)
BEGIN
    -- Insert basic membership plans
    INSERT INTO MembershipPlans (Name, Description, Price, Duration, Features)
    VALUES 
        ('Basic Plan', 'Get started on your smoke-free journey with our basic plan.', 99.00, 30, 
         'Progress tracking, Basic quitting tips, Community access'),
        
        ('Premium Plan', 'Enhanced support for your smoke-free journey.', 199.00, 60, 
         'Progress tracking, Advanced analytics, Premium quitting strategies, Community access, Weekly motivation'),
        
        ('Pro Plan', 'Maximum support to ensure your success.', 299.00, 90, 
         'Progress tracking, Advanced analytics, Pro quitting strategies, Community access, Daily motivation, Personalized coaching, Health improvement dashboard');

    PRINT 'Membership plans have been seeded successfully.'
END
ELSE
BEGIN
    PRINT 'Membership plans already exist in the database.'
END 