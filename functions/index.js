const admin = require('firebase-admin');

admin.initializeApp();

exports.product = require('./product');
exports.user = require('./user');