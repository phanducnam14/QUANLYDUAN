/**
 * Unifies department names by removing common prefixes and adding "Phòng" prefix.
 * Example: "ban marketing", "phòng maketing", "marketing" -> "Phòng Marketing"
 */
export const formatDeptName = (name) => {
    if (!name) return "";
    let cleanName = name.trim();

    // 1. Remove prefixes like "Phòng ", "Ban ", "phong ", "ban ", etc. (case-insensitive)
    // Supports both Vietnamese characters and non-accented variants
    const prefixRegex = /^(phòng|ban|phong|ban|phóng|bán|bạn)\s+/i;
    cleanName = cleanName.replace(prefixRegex, "");

    // 2. Handle specific common typos or mapping to standard names
    const lowerName = cleanName.toLowerCase();
    
    // Mapping table for consistency
    const mappings = {
        'maketing': 'Marketing',
        'marketing': 'Marketing',
        'nhân sự': 'Nhân sự',
        'nhan su': 'Nhân sự',
        'kỹ thuật': 'Kỹ thuật',
        'ky thuat': 'Kỹ thuật',
        'kế toán': 'Kế toán',
        'ke toan': 'Kế toán',
        'kinh doanh': 'Kinh doanh',
        'tuyển dụng': 'Tuyển dụng',
        'tuyen dung': 'Tuyển dụng',
        'lễ tân': 'Lễ tân',
        'le tan': 'Lễ tân'
    };

    if (mappings[lowerName]) {
        cleanName = mappings[lowerName];
    } else {
        // Standard capitalization for unknown department names
        cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
    }

    return `Phòng ${cleanName}`;
};

/**
 * Normalizes input name before saving to database.
 */
export const normalizeDeptName = (name) => {
    return formatDeptName(name);
};
