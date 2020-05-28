const functions = require('firebase-functions');
const admin = require('firebase-admin');

const firestore = admin.firestore();

const TimeStamp = admin.firestore.Timestamp;

// clear all products in the user cart
exports.clearProducts = functions.https.onRequest(async (req, res) => {
  const userId = req.query.userId;

  const cartProductSnapshot = await firestore.collection(`carts/${userId}/products`).get();

  promises = [];
  cartProductSnapshot.forEach(async (cartProduct) => {
    promises.push(cartProduct.ref.delete());
  });

  await Promise.all(promises);

  res.json({
    success: true
  });
});

// set a new amount of a product in the user cart
// set amount to 0 to remove the product from the user cart
exports.setProduct = functions.https.onRequest(async (req, res) => {
  const userId = req.query.userId;
  const productId = req.query.productId;
  const amount = Number(req.query.amount);

  const productSnapshot = await firestore.doc(`products/${productId}`).get();
  const price = productSnapshot.get("sellPrice") || 0;

  if (amount > 0) {
    await firestore.doc(`carts/${userId}/products/${productId}`).set({
      amount: amount,
      price: price
    });
  }
  else {
    await firestore.doc(`carts/${userId}/products/${productId}`).delete();
  }

  res.json({
    success: true
  });
});

// convert cart to an order
exports.createOrder = functions.https.onRequest(async (req, res) => {
  const userId = req.query.userId;
  const deliveryAddress = req.query.deliveryAddress;
  console.log(req.query.deliveryDate);
  const deliveryDate = TimeStamp.fromDate(new Date(req.query.deliveryDate));

  let products = [];
  let totalPrice = 0;

  const cartProductSnapshot = await firestore.collection(`carts/${userId}/products`).get();

  promises = [];
  cartProductSnapshot.forEach((cartProduct) => {
    const amount = cartProduct.get("amount") || 0;
    const price = cartProduct.get("price") || 0;

    products.push({
      id: cartProduct.id,
      amount: amount,
      price: price
    });

    totalPrice += amount * price;

    promises.push(cartProduct.ref.delete());
  });

  const activeOrder = await firestore.collection(`orders/${userId}/active`).add({
    products: products,
    totalPrice: totalPrice,
    deliveryAddress: deliveryAddress,
    deliveryDate: deliveryDate
  });

  await Promise.all(promises);

  res.json({
    success: true,
    activeOrderId: activeOrder.id
  });
});