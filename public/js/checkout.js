const API_BASE =
  location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://YOUR-BACKEND.onrender.com"; // 🔴 CHANGE THIS

let stripe;
let elements;
let cardNumber, cardExpiry, cardCvc;

const errorMsg = document.getElementById("errorMsg");
const payBtn = document.getElementById("payBtn");

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.remove("hidden");
}

/* ---------- API FETCH ---------- */
async function apiFetch(path, options = {}) {
  const res = await fetch(API_BASE + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
}

/* ---------- INIT STRIPE ---------- */
async function initStripe() {
  try {
    // get publishable key from backend
    const config = await apiFetch("/api/payments/config");

    stripe = Stripe(config.publishableKey);
    elements = stripe.elements();

    cardNumber = elements.create("cardNumber");
    cardExpiry = elements.create("cardExpiry");
    cardCvc = elements.create("cardCvc");

    cardNumber.mount("#card-number");
    cardExpiry.mount("#card-expiry");
    cardCvc.mount("#card-cvc");

    console.log("Stripe mounted OK");
  } catch (e) {
    console.error(e);
    showError("Failed to initialize Stripe");
  }
}

/* ---------- PAY ---------- */
payBtn.addEventListener("click", async () => {
  errorMsg.classList.add("hidden");

  if (!stripe || !cardNumber) {
    showError("Stripe not ready. Refresh page.");
    return;
  }

  try {
    // 1) Create PaymentIntent
    const pi = await apiFetch("/api/payments/create-payment-intent", {
      method: "POST",
      body: JSON.stringify({
        items: JSON.parse(localStorage.getItem("cart") || "[]"),
        shippingCents: 500,
      }),
    });

    // 2) Confirm card payment
    const result = await stripe.confirmCardPayment(pi.clientSecret, {
      payment_method: {
        card: cardNumber,
        billing_details: {
          name: document.getElementById("cardName").value,
        },
      },
    });

    if (result.error) {
      showError(result.error.message);
      return;
    }

    // 3) Success
    localStorage.removeItem("cart");
    window.location.href = "confirmed.html";
  } catch (e) {
    console.error(e);
    showError(e.message || "Payment failed");
  }
});

/* ---------- START ---------- */
initStripe();
