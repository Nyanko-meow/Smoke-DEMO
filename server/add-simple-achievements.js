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

async function addSimpleAchievements() {
    try {
        await sql.connect(config);
        console.log('🔌 Connected to database');

        // Check current achievements count
        const currentCount = await sql.query`SELECT COUNT(*) as CurrentCount FROM Achievements`;
        console.log(`📊 Current achievements count: ${currentCount.recordset[0].CurrentCount}`);

        // Simple achievements using existing table structure
        const newAchievements = [
            // Milestone achievements
            {
                name: 'Ba ngày kiên trì',
                description: 'Bạn đã vượt qua 3 ngày đầu tiên - giai đoạn khó khăn nhất!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/fire-emoji.png',
                milestoneDays: 3,
                savedMoney: null
            },
            {
                name: 'Hai tuần mạnh mẽ',
                description: '14 ngày không hút thuốc! Cơ thể bạn đang hồi phục nhanh chóng!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/muscle-emoji.png',
                milestoneDays: 14,
                savedMoney: null
            },
            {
                name: 'Ba tuần vượt trội',
                description: '21 ngày không hút thuốc! Thói quen mới đang được hình thành!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/brain-emoji.png',
                milestoneDays: 21,
                savedMoney: null
            },
            {
                name: 'Hai tháng vượt trội',
                description: '60 ngày không hút thuốc! Phổi bạn đã cải thiện đáng kể!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/lungs-emoji.png',
                milestoneDays: 60,
                savedMoney: null
            },
            {
                name: 'Nửa năm chiến thắng',
                description: '6 tháng không hút thuốc! Bạn đã giảm đáng kể nguy cơ bệnh tim!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/heart-emoji.png',
                milestoneDays: 180,
                savedMoney: null
            },
            {
                name: 'Một năm vĩ đại',
                description: '365 ngày không hút thuốc! Nguy cơ bệnh tim của bạn đã giảm 50%!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/celebration-emoji.png',
                milestoneDays: 365,
                savedMoney: null
            },
            {
                name: 'Hai năm huyền thoại',
                description: '730 ngày không hút thuốc! Bạn đã trở thành huyền thoại!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/dragon-emoji.png',
                milestoneDays: 730,
                savedMoney: null
            },

            // Money saving achievements
            {
                name: 'Tiết kiệm 200K',
                description: '200,000 VNĐ đã được tiết kiệm! Đủ để mua một món quà nhỏ!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/gift-emoji.png',
                milestoneDays: null,
                savedMoney: 200000
            },
            {
                name: 'Tiết kiệm 300K',
                description: '300,000 VNĐ tiết kiệm! Có thể đi ăn một bữa ngon rồi!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/pizza-emoji.png',
                milestoneDays: null,
                savedMoney: 300000
            },
            {
                name: 'Tiết kiệm 750K',
                description: '750,000 VNĐ tiết kiệm! Một khoản tiền đáng kể!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/money-bag-emoji.png',
                milestoneDays: null,
                savedMoney: 750000
            },
            {
                name: 'Tiết kiệm 1.5 triệu',
                description: '1,500,000 VNĐ tiết kiệm! Đủ để mua một chiếc điện thoại mới!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/mobile-phone-emoji.png',
                milestoneDays: null,
                savedMoney: 1500000
            },
            {
                name: 'Tiết kiệm 2 triệu',
                description: '2,000,000 VNĐ tiết kiệm! Có thể đi du lịch một chuyến ngắn!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/airplane-emoji.png',
                milestoneDays: null,
                savedMoney: 2000000
            },
            {
                name: 'Tiết kiệm 3 triệu',
                description: '3,000,000 VNĐ tiết kiệm! Một khoản tiền rất đáng kể!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/money-with-wings-emoji.png',
                milestoneDays: null,
                savedMoney: 3000000
            },
            {
                name: 'Tiết kiệm 5 triệu',
                description: '5,000,000 VNĐ tiết kiệm! Một khoản tiền lớn cho tương lai!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/house-emoji.png',
                milestoneDays: null,
                savedMoney: 5000000
            },
            {
                name: 'Triệu phú tiết kiệm',
                description: '10,000,000 VNĐ tiết kiệm! Bạn đã trở thành triệu phú nhờ cai thuốc!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/crown-emoji.png',
                milestoneDays: null,
                savedMoney: 10000000
            },

            // Health improvement achievements (using milestone days)
            {
                name: 'Hơi thở trong lành',
                description: 'Hơi thở của bạn đã không còn mùi thuốc lá!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/wind-emoji.png',
                milestoneDays: 2,
                savedMoney: null
            },
            {
                name: 'Vị giác hồi phục',
                description: 'Vị giác và khứu giác của bạn đã được cải thiện!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/tongue-emoji.png',
                milestoneDays: 5,
                savedMoney: null
            },
            {
                name: 'Tuần lễ không khói',
                description: 'Một tuần hoàn toàn sạch khói thuốc lá!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/check-mark-emoji.png',
                milestoneDays: 7,
                savedMoney: null
            },
            {
                name: 'Phổi khỏe mạnh',
                description: 'Chức năng phổi của bạn đã cải thiện đáng kể!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/lungs-emoji.png',
                milestoneDays: 21,
                savedMoney: null
            },
            {
                name: 'Tháng đầu hoàn hảo',
                description: 'Một tháng đầy thành công trong việc cai thuốc!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/trophy-emoji.png',
                milestoneDays: 30,
                savedMoney: null
            },
            {
                name: 'Tim mạnh khỏe',
                description: 'Hệ tim mạch của bạn đã được cải thiện rõ rệt!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/red-heart-emoji.png',
                milestoneDays: 45,
                savedMoney: null
            },

            // Special milestone achievements
            {
                name: 'Người kiên trì',
                description: '100 ngày không hút thuốc! Bạn thật sự kiên trị!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/flexed-biceps-emoji.png',
                milestoneDays: 100,
                savedMoney: null
            },
            {
                name: 'Chiến binh cai thuốc',
                description: '150 ngày không hút thuốc! Bạn là một chiến binh thực thụ!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/crossed-swords-emoji.png',
                milestoneDays: 150,
                savedMoney: null
            },
            {
                name: 'Siêu nhân ý chí',
                description: '200 ngày không hút thuốc! Ý chí của bạn thật đáng kinh ngạc!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/superhero-emoji.png',
                milestoneDays: 200,
                savedMoney: null
            },
            {
                name: 'Bậc thầy cai thuốc',
                description: '300 ngày không hút thuốc! Bạn đã trở thành bậc thầy!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/graduation-cap-emoji.png',
                milestoneDays: 300,
                savedMoney: null
            },
            {
                name: 'Huyền thoại sống',
                description: '500 ngày không hút thuốc! Bạn là huyền thoại sống!',
                iconURL: 'https://img.icons8.com/emoji/48/000000/star-emoji.png',
                milestoneDays: 500,
                savedMoney: null
            }
        ];

        console.log('🏆 Adding new achievements...');

        // Insert new achievements
        for (const achievement of newAchievements) {
            try {
                await sql.query`
                    INSERT INTO Achievements (Name, Description, IconURL, MilestoneDays, SavedMoney)
                    VALUES (${achievement.name}, ${achievement.description}, ${achievement.iconURL}, 
                           ${achievement.milestoneDays}, ${achievement.savedMoney})
                `;
                console.log(`✅ Added: ${achievement.name}`);
            } catch (error) {
                if (error.message.includes('UNIQUE KEY constraint')) {
                    console.log(`⚠️ ${achievement.name} already exists, skipping...`);
                } else {
                    console.log(`⚠️ Error adding ${achievement.name}:`, error.message);
                }
            }
        }

        // Check final count
        const finalCount = await sql.query`SELECT COUNT(*) as FinalCount FROM Achievements`;
        const newCount = finalCount.recordset[0].FinalCount - currentCount.recordset[0].CurrentCount;

        console.log(`\n📊 Achievement Summary:`);
        console.log(`   Previous count: ${currentCount.recordset[0].CurrentCount}`);
        console.log(`   New achievements added: ${newCount}`);
        console.log(`   Total achievements: ${finalCount.recordset[0].FinalCount}`);

        // Show all achievements
        const allAchievements = await sql.query`
            SELECT Name, Description, MilestoneDays, SavedMoney
            FROM Achievements 
            ORDER BY 
                CASE 
                    WHEN MilestoneDays IS NOT NULL THEN MilestoneDays
                    ELSE 9999
                END,
                CASE 
                    WHEN SavedMoney IS NOT NULL THEN SavedMoney
                    ELSE 0
                END
        `;

        console.log(`\n🏆 All Achievements:`);
        allAchievements.recordset.forEach((achievement, index) => {
            const type = achievement.MilestoneDays ? `${achievement.MilestoneDays} ngày` :
                achievement.SavedMoney ? `${achievement.SavedMoney.toLocaleString()} VNĐ` : 'Special';
            console.log(`   ${index + 1}. ${achievement.Name} (${type})`);
        });

        console.log(`\n🎉 Successfully added ${newCount} new achievements!`);
        console.log(`\n💡 Achievement Types Added:`);
        console.log(`   - Milestone achievements (2-730 days)`);
        console.log(`   - Money saving achievements (200K-10M VND)`);
        console.log(`   - Health improvement milestones`);
        console.log(`   - Special achievement levels`);

        console.log(`\n✨ Please refresh your browser to see the new achievements!`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await sql.close();
    }
}

addSimpleAchievements(); 