// ---------- API configuration ----------
const API_BASE = window.location.origin.includes("localhost")
  ? "http://localhost:3000/api"
  : "/api";

console.log("API Base URL:", API_BASE);

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Please enter email + password.");
    return;
  }

  const loginBtn = document.getElementById("loginBtn");
  const originalText = loginBtn.textContent;
  loginBtn.disabled = true;
  loginBtn.textContent = "Logging in...";

  try {
    console.log("Attempting login for:", email);
    console.log("Sending request to:", `${API_BASE}/auth/login`);

    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    console.log("Login response status:", res.status);
    const responseText = await res.text();
    console.log(
      "Raw login response:",
      responseText.substring(0, 200) + "..."
    );

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse response:", parseError);
      throw new Error("Invalid server response");
    }

    if (!data.success) {
      alert(data.message || "Login failed");
      loginBtn.disabled = false;
      loginBtn.textContent = originalText;
      return;
    }

    // check if we got a real token
    console.log(
      "Token received from server:",
      data.token ? data.token.substring(0, 20) + "..." : "NO TOKEN"
    );
    console.log("📏 Token type:", typeof data.token);
    console.log("📏 Token length:", data.token?.length);

    if (!data.token || data.token === "aizawa-approved-token") {
      console.error("Invalid token received from server");
      alert("Login failed: Invalid token received");
      loginBtn.disabled = false;
      loginBtn.textContent = originalText;
      return;
    }

    // store the REAL token
    localStorage.setItem("token", data.token);
    localStorage.setItem("currentUser", JSON.stringify(data.user));

    console.log("Token saved to localStorage. User data:", data.user);
    console.log("Login successful!");

    alert("Login successful!");
    window.location.href = "browse.html";
  } catch (err) {
    console.error("Login error:", err);
    alert("Server error. Please try again.");
    loginBtn.disabled = false;
    loginBtn.textContent = originalText;
  }
});
