// Utility functions for smoking addiction calculations and progress tracking

// Dữ liệu khoảng giá gói thuốc (giống trong SmokingAddictionSurvey)
export const CIGARETTE_PRICE_RANGES = [
    { 
        id: 'range1', 
        name: 'Thuốc lá rẻ', 
        minPrice: 15000, 
        maxPrice: 20000, 
        description: '15.000đ - 20.000đ/gói',
        defaultPrice: 17500
    },
    { 
        id: 'range2', 
        name: 'Thuốc lá bình dân', 
        minPrice: 21000, 
        maxPrice: 30000, 
        description: '21.000đ - 30.000đ/gói',
        defaultPrice: 25500
    },
    { 
        id: 'range3', 
        name: 'Thuốc lá trung cấp', 
        minPrice: 31000, 
        maxPrice: 40000, 
        description: '31.000đ - 40.000đ/gói',
        defaultPrice: 35500
    },
    { 
        id: 'range4', 
        name: 'Thuốc lá cao cấp', 
        minPrice: 41000, 
        maxPrice: 50000, 
        description: '41.000đ - 50.000đ/gói',
        defaultPrice: 45500
    },
    { 
        id: 'range5', 
        name: 'Thuốc lá nhập khẩu', 
        minPrice: 51000, 
        maxPrice: 70000, 
        description: '51.000đ - 70.000đ/gói',
        defaultPrice: 60500
    },
    { 
        id: 'range6', 
        name: 'Thuốc lá cao cấp nhập khẩu', 
        minPrice: 71000, 
        maxPrice: 120000, 
        description: '71.000đ - 120.000đ/gói',
        defaultPrice: 95500
    }
];

/**
 * Tính toán Pack-Year theo công thức y học
 * @param {number} cigarettesPerDay - Số điếu thuốc hút mỗi ngày
 * @param {number} yearsSmoked - Số năm đã hút thuốc
 * @returns {number} Chỉ số Pack-Year
 */
export const calculatePackYear = (cigarettesPerDay, yearsSmoked) => {
    return (cigarettesPerDay / 20) * yearsSmoked;
};

/**
 * Phân loại mức độ nghiện dựa trên số điếu/ngày
 * @param {number} cigarettesPerDay - Số điếu thuốc hút mỗi ngày
 * @param {number} packYear - Chỉ số Pack-Year
 * @returns {object} Thông tin mức độ nghiện
 */
export const getAddictionLevel = (cigarettesPerDay, packYear = 0) => {
    if (cigarettesPerDay <= 5) {
        return { level: 'Nhẹ', color: 'green', severity: 1 };
    } else if (cigarettesPerDay <= 15) {
        return { level: 'Trung bình', color: 'orange', severity: 2 };
    } else if (cigarettesPerDay <= 25) {
        return { level: 'Nặng', color: 'red', severity: 3 };
    } else {
        return { level: 'Rất nặng', color: 'darkred', severity: 4 };
    }
};

/**
 * Tính xác suất thành công cai thuốc dựa trên nhiều yếu tố
 * @param {number} cigarettesPerDay - Số điếu thuốc hút mỗi ngày
 * @param {number} yearsSmoked - Số năm đã hút thuốc
 * @param {number} packYear - Chỉ số Pack-Year
 * @param {number} age - Tuổi
 * @param {string} motivation - Mức độ quyết tâm
 * @returns {number} Xác suất thành công (%)
 */
