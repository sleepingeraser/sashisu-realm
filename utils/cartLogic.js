function calculateCartTotal(items, discountCode = null) {
  if (!Array.isArray(items)) return 0;
  if (items.length === 0) return 0;

  let total = items.reduce((sum, item) => {
    const price = item.priceCents || 0;
    const qty = item.quantity || 1;
    return sum + price * qty;
  }, 0);

  if (discountCode === "SASHISU10") {
    total = Math.floor(total * 0.9);
  }

  return total;
}

function validateEmail(email) {
  if (typeof email !== "string") return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function formatPrice(cents) {
  if (typeof cents !== "number" || cents < 0) return "$0.00";
  return `$${(cents / 100).toFixed(2)}`;
}

async function fetchExchangeRate(currency) {
  const response = await fetch(`https://api.exchangerate.com/${currency}`);
  const data = await response.json();
  return data.rate;
}

function convertToCurrency(amountCents, rate) {
  if (typeof amountCents !== "number" || typeof rate !== "number") return 0;
  return Math.round(amountCents * rate);
}

module.exports = {
  calculateCartTotal,
  validateEmail,
  formatPrice,
  fetchExchangeRate,
  convertToCurrency,
};
