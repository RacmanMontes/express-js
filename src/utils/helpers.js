// Helper functions can be added here
module.exports = {
    // Format currency
    formatCurrency: (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    },
    
    // Generate random string
    generateRandomString: (length = 10) => {
        return Math.random().toString(36).substring(2, 2 + length);
    },
    
    // Calculate discount percentage
    calculateDiscountPercentage: (originalPrice, discountPrice) => {
        if (!discountPrice || discountPrice >= originalPrice) return 0;
        return Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
    }
};
