-- Test script for UserMemberships INSERT
USE SMOKEKING;
GO

-- Check current MembershipPlans
SELECT PlanID, Name, Duration FROM MembershipPlans;

-- Test membership insert
DECLARE @userID INT = 2;
DECLARE @planID INT = 1;

-- Check if the plan exists first
IF NOT EXISTS (SELECT 1 FROM MembershipPlans WHERE PlanID = @planID)
BEGIN
    PRINT 'Plan with ID ' + CAST(@planID AS NVARCHAR) + ' does not exist. Skipping membership insert.';
END
ELSE
BEGIN
    DECLARE @amount DECIMAL(10,2) = (SELECT Price FROM MembershipPlans WHERE PlanID = @planID);
    DECLARE @duration INT = (SELECT Duration FROM MembershipPlans WHERE PlanID = @planID);
    DECLARE @startDate DATETIME = GETDATE();
    DECLARE @endDate DATETIME = DATEADD(DAY, @duration, @startDate);

    -- Debug: Print the calculated values
    PRINT 'PlanID: ' + CAST(@planID AS NVARCHAR);
    PRINT 'Duration: ' + CAST(@duration AS NVARCHAR);
    PRINT 'StartDate: ' + CAST(@startDate AS NVARCHAR);
    PRINT 'EndDate: ' + CAST(@endDate AS NVARCHAR);

    -- Clear existing sample membership before inserting
    DELETE FROM UserMemberships WHERE UserID = @userID AND PlanID = @planID;

    -- Insert membership
    INSERT INTO UserMemberships (UserID, PlanID, StartDate, EndDate, Status)
    VALUES (@userID, @planID, @startDate, @endDate, 'active');
    
    PRINT 'UserMembership inserted successfully for UserID: ' + CAST(@userID AS NVARCHAR);
END

-- Verify the insert
SELECT UserID, PlanID, StartDate, EndDate, Status FROM UserMemberships WHERE UserID = 2; 