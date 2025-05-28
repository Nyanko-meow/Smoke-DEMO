const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Default image path
const defaultImagePath = path.join(__dirname, '../public/images/default-blog.jpg');

// Handle image requests
router.get('/blog/:imageName', (req, res) => {
    const imagePath = path.join(__dirname, '../public/images/blog', req.params.imageName);

    // Check if requested image exists
    if (fs.existsSync(imagePath)) {
        res.sendFile(imagePath);
    } else {
        // Send default image if requested image doesn't exist
        res.sendFile(defaultImagePath);
    }
});

module.exports = router; 