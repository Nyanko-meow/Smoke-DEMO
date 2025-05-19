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
 * @param {string} activationToken - Token to activate account (optional)
 * @returns {Promise<Object>} - Created user object
 */
const createUser = async (userData, activationToken = null) => {
    try {
        const {
            email,
            password,
            firstName,
            lastName,
            role = 'guest',
            phoneNumber,
            address,
            avatar,
            requireActivation = true
        } = userData;

        // Validate that either email or phone number is provided
        if (!email && !phoneNumber) {
            throw new Error('Email hoặc số điện thoại là bắt buộc');
        }

        // Check if user exists by email if provided
        if (email) {
            const userExistsByEmail = await executeQuery(
                'SELECT * FROM Users WHERE Email = @Email',
                { Email: email }
            );

            if (userExistsByEmail.recordset.length > 0) {
                throw new Error('Email đã được sử dụng');
            }
        }

        // Check if user exists by phone number if provided
        if (phoneNumber) {
            const userExistsByPhone = await executeQuery(
                'SELECT * FROM Users WHERE PhoneNumber = @PhoneNumber',
                { PhoneNumber: phoneNumber }
            );

            if (userExistsByPhone.recordset.length > 0) {
                throw new Error('Số điện thoại đã được sử dụng');
            }
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Set activation token expiry if provided
        let activationExpires = null;
        if (activationToken && requireActivation) {
            const expiryDate = new Date();
            expiryDate.setHours(expiryDate.getHours() + 24); // 24 hours from now
            activationExpires = expiryDate;
        }

        // Create user
        const result = await executeQuery(
            `INSERT INTO Users (
                Email, Password, FirstName, LastName, Role, 
                PhoneNumber, Address, Avatar, IsActive, 
                ActivationToken, ActivationExpires, EmailVerified
            )
            OUTPUT 
                INSERTED.UserID, INSERTED.Email, INSERTED.FirstName, 
                INSERTED.LastName, INSERTED.Role, INSERTED.CreatedAt,
                INSERTED.IsActive, INSERTED.EmailVerified, INSERTED.PhoneNumber
            VALUES (
                @Email, @Password, @FirstName, @LastName, @Role, 
                @PhoneNumber, @Address, @Avatar, @IsActive, 
                @ActivationToken, @ActivationExpires, @EmailVerified
            )`,
            {
                Email: email || null,
                Password: hashedPassword,
                FirstName: firstName,
                LastName: lastName,
                Role: role,
                PhoneNumber: phoneNumber || null,
                Address: address || null,
                Avatar: avatar || null,
                IsActive: requireActivation ? 0 : 1, // If activation not required, set to active
                ActivationToken: activationToken,
                ActivationExpires: activationExpires,
                EmailVerified: requireActivation ? 0 : 1 // If activation not required, set as verified
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
 * @param {Object} credentials - User credentials
 * @param {string} credentials.email - User email (optional if phone is provided)
 * @param {string} credentials.phoneNumber - User phone number (optional if email is provided)
 * @param {string} credentials.password - User password
 * @param {string} ipAddress - IP address
 * @param {string} userAgent - User agent
 * @returns {Promise<Object>} - User object with token info
 */
const loginUser = async (credentials, ipAddress, userAgent) => {
    try {
        const { email, phoneNumber, password } = credentials;

        // Check if at least email or phone is provided
        if (!email && !phoneNumber) {
            throw new Error('EMAIL_OR_PHONE_REQUIRED');
        }

        // Build the query based on provided credentials
        let query = 'SELECT * FROM Users WHERE ';
        let params = {};

        if (email) {
            query += 'Email = @Email';
            params.Email = email;
        } else {
            query += 'PhoneNumber = @PhoneNumber';
            params.PhoneNumber = phoneNumber;
        }

        // Check if user exists
        const userResult = await executeQuery(query, params);

        if (userResult.recordset.length === 0) {
            // Record failed login attempt
            await recordLoginAttempt(email || phoneNumber, ipAddress, false);
            throw new Error('INVALID_CREDENTIALS');
        }

        const user = userResult.recordset[0];

        // Check if password matches
        const isMatch = await bcrypt.compare(password, user.Password);
        if (!isMatch) {
            // Record failed login attempt
            await recordLoginAttempt(email || phoneNumber, ipAddress, false);
            throw new Error('INVALID_CREDENTIALS');
        }

        // Record successful login attempt
        await recordLoginAttempt(email || phoneNumber, ipAddress, true);

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

/**
 * Activate user account by token
 * @param {string} token - Activation token
 * @returns {Promise<Object>} - Activated user object
 */
const activateUserAccount = async (token) => {
    try {
        // Check if token is valid and not expired
        const result = await executeQuery(
            `SELECT * 
             FROM Users 
             WHERE ActivationToken = @Token 
               AND (ActivationExpires IS NULL OR ActivationExpires > GETDATE())`,
            { Token: token }
        );

        if (result.recordset.length === 0) {
            throw new Error('Invalid or expired activation token');
        }

        const user = result.recordset[0];

        if (user.IsActive) {
            return user; // Account already activated
        }

        // Activate user account
        await executeQuery(
            `UPDATE Users
             SET IsActive = 1,
                 EmailVerified = 1,
                 ActivationToken = NULL,
                 ActivationExpires = NULL,
                 UpdatedAt = GETDATE()
             WHERE UserID = @UserID`,
            { UserID: user.UserID }
        );

        // Get updated user
        const updatedResult = await executeQuery(
            `SELECT * FROM Users WHERE UserID = @UserID`,
            { UserID: user.UserID }
        );

        return updatedResult.recordset[0];
    } catch (error) {
        console.error('Error activating user account:', error);
        throw error;
    }
};

/**
 * Update user role
 * @param {number} userId - User ID
 * @param {string} role - New role
 * @returns {Promise<Object>} - Updated user object
 */
const updateUserRole = async (userId, role) => {
    try {
        // Validate role
        if (!['guest', 'member', 'coach', 'admin'].includes(role)) {
            throw new Error('Invalid role specified');
        }

        // Update user role
        const result = await executeQuery(
            `UPDATE Users
             SET Role = @Role,
                 UpdatedAt = GETDATE()
             OUTPUT INSERTED.UserID, INSERTED.Email, INSERTED.Role, INSERTED.UpdatedAt
             WHERE UserID = @UserID`,
            {
                UserID: userId,
                Role: role
            }
        );

        if (result.recordset.length === 0) {
            throw new Error('User not found');
        }

        return result.recordset[0];
    } catch (error) {
        console.error('Error updating user role:', error);
        throw error;
    }
};

/**
 * Resend activation token
 * @param {string} email - User email
 * @param {string} token - New activation token
 * @returns {Promise<Object>} - User object
 */
const regenerateActivationToken = async (email, token) => {
    try {
        // Check if user exists
        const result = await executeQuery(
            `SELECT * FROM Users WHERE Email = @Email`,
            { Email: email }
        );

        if (result.recordset.length === 0) {
            throw new Error('User not found');
        }

        const user = result.recordset[0];

        // If user is already active, no need to regenerate token
        if (user.IsActive) {
            throw new Error('Account already activated');
        }

        // Set token expiry (24 hours from now)
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 24);

        // Update activation token
        await executeQuery(
            `UPDATE Users
             SET ActivationToken = @Token,
                 ActivationExpires = @Expires,
                 UpdatedAt = GETDATE()
             WHERE UserID = @UserID`,
            {
                UserID: user.UserID,
                Token: token,
                Expires: expiryDate
            }
        );

        return user;
    } catch (error) {
        console.error('Error regenerating activation token:', error);
        throw error;
    }
};

/**
 * Check if user is activated
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} - True if user is activated
 */
const isUserActivated = async (userId) => {
    try {
        const result = await executeQuery(
            `SELECT IsActive FROM Users WHERE UserID = @UserID`,
            { UserID: userId }
        );

        if (result.recordset.length === 0) {
            throw new Error('User not found');
        }

        return result.recordset[0].IsActive === true;
    } catch (error) {
        console.error('Error checking user activation status:', error);
        return false;
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
    verifyRefreshToken,
    activateUserAccount,
    updateUserRole,
    regenerateActivationToken,
    isUserActivated
}; 