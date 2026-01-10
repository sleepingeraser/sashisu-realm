document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const codename = document.getElementById("codename").value.trim();
  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value.trim();

  if (!codename || !email || !password) {
    alert("Please fill in all fields.");
    return;
  }

  try {
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codename, email, password }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      alert(data.message || "Signup failed");
      return;
    }

    alert("Signup successful! Please login.");
    window.location.href = "login.html";
  } catch (err) {
    alert("Server error. Please try again.");
    console.error(err);
  }
});
