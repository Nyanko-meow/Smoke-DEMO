const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Default image paths
const defaultImagePath = path.join(__dirname, '../public/images/default-blog.svg');
const achievementDefaultPath = path.join(__dirname, '../public/images/achievements/default-badge.png');

// Set proper content types for different file types
const getContentType = (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
        case '.svg':
            return 'image/svg+xml';
        case '.png':
            return 'image/png';
        case '.jpg':
        case '.jpeg':
            return 'image/jpeg';
        case '.gif':
            return 'image/gif';
        case '.webp':
            return 'image/webp';
        default:
            return 'image/svg+xml'; // Default to SVG
    }
};

// Add cache-busting headers to prevent 304 responses
const setCacheHeaders = (res) => {
    res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Last-Modified': new Date().toUTCString(),
        'ETag': `"${Date.now()}-${Math.random()}"`
    });
};

// Handle blog image requests
router.get('/blog/:imageName', (req, res) => {
    const imageName = req.params.imageName;
    let imagePath;

    // Try different extensions
    const extensions = ['.svg', '.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const baseName = path.parse(imageName).name;

    for (const ext of extensions) {
        imagePath = path.join(__dirname, '../public/images/blog', baseName + ext);
        if (fs.existsSync(imagePath)) {
            setCacheHeaders(res);
            res.setHeader('Content-Type', getContentType(imagePath));
            return res.status(200).sendFile(imagePath);
        }
    }

    // If no image found, send default
    setCacheHeaders(res);
    res.setHeader('Content-Type', getContentType(defaultImagePath));
    res.status(200).sendFile(defaultImagePath);
});

// Handle achievement image requests
router.get('/achievements/:imageName', (req, res) => {
    const imageName = req.params.imageName;
    let imagePath;

    // Try different extensions
    const extensions = ['.png', '.svg', '.jpg', '.jpeg', '.gif', '.webp'];
    const baseName = path.parse(imageName).name;

    for (const ext of extensions) {
        imagePath = path.join(__dirname, '../public/images/achievements', baseName + ext);
        if (fs.existsSync(imagePath)) {
            setCacheHeaders(res);
            res.setHeader('Content-Type', getContentType(imagePath));
            return res.status(200).sendFile(imagePath);
        }
    }

    // If no image found, send default achievement image
    setCacheHeaders(res);
    res.setHeader('Content-Type', getContentType(achievementDefaultPath));
    res.status(200).sendFile(achievementDefaultPath);
});

// Handle general image requests
router.get('/:imageName', (req, res) => {
    const imageName = req.params.imageName;
    let imagePath;

    // Try different extensions
    const extensions = ['.svg', '.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const baseName = path.parse(imageName).name;

    for (const ext of extensions) {
        imagePath = path.join(__dirname, '../public/images', baseName + ext);
        if (fs.existsSync(imagePath)) {
            setCacheHeaders(res);
            res.setHeader('Content-Type', getContentType(imagePath));
            return res.status(200).sendFile(imagePath);
        }
    }

    // If no image found, send default
    setCacheHeaders(res);
    res.setHeader('Content-Type', getContentType(defaultImagePath));
    res.status(200).sendFile(defaultImagePath);
});

module.exports = router; 