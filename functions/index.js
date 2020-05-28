const admin = require('firebase-admin');

admin.initializeApp();

exports.cart = require('./cart');
exports.product = require('./product');
exports.user = require('./user');