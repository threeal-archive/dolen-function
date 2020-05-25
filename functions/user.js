const functions = require('firebase-functions');
const admin = require('firebase-admin');

const firestore = admin.firestore();

exports.createCustomer = functions.auth.user().onCreate((user) => {
  firestore.doc(`customers/${user.uid}`).create({
    name: user.displayName || "user"
  });
});

exports.deleteCustomer = functions.auth.user().onDelete((user) => {
  firestore.doc(`customer/${user.uid}`).delete();
});