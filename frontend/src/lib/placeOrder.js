import { authFetch } from './authFetch';

const API_BASE = 'http://localhost:3000';

/**
 * Submits all cart items as a single batch order to the backend.
 * Returns the order_group id so the UI can navigate to the group
 * confirmation page that shows ALL items.
 *
 * @param {Array<{id:any, product_id?:any, quantity:number}>} cartItems
 * @param {{ firstName, lastName, address, city, zip, country }} [shippingInfo]
 * @returns {Promise<{ orderId: string|null, orderGroup: string|null }>}
 */
export async function placeOrder(cartItems, shippingInfo = {}) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new Error('Your bag is empty.');
  }
  if (!sessionStorage.getItem('token')) {
    const err = new Error('You must be logged in to place an order.');
    err.code = 'UNAUTHENTICATED';
    throw err;
  }

  const { firstName, lastName, address, city, zip, country } = shippingInfo;
  const shipping_address = [
    firstName && lastName ? `${firstName} ${lastName}` : '',
    address,
    city && zip ? `${city} ${zip}` : city || zip || '',
    country,
  ].filter(Boolean).join(', ') || null;

  // Build the items array for the batch endpoint
  const items = cartItems.map(item => ({
    product_id: item.product_id ?? item.id,
    quantity: item.quantity,
  }));

  const res = await authFetch(`${API_BASE}/api/orders/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, shipping_address }),
  });

  let data = {};
  try { data = await res.json(); } catch { /* non-json response */ }

  if (!res.ok) {
    throw new Error(data.error || `Order failed (HTTP ${res.status})`);
  }

  // Return the order_group for the confirmation page
  const firstOrderId = data.orders?.[0]?.order_id || null;
  return { orderId: firstOrderId, orderGroup: data.order_group || null };
}
