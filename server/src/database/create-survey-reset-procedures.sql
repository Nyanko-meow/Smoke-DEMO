-- Create stored procedures for survey data reset

-- 1. Procedure to reset survey data for a specific user
CREATE OR ALTER PROCEDURE sp_ResetUserSurveyData
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        PRINT 'Resetting survey data for UserID: ' + CAST(@UserID AS VARCHAR(10));
        
        -- Delete UserSurveyAnswers
        DELETE FROM UserSurveyAnswers 
        WHERE UserID = @UserID;
        PRINT 'Deleted UserSurveyAnswers';
        
        -- Delete NicotineAddictionScores
        DELETE FROM NicotineAddictionScores 
        WHERE UserID = @UserID;
        PRINT 'Deleted NicotineAddictionScores';
        
        -- Delete NicotineSurveyAnswers first (due to foreign key)
        DELETE FROM NicotineSurveyAnswers 
        WHERE ResultID IN (
            SELECT ResultID FROM NicotineSurveyResults 
            WHERE UserID = @UserID
        );
        PRINT 'Deleted NicotineSurveyAnswers';
        
        -- Delete NicotineSurveyResults
        DELETE FROM NicotineSurveyResults 
        WHERE UserID = @UserID;
        PRINT 'Deleted NicotineSurveyResults';
        
        COMMIT TRANSACTION;
        
        SELECT 
            1 AS Success,
            'Survey data reset successfully for UserID: ' + CAST(@UserID AS VARCHAR(10)) AS Message;
            
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        
        SELECT 
            0 AS Success,
            'Error resetting survey data: ' + ERROR_MESSAGE() AS Message;
    END CATCH
END;
GO

-- 2. Procedure to cleanup survey data for expired memberships
CREATE OR ALTER PROCEDURE sp_CleanupExpiredMembershipSurveys
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @ProcessedUsers INT = 0;
        DECLARE @UserID INT;
        
        -- Cursor to process each user with expired membership
        DECLARE expired_users_cursor CURSOR FOR
        SELECT DISTINCT u.UserID
        FROM Users u
        INNER JOIN UserMemberships um ON u.UserID = um.UserID
        WHERE um.Status IN ('expired', 'cancelled')
        AND um.EndDate < GETDATE()
        AND NOT EXISTS (
            SELECT 1 FROM UserMemberships um2 
            WHERE um2.UserID = u.UserID 
            AND um2.Status = 'active' 
            AND um2.EndDate > GETDATE()
        );
        
        OPEN expired_users_cursor;
        FETCH NEXT FROM expired_users_cursor INTO @UserID;
        
        WHILE @@FETCH_STATUS = 0
        BEGIN
            PRINT 'Cleaning survey data for UserID: ' + CAST(@UserID AS VARCHAR(10));
            
            -- Delete survey data for this user
            DELETE FROM UserSurveyAnswers WHERE UserID = @UserID;
            DELETE FROM NicotineAddictionScores WHERE UserID = @UserID;
            DELETE FROM NicotineSurveyAnswers 
            WHERE ResultID IN (
                SELECT ResultID FROM NicotineSurveyResults 
                WHERE UserID = @UserID
            );
            DELETE FROM NicotineSurveyResults WHERE UserID = @UserID;
            
            SET @ProcessedUsers = @ProcessedUsers + 1;
            
            FETCH NEXT FROM expired_users_cursor INTO @UserID;
        END;
        
        CLOSE expired_users_cursor;
        DEALLOCATE expired_users_cursor;
        
        COMMIT TRANSACTION;
        
        SELECT 
            1 AS Success,
            @ProcessedUsers AS ProcessedUsers,
            'Cleanup completed successfully. Processed ' + CAST(@ProcessedUsers AS VARCHAR(10)) + ' users.' AS Message;
            
    END TRY
    BEGIN CATCH
        IF CURSOR_STATUS('global', 'expired_users_cursor') >= 0
        BEGIN
            CLOSE expired_users_cursor;
            DEALLOCATE expired_users_cursor;
        END;
        
        ROLLBACK TRANSACTION;
        
        SELECT 
            0 AS Success,
            0 AS ProcessedUsers,
            'Error during cleanup: ' + ERROR_MESSAGE() AS Message;
    END CATCH
END;
GO

-- 3. Trigger to automatically reset survey data when membership is cancelled or expires
CREATE OR ALTER TRIGGER tr_MembershipStatusChange
ON UserMemberships
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if Status changed to 'cancelled' or 'expired'
    IF UPDATE(Status)
    BEGIN
        DECLARE @UserID INT;
        
        -- Cursor for users whose membership status changed to cancelled/expired
        DECLARE status_change_cursor CURSOR FOR
        SELECT DISTINCT i.UserID
        FROM inserted i
        INNER JOIN deleted d ON i.UserID = d.UserID AND i.MembershipID = d.MembershipID
        WHERE i.Status IN ('cancelled', 'expired', 'pending_cancellation')
        AND d.Status NOT IN ('cancelled', 'expired', 'pending_cancellation')
        AND NOT EXISTS (
            -- Check if user has any other active membership
            SELECT 1 FROM UserMemberships um 
            WHERE um.UserID = i.UserID 
            AND um.Status = 'active' 
            AND um.EndDate > GETDATE()
            AND um.MembershipID != i.MembershipID
        );
        
        OPEN status_change_cursor;
        FETCH NEXT FROM status_change_cursor INTO @UserID;
        
        WHILE @@FETCH_STATUS = 0
        BEGIN
            PRINT 'Trigger: Resetting survey data for UserID ' + CAST(@UserID AS VARCHAR(10)) + ' due to membership status change';
            
            -- Call the reset procedure
            EXEC sp_ResetUserSurveyData @UserID;
            
            FETCH NEXT FROM status_change_cursor INTO @UserID;
        END;
        
        CLOSE status_change_cursor;
        DEALLOCATE status_change_cursor;
    END
END;
GO

-- 4. Scheduled job procedure (to be called by cron or scheduler)
CREATE OR ALTER PROCEDURE sp_ScheduledSurveyCleanup
AS
BEGIN
    SET NOCOUNT ON;
    
    PRINT 'Starting scheduled survey cleanup at: ' + CONVERT(VARCHAR(20), GETDATE(), 120);
    
    -- Call the cleanup procedure
    EXEC sp_CleanupExpiredMembershipSurveys;
    
    PRINT 'Scheduled survey cleanup completed at: ' + CONVERT(VARCHAR(20), GETDATE(), 120);
END;
GO

PRINT '✅ Survey reset procedures and trigger created successfully';