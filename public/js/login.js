document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value.trim();

  if (!email || !password) {
    alert("Please enter email + password.");
    return;
  }

  const loginBtn = document.getElementById("loginBtn");
  loginBtn.disabled = true;
  loginBtn.textContent = "Logging in...";

  try {
    const res = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.message || "Login failed");
      loginBtn.disabled = false;
      loginBtn.textContent = "ENTER QUIETLY";
      return;
    }

    // store token and user data
    localStorage.setItem("token", data.token);
    localStorage.setItem("currentUser", JSON.stringify(data.user));

    // tore user points
    if (data.user.points) {
      localStorage.setItem("points", data.user.points);
    }

    alert("Login successful!");
    window.location.href = "browse.html";
  } catch (err) {
    console.error(err);
    alert("Server error. Please try again.");
    loginBtn.disabled = false;
    loginBtn.textContent = "ENTER QUIETLY";
  }
});
