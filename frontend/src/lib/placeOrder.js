import { authFetch } from './authFetch';

const API_BASE = 'http://localhost:3000';

/**
 * Submits each cart item as an order to the backend and returns the
 * id of the last successfully created order so the UI can navigate to
 * the order confirmation page.
 *
 * @param {Array<{id:any, product_id?:any, quantity:number}>} cartItems
 * @returns {Promise<{ orderId: string|null }>}
 *   Resolves with the last created order id. Throws on failure.
 */
export async function placeOrder(cartItems) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new Error('Your bag is empty.');
  }
  if (!localStorage.getItem('token')) {
    const err = new Error('You must be logged in to place an order.');
    err.code = 'UNAUTHENTICATED';
    throw err;
  }

  let lastOrderId = null;
  for (const item of cartItems) {
    const productId = item.product_id ?? item.id;
    const quantity = item.quantity;

    const res = await authFetch(`${API_BASE}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, quantity }),
    });

    let data = {};
    try { data = await res.json(); } catch { /* non-json response */ }

    if (!res.ok) {
      throw new Error(data.error || `Order failed for product ${productId} (HTTP ${res.status})`);
    }
    if (data.order_id) lastOrderId = data.order_id;
  }

  return { orderId: lastOrderId };
}
