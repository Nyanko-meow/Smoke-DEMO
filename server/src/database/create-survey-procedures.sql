-- Create stored procedure to check survey eligibility
CREATE OR ALTER PROCEDURE sp_CheckSurveyEligibility
    @userID INT,
    @membershipID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @canTakeSurvey BIT = 1;
    DECLARE @message NVARCHAR(500) = N'Bạn có thể thực hiện khảo sát.';
    
    -- Check if user has already completed survey for this membership
    DECLARE @existingSurveyCount INT;
    
    SELECT @existingSurveyCount = COUNT(*)
    FROM SurveyResults sr
    WHERE sr.UserID = @userID 
    AND sr.MembershipID = @membershipID
    AND sr.Status = 'completed';
    
    IF @existingSurveyCount > 0
    BEGIN
        SET @canTakeSurvey = 0;
        SET @message = N'Bạn đã hoàn thành khảo sát trong gói membership này. Chỉ có thể làm lại khảo sát khi đăng ký gói membership mới.';
    END
    
    -- Return result
    SELECT 
        @canTakeSurvey AS CanTakeSurvey,
        @message AS Message;
END 