export const calculateSuccessProbability = (cigarettesPerDay, yearsSmoked, packYear, age, motivation) => {
    let baseSuccessRate = 30; // Tỷ lệ thành công cơ bản 30%

    // Điều chỉnh theo độ tuổi (người trẻ có tỷ lệ thành công cao hơn)
    if (age < 25) baseSuccessRate += 20;
    else if (age < 35) baseSuccessRate += 15;
    else if (age < 45) baseSuccessRate += 10;
    else if (age < 55) baseSuccessRate += 5;
    else if (age >= 65) baseSuccessRate -= 10;

    // Điều chỉnh theo mức độ nghiện
    if (cigarettesPerDay <= 5) baseSuccessRate += 25;
    else if (cigarettesPerDay <= 10) baseSuccessRate += 15;
    else if (cigarettesPerDay <= 20) baseSuccessRate += 5;
    else if (cigarettesPerDay <= 30) baseSuccessRate -= 10;
    else baseSuccessRate -= 20;

    // Điều chỉnh theo pack-year
    if (packYear < 5) baseSuccessRate += 15;
    else if (packYear < 10) baseSuccessRate += 10;
    else if (packYear < 20) baseSuccessRate += 0;
    else if (packYear < 30) baseSuccessRate -= 5;
    else baseSuccessRate -= 15;

    // Điều chỉnh theo động lực
    const motivationBonus = {
        'very_high': 20,
        'high': 15,
        'medium': 5,
        'low': -10,
        'very_low': -20
    };
    baseSuccessRate += motivationBonus[motivation] || 0;

    // Đảm bảo tỷ lệ trong khoảng 5-95%
    return Math.max(5, Math.min(95, Math.round(baseSuccessRate)));
};

/**
 * Tính số tiền tiết kiệm được dựa trên thói quen hút thuốc
 * @param {number} cigarettesPerDay - Số điếu thuốc hút mỗi ngày
 * @param {number} packagePrice - Giá gói thuốc
 * @returns {object} Số tiền tiết kiệm theo thời gian
 */
export const calculateSavings = (cigarettesPerDay, packagePrice) => {
    const cigarettesPerPackage = 20;
    const packagesPerDay = cigarettesPerDay / cigarettesPerPackage;
    const dailySavings = packagesPerDay * packagePrice;
    
    return {
        daily: dailySavings,
        weekly: dailySavings * 7,
        monthly: dailySavings * 30,
        quarterly: dailySavings * 90,
        yearly: dailySavings * 365
    };
};

/**
 * Tính số tiền tiết kiệm thực tế dựa trên số ngày không hút thuốc
 * @param {number} smokeFreeDays - Số ngày không hút thuốc
 * @param {number} dailySavings - Số tiền tiết kiệm mỗi ngày
 * @returns {number} Tổng số tiền đã tiết kiệm
 */
export const calculateActualSavings = (smokeFreeDays, dailySavings) => {
    return smokeFreeDays * dailySavings;
};

/**
 * Tính số điếu thuốc đã không hút dựa trên số ngày và thói quen cũ
 * @param {number} smokeFreeDays - Số ngày không hút thuốc
 * @param {number} cigarettesPerDay - Số điếu thuốc thường hút mỗi ngày
 * @returns {number} Số điếu thuốc đã không hút
 */
export const calculateCigarettesNotSmoked = (smokeFreeDays, cigarettesPerDay) => {
    return smokeFreeDays * cigarettesPerDay;
};

/**
 * Đánh giá mức độ rủi ro sức khỏe dựa trên Pack-Year
 * @param {number} packYear - Chỉ số Pack-Year
 * @returns {object} Thông tin mức độ rủi ro
 */
export const getHealthRiskLevel = (packYear) => {
    if (packYear < 5) return { level: 'Thấp', color: 'green', description: 'Rủi ro sức khỏe ở mức thấp' };
    if (packYear < 10) return { level: 'Trung bình', color: 'orange', description: 'Rủi ro sức khỏe ở mức trung bình' };
    if (packYear < 20) return { level: 'Cao', color: 'red', description: 'Rủi ro sức khỏe ở mức cao' };
    return { level: 'Rất cao', color: 'darkred', description: 'Rủi ro sức khỏe ở mức rất cao' };
};

/**
 * Tính tỷ lệ phần trăm tiến bộ dựa trên mục tiêu
 * @param {number} currentValue - Giá trị hiện tại
 * @param {number} targetValue - Giá trị mục tiêu
 * @returns {number} Tỷ lệ phần trăm hoàn thành (0-100)
 */
export const calculateProgressPercentage = (currentValue, targetValue) => {
    if (!targetValue || targetValue === 0) return 0;
    return Math.min(100, Math.round((currentValue / targetValue) * 100));
};

/**
 * Tạo dự báo tiết kiệm tiền trong tương lai
 * @param {number} dailySavings - Số tiền tiết kiệm mỗi ngày
 * @param {number} currentDays - Số ngày hiện tại
 * @returns {array} Mảng dự báo tiết kiệm theo thời gian
 */
