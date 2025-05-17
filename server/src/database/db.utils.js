const { pool, sql } = require('../config/database');
const bcrypt = require('bcryptjs');

/**
 * Execute a SQL query with parameters
 * @param {string} query - SQL query to execute
 * @param {Object} params - Parameters for the query
 * @returns {Promise<Object>} - Query result
 */
const executeQuery = async (query, params = {}) => {
    try {
        const request = pool.request();

        // Add parameters to the request
        Object.entries(params).forEach(([key, value]) => {
            request.input(key, value);
        });

        const result = await request.query(query);
        return result;
    } catch (error) {
        console.error('SQL query execution error:', error);
        throw error;
    }
};

/**
 * Execute a stored procedure with parameters
 * @param {string} procedureName - Name of the stored procedure
 * @param {Object} params - Parameters for the stored procedure
 * @returns {Promise<Object>} - Stored procedure result
 */
const executeStoredProcedure = async (procedureName, params = {}) => {
    try {
        const request = pool.request();

        // Add parameters to the request
        Object.entries(params).forEach(([key, value]) => {
            request.input(key, value);
        });

        const result = await request.execute(procedureName);
        return result;
    } catch (error) {
        console.error('Stored procedure execution error:', error);
        throw error;
    }
};

/**
 * Transaction helper
 * @param {Function} callback - Callback function that receives a transaction object
 * @returns {Promise<any>} - Result of the transaction
 */
const executeTransaction = async (callback) => {
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();
        const result = await callback(transaction);
        await transaction.commit();
        return result;
    } catch (error) {
        await transaction.rollback();
        console.error('Transaction execution error:', error);
        throw error;
    }
};

/**
 * Create a new user
 * @param {Object} userData - User data including email, password, firstName, lastName, role, etc.
 * @returns {Promise<Object>} - Created user object
 */
