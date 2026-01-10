document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Please enter email + password.");
    return;
  }

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(data.message || "Login failed");
      return;
    }

    // ✅ this token is what authMiddleware expects
    localStorage.setItem("token", data.token);

    // store user for email usage in checkout
    localStorage.setItem("currentUser", JSON.stringify(data.user));

    alert("Login successful!");
    window.location.href = "browse.html";
  } catch (err) {
    alert("Server error. Please try again.");
    console.error(err);
  }
});
