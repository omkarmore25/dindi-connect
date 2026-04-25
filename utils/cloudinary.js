const cloudinary = require('cloudinary').v2;

// Cloudinary will automatically configure itself if the CLOUDINARY_URL environment variable is set.
// Make sure CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name> is in your .env file!

module.exports = cloudinary;
