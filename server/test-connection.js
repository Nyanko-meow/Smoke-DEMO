const sql = require('mssql');

// Test different connection configurations
const testConfigs = [
    {
        name: 'Current Config (NYANKO/SMOKEKING)',
        config: {
            server: 'NYANKO',
            database: 'SMOKEKING',
            user: 'sa',
            password: 'AkoTamaki2002',
            options: {
                encrypt: false,
                trustServerCertificate: true,
                enableArithAbort: true
            }
        }
    },
    {
        name: 'Original Config (NGOCTAM/SMOKEKING5)',
        config: {
            server: 'NGOCTAM',
            database: 'SMOKEKING5',
            user: 'sa',
            password: 'AkoTamaki2002',
            options: {
                encrypt: false,
                trustServerCertificate: true,
                enableArithAbort: true
            }
        }
    },
    {
        name: 'Local SQL Server',
        config: {
            server: 'localhost',
            database: 'SMOKEKING',
            user: 'sa',
            password: 'AkoTamaki2002',
            options: {
                encrypt: false,
                trustServerCertificate: true,
                enableArithAbort: true
            }
        }
    },
    {
        name: 'Local SQL Server (default database)',
        config: {
            server: 'localhost',
            user: 'sa',
            password: 'AkoTamaki2002',
            options: {
                encrypt: false,
                trustServerCertificate: true,
                enableArithAbort: true
            }
        }
    },
    {
        name: 'SQL Server Express',
        config: {
            server: 'localhost\\SQLEXPRESS',
            database: 'SMOKEKING',
            user: 'sa',
            password: 'AkoTamaki2002',
            options: {
                encrypt: false,
                trustServerCertificate: true,
                enableArithAbort: true
            }
        }
    },
    {
        name: 'SQL Server Express (default database)',
        config: {
            server: 'localhost\\SQLEXPRESS',
            user: 'sa',
            password: 'AkoTamaki2002',
            options: {
                encrypt: false,
                trustServerCertificate: true,
                enableArithAbort: true
            }
        }
    }
];

async function testConnection(config, name) {
    try {
        console.log(`\n🔍 Testing: ${name}`);
        console.log(`   Server: ${config.server}`);
        console.log(`   Database: ${config.database || 'default'}`);
        console.log(`   User: ${config.user}`);
        
        const pool = new sql.ConnectionPool(config);
        await pool.connect();
        
        console.log(`✅ SUCCESS: Connected to ${config.server}`);
        
        // Test a simple query
        const result = await pool.request().query('SELECT @@VERSION as version');
        console.log(`   SQL Server Version: ${result.recordset[0].version.substring(0, 100)}...`);
        
        // If database is specified, try to use it
        if (config.database) {
            try {
                await pool.request().query(`USE ${config.database}`);
                console.log(`✅ SUCCESS: Database ${config.database} exists and accessible`);
            } catch (dbError) {
                console.log(`❌ ERROR: Cannot access database ${config.database}: ${dbError.message}`);
            }
        }
        
        await pool.close();
        return true;
    } catch (error) {
        console.log(`❌ FAILED: ${error.message}`);
        return false;
    }
}

async function runTests() {
    console.log('🚀 Database Connection Test');
    console.log('==========================');
    
    let successCount = 0;
    
    for (const testConfig of testConfigs) {
        const success = await testConnection(testConfig.config, testConfig.name);
        if (success) successCount++;
    }
    
    console.log('\n📊 Test Summary:');
    console.log(`   Successful connections: ${successCount}/${testConfigs.length}`);
    
    if (successCount === 0) {
        console.log('\n💡 Troubleshooting Tips:');
        console.log('   1. Make sure SQL Server is running');
        console.log('   2. Check if the server name is correct');
        console.log('   3. Verify the sa password');
        console.log('   4. Ensure SQL Server allows remote connections');
        console.log('   5. Check Windows Firewall settings');
    }
}

runTests().catch(console.error); 