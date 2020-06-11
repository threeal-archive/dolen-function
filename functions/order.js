const functions = require('firebase-functions');
const admin = require('firebase-admin');

const firestore = admin.firestore();

exports.verifyTransferUrl = functions.https.onRequest(async (req, res) => {
  const orderId = req.query['order_id'];
  const transferUrl = req.query['transfer_url'];

  const orderSnapshot = await firestore.doc(`orders/${orderId}`).get();
  if (orderSnapshot.get('status') !== 0) {
    return res.json({'success': false});
  }

  await firestore.doc(`orders/${orderId}`).update({
    'transfer_url': transferUrl,
    'status': 1,
  });

  return res.json({'success': true});
});