// ---------- API configuration ----------
const API_BASE = window.location.origin.includes("localhost")
  ? "http://localhost:3000/api"
  : "/api";

console.log("API Base URL:", API_BASE);

document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const codename = document.getElementById("codename").value.trim();
  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value.trim();

  if (!codename || !email || !password) {
    alert("Please fill in all fields.");
    return;
  }

  const signupBtn = document.getElementById("signupBtn");
  signupBtn.disabled = true;
  signupBtn.textContent = "Creating...";

  try {
    console.log("Attempting signup for:", email);
    console.log("Sending request to:", `${API_BASE}/auth/signup`);

    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codename, email, password }),
    });

    console.log("Signup response status:", res.status);
    const data = await res.json();
    console.log("Signup response:", data);

    if (!data.success) {
      alert(data.message || "Signup failed");
      signupBtn.disabled = false;
      signupBtn.textContent = "CREATE RECORD";
      return;
    }

    console.log("Signup successful!");
    alert("Signup successful! Please login.");
    window.location.href = "login.html";
  } catch (err) {
    console.error("Signup error:", err);
    alert("Server error. Please try again.");
    signupBtn.disabled = false;
    signupBtn.textContent = "CREATE RECORD";
  }
});