const createUser = async (userData) => {
    try {
        const { email, password, firstName, lastName, role = 'member', phoneNumber, address, avatar } = userData;

        // Check if user exists
        const userExists = await executeQuery(
            'SELECT * FROM Users WHERE Email = @Email',
            { Email: email }
        );

        if (userExists.recordset.length > 0) {
            throw new Error('User already exists');
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const result = await executeQuery(
            `INSERT INTO Users (Email, Password, FirstName, LastName, Role, PhoneNumber, Address, Avatar)
             OUTPUT INSERTED.UserID, INSERTED.Email, INSERTED.FirstName, INSERTED.LastName, INSERTED.Role, INSERTED.CreatedAt
             VALUES (@Email, @Password, @FirstName, @LastName, @Role, @PhoneNumber, @Address, @Avatar)`,
            {
                Email: email,
                Password: hashedPassword,
                FirstName: firstName,
                LastName: lastName,
                Role: role,
                PhoneNumber: phoneNumber || null,
                Address: address || null,
                Avatar: avatar || null
            }
        );

        return result.recordset[0];
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
};

/**
 * Login user and record login history
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} ipAddress - IP address
 * @param {string} userAgent - User agent
 * @returns {Promise<Object>} - User object with token info
 */
const loginUser = async (email, password, ipAddress, userAgent) => {
    try {
        // Check if user exists
        const userResult = await executeQuery(
            'SELECT * FROM Users WHERE Email = @Email',
            { Email: email }
        );

        if (userResult.recordset.length === 0) {
            // Record failed login attempt
            await recordLoginAttempt(email, ipAddress, false);
            throw new Error('INVALID_CREDENTIALS');
        }

        const user = userResult.recordset[0];

        // Check if password matches
        const isMatch = await bcrypt.compare(password, user.Password);
        if (!isMatch) {
            // Record failed login attempt
            await recordLoginAttempt(email, ipAddress, false);
            throw new Error('INVALID_CREDENTIALS');
        }

        // Record successful login attempt
        await recordLoginAttempt(email, ipAddress, true);

        // Record login history
        await executeQuery(
            `INSERT INTO LoginHistory (UserID, IPAddress, UserAgent, Status)
             VALUES (@UserID, @IPAddress, @UserAgent, 'success')`,
            {
                UserID: user.UserID,
                IPAddress: ipAddress || 'unknown',
                UserAgent: userAgent || 'unknown'
            }
        );

        // Update last login timestamp
        await executeQuery(
            `UPDATE Users SET LastLoginAt = GETDATE() WHERE UserID = @UserID`,
            { UserID: user.UserID }
        );

        return {
            UserID: user.UserID,
            Email: user.Email,
            FirstName: user.FirstName,
            LastName: user.LastName,
            Role: user.Role,
            PhoneNumber: user.PhoneNumber,
            Address: user.Address,
            Avatar: user.Avatar
        };
    } catch (error) {
        console.error('Error in login user:', error);
        throw error;
    }
};

/**
 * Record login attempt
 * @param {string} email - User email
 * @param {string} ipAddress - IP address
 * @param {boolean} success - Whether login was successful
 */
const recordLoginAttempt = async (email, ipAddress, success) => {
    try {
        await executeQuery(
            `INSERT INTO LoginAttempts (Email, IPAddress, Success)
             VALUES (@Email, @IPAddress, @Success)`,
            {
                Email: email,
                IPAddress: ipAddress || 'unknown',
                Success: success
            }
        );
    } catch (error) {
        console.error('Error recording login attempt:', error);
        // Don't throw, this is a non-critical operation
    }
};

/**
 * Check for too many failed login attempts
 * @param {string} email - User email
 * @param {string} ipAddress - IP address
 * @returns {Promise<boolean>} - True if too many failed attempts
 */
const checkFailedLoginAttempts = async (email, ipAddress) => {
    try {
        // Check for too many failed attempts in the last 30 minutes
        const result = await executeQuery(
            `SELECT COUNT(*) AS FailedCount 
             FROM LoginAttempts 
             WHERE (Email = @Email OR IPAddress = @IPAddress)
             AND Success = 0
             AND AttemptTime > DATEADD(MINUTE, -30, GETDATE())`,
            {
                Email: email,
                IPAddress: ipAddress
            }
        );

        const failedCount = result.recordset[0].FailedCount;
        return failedCount >= 5; // Limit to 5 failed attempts in 30 minutes
    } catch (error) {
        console.error('Error checking failed login attempts:', error);
        return false; // Default to allowing login if check fails
    }
};

/**
 * Generate and store a refresh token for a user
 * @param {number} userId - User ID
 * @returns {Promise<string>} - The generated refresh token
 */
const generateRefreshToken = async (userId) => {
    try {
        // Generate a random token
        const refreshToken = require('crypto').randomBytes(40).toString('hex');

        // Set expiry to 7 days from now
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 7);

        // Store in database
        await executeQuery(
            `UPDATE Users 
             SET RefreshToken = @RefreshToken, 
                 RefreshTokenExpiry = @RefreshTokenExpiry
             WHERE UserID = @UserID`,
            {
                UserID: userId,
                RefreshToken: refreshToken,
                RefreshTokenExpiry: expiryDate
            }
        );

        return refreshToken;
    } catch (error) {
        console.error('Error generating refresh token:', error);
        throw error;
    }
};

/**
 * Verify a refresh token and return the associated user
 * @param {string} refreshToken - The refresh token to verify
 * @returns {Promise<Object>} - User object if valid
 */
const verifyRefreshToken = async (refreshToken) => {
    try {
        const result = await executeQuery(
            `SELECT UserID, Email, FirstName, LastName, Role
             FROM Users
             WHERE RefreshToken = @RefreshToken
             AND RefreshTokenExpiry > GETDATE()`,
            { RefreshToken: refreshToken }
        );

        if (result.recordset.length === 0) {
            throw new Error('Invalid or expired refresh token');
        }

        return result.recordset[0];
    } catch (error) {
        console.error('Error verifying refresh token:', error);
        throw error;
    }
};

module.exports = {
    executeQuery,
    executeStoredProcedure,
    executeTransaction,
    createUser,
    loginUser,
    recordLoginAttempt,
    checkFailedLoginAttempts,
    generateRefreshToken,
    verifyRefreshToken
}; 