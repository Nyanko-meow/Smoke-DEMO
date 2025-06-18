-- Insert membership plans data
USE [SMOKEKING]

-- Delete existing plans (if any)
DELETE FROM MembershipPlans;

-- Reset Identity counter
DBCC CHECKIDENT ('MembershipPlans', RESEED, 0);

-- Insert plans matching the UI - Using N prefix for Unicode strings
INSERT INTO MembershipPlans (Name, Description, Price, Duration, Features)
VALUES 
        ('Basic Plan', 'Get started on your smoke-free journey with our basic plan.', 99.00, 30, 
         'Progress tracking, Basic quitting tips, Community access'),
        
        ('Premium Plan', 'Enhanced support for your smoke-free journey.', 199.00, 60, 
         'Progress tracking, Advanced analytics, Premium quitting strategies, Community access, Weekly motivation'),
        
        ('Pro Plan', 'Maximum support to ensure your success.', 299.00, 90, 
         'Progress tracking, Advanced analytics, Pro quitting strategies, Community access, Daily motivation, Personalized coaching, Health improvement dashboard');