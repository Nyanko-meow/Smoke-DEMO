const sql = require('mssql');

const config = {
    server: 'localhost',
    database: 'SMOKEKING',
    options: {
        encrypt: false,
        trustServerCertificate: true
    },
    authentication: {
        type: 'default',
        options: {
            userName: 'sa',
            password: '12345'
        }
    }
};

async function addMoreAchievements() {
    try {
        await sql.connect(config);
        console.log('🔌 Connected to database');

        // Check current achievements count
        const currentCount = await sql.query`SELECT COUNT(*) as CurrentCount FROM Achievements`;
        console.log(`📊 Current achievements count: ${currentCount.recordset[0].CurrentCount}`);

        // First, let's add additional columns to Achievements table for more variety
        console.log('🔄 Adding new columns to Achievements table...');

        try {
            // Add new columns for different achievement types
            await sql.query`
                ALTER TABLE Achievements 
                ADD Category NVARCHAR(50) DEFAULT 'milestone',
                    Rarity NVARCHAR(20) DEFAULT 'common',
                    Points INT DEFAULT 10,
                    Condition NVARCHAR(100) NULL,
                    BadgeColor NVARCHAR(20) DEFAULT '#gold'
            `;
            console.log('✅ Added new columns to Achievements table');
        } catch (error) {
            if (error.message.includes('column names')) {
                console.log('ℹ️ Columns already exist, skipping...');
            } else {
                console.log('⚠️ Column addition error (might already exist):', error.message);
            }
        }

        // Update existing achievements with new data
        console.log('🔄 Updating existing achievements...');

        await sql.query`
            UPDATE Achievements SET 
                Category = CASE 
                    WHEN MilestoneDays IS NOT NULL THEN 'milestone'
                    WHEN SavedMoney IS NOT NULL THEN 'savings'
                    ELSE 'milestone'
                END,
                Rarity = CASE 
                    WHEN MilestoneDays = 1 THEN 'common'
                    WHEN MilestoneDays = 7 THEN 'common'
                    WHEN MilestoneDays = 30 THEN 'uncommon'
                    WHEN MilestoneDays = 90 THEN 'rare'
                    WHEN SavedMoney = 100000 THEN 'common'
                    WHEN SavedMoney = 500000 THEN 'uncommon'
                    WHEN SavedMoney = 1000000 THEN 'rare'
                    ELSE 'common'
                END,
                Points = CASE 
                    WHEN MilestoneDays = 1 THEN 10
                    WHEN MilestoneDays = 7 THEN 25
                    WHEN MilestoneDays = 30 THEN 100
                    WHEN MilestoneDays = 90 THEN 300
                    WHEN SavedMoney = 100000 THEN 50
                    WHEN SavedMoney = 500000 THEN 150
                    WHEN SavedMoney = 1000000 THEN 500
                    ELSE 10
                END,
                BadgeColor = CASE 
                    WHEN MilestoneDays = 1 THEN '#bronze'
                    WHEN MilestoneDays = 7 THEN '#silver'
                    WHEN MilestoneDays = 30 THEN '#gold'
                    WHEN MilestoneDays = 90 THEN '#diamond'
                    WHEN SavedMoney IS NOT NULL THEN '#green'
                    ELSE '#gold'
                END
        `;

        // Insert many new achievements
        console.log('🏆 Adding new achievements...');

        const newAchievements = [
            // More milestone achievements
            {
                name: 'Ba ngày kiên trì',
                description: 'Bạn đã vượt qua 3 ngày đầu tiên - giai đoạn khó khăn nhất!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/fire-emoji.png',
                milestoneDays: 3,
                savedMoney: null,
                category: 'milestone',
                rarity: 'common',
                points: 15,
                condition: 'days_smoke_free >= 3',
                badgeColor: '#bronze'
            },
            {
                name: 'Hai tuần mạnh mẽ',
                description: '14 ngày không hút thuốc! Cơ thể bạn đang hồi phục nhanh chóng!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/muscle-emoji.png',
                milestoneDays: 14,
                savedMoney: null,
                category: 'milestone',
                rarity: 'common',
                points: 40,
                condition: 'days_smoke_free >= 14',
                badgeColor: '#silver'
            },
            {
                name: 'Hai tháng vượt trội',
                description: '60 ngày không hút thuốc! Phổi bạn đã cải thiện đáng kể!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/lungs-emoji.png',
                milestoneDays: 60,
                savedMoney: null,
                category: 'health',
                rarity: 'uncommon',
                points: 200,
                condition: 'days_smoke_free >= 60',
                badgeColor: '#gold'
            },
            {
                name: 'Nửa năm chiến thắng',
                description: '6 tháng không hút thuốc! Bạn đã giảm đáng kể nguy cơ bệnh tim!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/heart-emoji.png',
                milestoneDays: 180,
                savedMoney: null,
                category: 'health',
                rarity: 'rare',
                points: 600,
                condition: 'days_smoke_free >= 180',
                badgeColor: '#diamond'
            },
            {
                name: 'Một năm vĩ đại',
                description: '365 ngày không hút thuốc! Nguy cơ bệnh tim của bạn đã giảm 50%!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/celebration-emoji.png',
                milestoneDays: 365,
                savedMoney: null,
                category: 'legendary',
                rarity: 'legendary',
                points: 1000,
                condition: 'days_smoke_free >= 365',
                badgeColor: '#platinum'
            },
            {
                name: 'Hai năm huyền thoại',
                description: '730 ngày không hút thuốc! Bạn đã trở thành huyền thoại!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/dragon-emoji.png',
                milestoneDays: 730,
                savedMoney: null,
                category: 'legendary',
                rarity: 'legendary',
                points: 2000,
                condition: 'days_smoke_free >= 730',
                badgeColor: '#rainbow'
            },

            // More money saving achievements
            {
                name: 'Tiết kiệm 200K',
                description: '200,000 VNĐ đã được tiết kiệm! Đủ để mua một món quà nhỏ!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/gift-emoji.png',
                milestoneDays: null,
                savedMoney: 200000,
                category: 'savings',
                rarity: 'common',
                points: 75,
                condition: 'money_saved >= 200000',
                badgeColor: '#green'
            },
            {
                name: 'Tiết kiệm 300K',
                description: '300,000 VNĐ tiết kiệm! Có thể đi ăn một bữa ngon rồi!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/pizza-emoji.png',
                milestoneDays: null,
                savedMoney: 300000,
                category: 'savings',
                rarity: 'common',
                points: 100,
                condition: 'money_saved >= 300000',
                badgeColor: '#green'
            },
            {
                name: 'Tiết kiệm 1.5 triệu',
                description: '1,500,000 VNĐ tiết kiệm! Đủ để mua một chiếc điện thoại mới!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/mobile-phone-emoji.png',
                milestoneDays: null,
                savedMoney: 1500000,
                category: 'savings',
                rarity: 'uncommon',
                points: 400,
                condition: 'money_saved >= 1500000',
                badgeColor: '#green'
            },
            {
                name: 'Tiết kiệm 2 triệu',
                description: '2,000,000 VNĐ tiết kiệm! Có thể đi du lịch một chuyến ngắn!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/airplane-emoji.png',
                milestoneDays: null,
                savedMoney: 2000000,
                category: 'savings',
                rarity: 'uncommon',
                points: 600,
                condition: 'money_saved >= 2000000',
                badgeColor: '#green'
            },
            {
                name: 'Tiết kiệm 5 triệu',
                description: '5,000,000 VNĐ tiết kiệm! Một khoản tiền đáng kể cho tương lai!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/house-emoji.png',
                milestoneDays: null,
                savedMoney: 5000000,
                category: 'savings',
                rarity: 'rare',
                points: 1200,
                condition: 'money_saved >= 5000000',
                badgeColor: '#green'
            },
            {
                name: 'Triệu phú tiết kiệm',
                description: '10,000,000 VNĐ tiết kiệm! Bạn đã trở thành triệu phú nhờ cai thuốc!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/crown-emoji.png',
                milestoneDays: null,
                savedMoney: 10000000,
                category: 'savings',
                rarity: 'legendary',
                points: 2500,
                condition: 'money_saved >= 10000000',
                badgeColor: '#gold'
            },

            // Health improvement achievements
            {
                name: 'Hơi thở trong lành',
                description: 'Hơi thở của bạn đã không còn mùi thuốc lá!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/wind-emoji.png',
                milestoneDays: 2,
                savedMoney: null,
                category: 'health',
                rarity: 'common',
                points: 20,
                condition: 'days_smoke_free >= 2',
                badgeColor: '#blue'
            },
            {
                name: 'Vị giác hồi phục',
                description: 'Vị giác và khứu giác của bạn đã được cải thiện!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/tongue-emoji.png',
                milestoneDays: 5,
                savedMoney: null,
                category: 'health',
                rarity: 'common',
                points: 30,
                condition: 'days_smoke_free >= 5',
                badgeColor: '#pink'
            },
            {
                name: 'Phổi khỏe mạnh',
                description: 'Chức năng phổi của bạn đã cải thiện đáng kể!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/lungs-emoji.png',
                milestoneDays: 21,
                savedMoney: null,
                category: 'health',
                rarity: 'uncommon',
                points: 80,
                condition: 'days_smoke_free >= 21',
                badgeColor: '#blue'
            },
            {
                name: 'Tim mạnh khỏe',
                description: 'Hệ tim mạch của bạn đã được cải thiện rõ rệt!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/red-heart-emoji.png',
                milestoneDays: 45,
                savedMoney: null,
                category: 'health',
                rarity: 'uncommon',
                points: 150,
                condition: 'days_smoke_free >= 45',
                badgeColor: '#red'
            },

            // Special achievements
            {
                name: 'Người tiên phong',
                description: 'Bạn là một trong những người đầu tiên tham gia hệ thống!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/rocket-emoji.png',
                milestoneDays: null,
                savedMoney: null,
                category: 'special',
                rarity: 'rare',
                points: 200,
                condition: 'early_adopter = 1',
                badgeColor: '#purple'
            },
            {
                name: 'Người truyền cảm hứng',
                description: 'Bạn đã chia sẻ câu chuyện thành công và truyền cảm hứng cho người khác!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/light-bulb-emoji.png',
                milestoneDays: null,
                savedMoney: null,
                category: 'community',
                rarity: 'uncommon',
                points: 100,
                condition: 'shared_story = 1',
                badgeColor: '#yellow'
            },
            {
                name: 'Thầy cô hỗ trợ',
                description: 'Bạn đã giúp đỡ ít nhất 5 người khác trong hành trình cai thuốc!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/teacher-emoji.png',
                milestoneDays: null,
                savedMoney: null,
                category: 'community',
                rarity: 'rare',
                points: 300,
                condition: 'helped_others >= 5',
                badgeColor: '#orange'
            },
            {
                name: 'Chiến binh không ngại khó',
                description: 'Bạn đã vượt qua ít nhất 3 lần suýt bỏ cuộc nhưng vẫn kiên trì!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/crossed-swords-emoji.png',
                milestoneDays: null,
                savedMoney: null,
                category: 'special',
                rarity: 'rare',
                points: 250,
                condition: 'overcame_relapses >= 3',
                badgeColor: '#steel'
            },
            {
                name: 'Học sinh xuất sắc',
                description: 'Bạn đã hoàn thành tất cả các khóa học về cai thuốc lá!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/graduation-cap-emoji.png',
                milestoneDays: null,
                savedMoney: null,
                category: 'education',
                rarity: 'uncommon',
                points: 150,
                condition: 'completed_all_courses = 1',
                badgeColor: '#academic'
            },
            {
                name: 'Người chia sẻ tích cực',
                description: 'Bạn đã đăng ít nhất 10 bài viết khuyến khích trong cộng đồng!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/megaphone-emoji.png',
                milestoneDays: null,
                savedMoney: null,
                category: 'community',
                rarity: 'uncommon',
                points: 120,
                condition: 'community_posts >= 10',
                badgeColor: '#social'
            },
            {
                name: 'Thánh check-in',
                description: 'Bạn đã check-in hàng ngày liên tục trong 30 ngày!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/calendar-emoji.png',
                milestoneDays: null,
                savedMoney: null,
                category: 'habit',
                rarity: 'uncommon',
                points: 200,
                condition: 'daily_checkin_streak >= 30',
                badgeColor: '#consistent'
            },
            {
                name: 'Siêu nhân ý chí',
                description: 'Bạn đã từ chối thuốc lá ít nhất 100 lần trong ứng dụng!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/superhero-emoji.png',
                milestoneDays: null,
                savedMoney: null,
                category: 'willpower',
                rarity: 'rare',
                points: 400,
                condition: 'refused_cigarettes >= 100',
                badgeColor: '#hero'
            }
        ];

        // Insert new achievements
        for (const achievement of newAchievements) {
            try {
                await sql.query`
                    INSERT INTO Achievements (Name, Description, IconURL, MilestoneDays, SavedMoney, Category, Rarity, Points, Condition, BadgeColor)
                    VALUES (${achievement.name}, ${achievement.description}, ${achievement.iconURL}, 
                           ${achievement.milestoneDays}, ${achievement.savedMoney}, ${achievement.category}, 
                           ${achievement.rarity}, ${achievement.points}, ${achievement.condition}, ${achievement.badgeColor})
                `;
                console.log(`✅ Added: ${achievement.name}`);
            } catch (error) {
                console.log(`⚠️ Error adding ${achievement.name}:`, error.message);
            }
        }

        // Check final count
        const finalCount = await sql.query`SELECT COUNT(*) as FinalCount FROM Achievements`;
        const newCount = finalCount.recordset[0].FinalCount - currentCount.recordset[0].CurrentCount;

        console.log(`\n📊 Achievement Summary:`);
        console.log(`   Previous count: ${currentCount.recordset[0].CurrentCount}`);
        console.log(`   New achievements added: ${newCount}`);
        console.log(`   Total achievements: ${finalCount.recordset[0].FinalCount}`);

        // Show achievements by category
        const categories = await sql.query`
            SELECT Category, COUNT(*) as Count, 
                   STRING_AGG(Name, ', ') as Names
            FROM Achievements 
            GROUP BY Category
            ORDER BY Category
        `;

        console.log(`\n🏆 Achievements by Category:`);
        categories.recordset.forEach(cat => {
            console.log(`   ${cat.Category}: ${cat.Count} achievements`);
            console.log(`      ${cat.Names.substring(0, 100)}${cat.Names.length > 100 ? '...' : ''}`);
            console.log('');
        });

        // Show achievements by rarity
        const rarities = await sql.query`
            SELECT Rarity, COUNT(*) as Count
            FROM Achievements 
            GROUP BY Rarity
            ORDER BY 
                CASE Rarity 
                    WHEN 'common' THEN 1
                    WHEN 'uncommon' THEN 2  
                    WHEN 'rare' THEN 3
                    WHEN 'legendary' THEN 4
                    ELSE 5
                END
        `;

        console.log(`🌟 Achievements by Rarity:`);
        rarities.recordset.forEach(rarity => {
            console.log(`   ${rarity.Rarity}: ${rarity.Count} achievements`);
        });

        console.log(`\n🎉 Successfully enhanced achievements system!`);
        console.log(`\n💡 New features added:`);
        console.log(`   - Milestone achievements (1-730 days)`);
        console.log(`   - Money saving achievements (100K-10M VND)`);
        console.log(`   - Health improvement badges`);
        console.log(`   - Special community achievements`);
        console.log(`   - Rarity system (common, uncommon, rare, legendary)`);
        console.log(`   - Point system for gamification`);
        console.log(`   - Achievement categories and colors`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await sql.close();
    }
}

addMoreAchievements(); 