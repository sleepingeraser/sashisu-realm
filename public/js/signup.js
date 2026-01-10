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
    const res = await fetch("http://localhost:3000/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codename, email, password }),
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.message || "Signup failed");
      signupBtn.disabled = false;
      signupBtn.textContent = "CREATE RECORD";
      return;
    }

    alert("Signup successful! Please login.");
    window.location.href = "login.html";
  } catch (err) {
    console.error(err);
    alert("Server error. Please try again.");
    signupBtn.disabled = false;
    signupBtn.textContent = "CREATE RECORD";
  }
});
