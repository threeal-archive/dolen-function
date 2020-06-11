const functions = require('firebase-functions');
const admin = require('firebase-admin');

const firestore = admin.firestore();

const TimeStamp = admin.firestore.Timestamp;

// clear all products in the user cart
exports.clearProducts = functions.https.onRequest(async (req, res) => {
  const userId = req.query['user_id'];

  const cartProductSnapshot = await firestore.collection(`carts/${userId}/products`).get();

  promises = [];
  cartProductSnapshot.forEach(async (cartProduct) => {
    promises.push(cartProduct.ref.delete());
  });

  await Promise.all(promises);

  res.json({
    'success': true
  });
});

// set a new amount of a product in the user cart
// set amount to 0 to remove the product from the user cart
exports.setProduct = functions.https.onRequest(async (req, res) => {
  const userId = req.query['user_id'];
  const productId = req.query['product_id'];
  const amount = Number(req.query['amount']);

  const productSnapshot = await firestore.doc(`products/${productId}`).get();
  const price = Number(productSnapshot.get('sell_price')) || 0;

  if (amount > 0) {
    await firestore.doc(`carts/${userId}/products/${productId}`).set({
      'amount': amount,
      'price': price
    });
  }
  else {
    await firestore.doc(`carts/${userId}/products/${productId}`).delete();
  }

  res.json({
    'success': true
  });
});

// convert cart to an order
exports.createOrder = functions.https.onRequest(async (req, res) => {
  const userId = req.query['user_id'];
  const deliveryAddress = req.query['delivery_address'];

  const orderDate = new Date();

  var dueDate = new Date();
  dueDate.setTime(dueDate.getTime() + 1 * 60 * 60 * 1000);

  const deliveryDate = new Date(req.query['delivery_date']);

  let products = [];
  let totalPrice = 0;

  const cartProductSnapshot = await firestore.collection(`carts/${userId}/products`).get();

  promises = [];
  cartProductSnapshot.forEach((cartProduct) => {
    const amount = Number(cartProduct.get('amount')) || 0;
    const price = Number(cartProduct.get('price')) || 0;

    products.push({
      'id': cartProduct.id,
      'amount': amount,
      'price': price
    });

    totalPrice += amount * price;

    promises.push(cartProduct.ref.delete());
  });

  const order = await firestore.collection(`orders`).add({
    'user_id': userId,
    'status': 0,
    'products': products,
    'total_price': totalPrice,
    'final_price': totalPrice,
    'delivery_address': deliveryAddress,
    'order_date': TimeStamp.fromDate(orderDate),
    'due_date': TimeStamp.fromDate(dueDate),
    'delivery_date': TimeStamp.fromDate(deliveryDate)
  });

  await Promise.all(promises);

  res.json({
    'success': true,
    'order_id': order.id
  });
});