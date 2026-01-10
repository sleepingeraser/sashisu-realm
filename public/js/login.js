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

    const res = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    console.log("Response status:", res.status);

    const responseText = await res.text();
    console.log("Raw response:", responseText);

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

    // store token and user data
    console.log("Login successful, token received:", data.token ? "Yes" : "No");
    console.log("User data:", data.user);

    localStorage.setItem("token", data.token);
    localStorage.setItem("currentUser", JSON.stringify(data.user));

    // store user points
    if (data.user.points) {
      localStorage.setItem("points", data.user.points);
    }

    alert("Login successful!");
    window.location.href = "browse.html";
  } catch (err) {
    console.error("Login error:", err);
    alert("Server error. Please try again.");
    loginBtn.disabled = false;
    loginBtn.textContent = originalText;
  }
});
