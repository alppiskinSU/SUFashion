/**
 * Sort a copy of the products array for Collections grid.
 * @param {Array} products
 * @param {'default'|'price_asc'|'price_desc'|'popularity'} mode
 */
export function sortProducts(products, mode) {
  if (!Array.isArray(products) || mode === 'default') return [...products];

  const copy = [...products];
  if (mode === 'price_asc') {
    copy.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
  } else if (mode === 'price_desc') {
    copy.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
  } else if (mode === 'popularity') {
    copy.sort((a, b) => (Number(b.popularity) || 0) - (Number(a.popularity) || 0));
  }
  return copy;
}
