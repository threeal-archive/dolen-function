const functions = require('firebase-functions');
const admin = require('firebase-admin');

const FieldValue = admin.firestore.FieldValue;

admin.initializeApp();

const db = admin.firestore();

exports.setUserRating = functions.https.onRequest(async (req, res) => {
  const productId = req.query.productId;
  const userId = req.query.userId;

  let score = parseInt(req.query.score, 10);

  if (score > 5)
    score = 5;

  if (score < 1)
    score = 1;

  await db.doc(`products/${productId}/userRatings/${userId}`).set({score: score});

  res.json({success: true});
});

exports.getUserRating = functions.https.onRequest(async (req, res) => {
  const productId = req.query.productId;
  const userId = req.query.userId;

  let success = false;
  let score = 0;

  const rating = await db.doc(`products/${productId}/userRatings/${userId}`).get();
  if (rating.exists) {
    const data = rating.data();
    if (data.score) {
      success = true;
      score = data.score;
    }
  }

  res.json({
    success: success,
    score: score
  });
});

exports.getRating = functions.https.onRequest(async (req, res) => {
  const productId = req.query.productId;

  let success = false;
  let score = 0;

  const product = await db.doc(`products/${productId}`).get();
  if (product.exists) {
    const data = product.data();
    if (data.userRatingsScoreSum && data.userRatingsCount && data.userRatingsCount !== 0) {
      success = true;
      score = data.userRatingsScoreSum / data.userRatingsCount;
    }
  }

  res.json({
    success: success,
    score: score
  });
});

exports.userRatingsListener = functions.firestore.document(`products/{productId}/userRatings/{userId}`)
  .onWrite((change, context) => {
    if (!change.before.exists) {
      const data = change.after.data();
      change.after.ref.parent.parent.update({
        userRatingsCount: FieldValue.increment(1),
        userRatingsScoreSum: FieldValue.increment(data.score)
      });
    } else if (change.before.exists && change.after.exists) {
      const data = change.after.data();
      const prevData = change.before.data();
      change.after.ref.parent.parent.update({
        userRatingsScoreSum: FieldValue.increment(data.score - prevData.score)
      });
    } else if (!change.after.exists) {
      const prevData = change.before.data();
      change.before.ref.parent.parent.update({
        userRatingsCount: FieldValue.increment(-1),
        userRatingsScoreSum: FieldValue.increment(-prevData.score)
      });
    }
  });