export const createSavingsForecast = (dailySavings, currentDays = 0) => {
    const periods = [
        { label: '1 tuần', days: 7 },
        { label: '1 tháng', days: 30 },
        { label: '3 tháng', days: 90 },
        { label: '6 tháng', days: 180 },
        { label: '1 năm', days: 365 },
        { label: '2 năm', days: 730 },
        { label: '5 năm', days: 1825 }
    ];

    return periods.map(period => {
        const totalDays = currentDays + period.days;
        const totalSavings = totalDays * dailySavings;
        
        return {
            period: period.label,
            days: totalDays,
            savings: totalSavings,
            formattedSavings: totalSavings.toLocaleString() + 'đ'
        };
    });
};

/**
 * Lấy thông tin khoảng giá gói thuốc theo ID
 * @param {string} rangeId - ID khoảng giá
 * @returns {object|null} Thông tin khoảng giá
 */
export const getPriceRangeById = (rangeId) => {
    return CIGARETTE_PRICE_RANGES.find(range => range.id === rangeId) || null;
};

/**
 * Lấy thông tin khoảng giá gói thuốc theo giá cụ thể
 * @param {number} price - Giá gói thuốc
 * @returns {object|null} Thông tin khoảng giá
 */
export const getPriceRangeByPrice = (price) => {
    return CIGARETTE_PRICE_RANGES.find(range => 
        price >= range.minPrice && price <= range.maxPrice
    ) || null;
};

/**
 * Tính điểm thành tích dựa trên nhiều yếu tố
 * @param {object} progressData - Dữ liệu tiến trình
 * @returns {number} Điểm thành tích
 */
export const calculateAchievementScore = (progressData) => {
    const {
        smokeFreeDays = 0,
        totalMoneySaved = 0,
        currentStreak = 0,
        smokeFreePercentage = 0
    } = progressData;

    let score = 0;
    
    // Điểm cho số ngày không hút thuốc (tối đa 40 điểm)
    score += Math.min(40, smokeFreeDays * 0.5);
    
    // Điểm cho streak hiện tại (tối đa 30 điểm)
    score += Math.min(30, currentStreak * 1);
    
    // Điểm cho tỷ lệ không hút thuốc (tối đa 20 điểm)
    score += (smokeFreePercentage / 100) * 20;
    
    // Điểm cho số tiền tiết kiệm (tối đa 10 điểm)
    score += Math.min(10, totalMoneySaved / 100000);
    
    return Math.round(score);
};

/**
 * Tính toán cải thiện sức khỏe dựa trên số ngày không hút thuốc
 * @param {number} smokeFreeDays - Số ngày không hút thuốc
 * @returns {array} Danh sách cải thiện sức khỏe
 */
export const getHealthImprovements = (smokeFreeDays) => {
    const improvements = [];
    
    if (smokeFreeDays >= 0.01) { // 20 phút
        improvements.push({
            time: '20 phút',
            benefit: 'Nhịp tim và huyết áp giảm xuống bình thường',
            achieved: true
        });
    }
    
    if (smokeFreeDays >= 0.5) { // 12 giờ
        improvements.push({
            time: '12 giờ',
            benefit: 'Lượng carbon monoxide trong máu giảm xuống mức bình thường',
            achieved: true
        });
    }
    
    if (smokeFreeDays >= 14) { // 2 tuần
        improvements.push({
            time: '2-12 tuần',
            benefit: 'Lưu thông máu cải thiện và chức năng phổi tăng lên',
            achieved: smokeFreeDays >= 14
        });
    }
    
    if (smokeFreeDays >= 30) { // 1 tháng
        improvements.push({
            time: '1-9 tháng',
            benefit: 'Ho và khó thở giảm đáng kể',
            achieved: smokeFreeDays >= 30
        });
    }
    
    if (smokeFreeDays >= 365) { // 1 năm
        improvements.push({
            time: '1 năm',
            benefit: 'Nguy cơ bệnh tim giảm còn một nửa so với người hút thuốc',
            achieved: smokeFreeDays >= 365
        });
    }
    
    return improvements;
};