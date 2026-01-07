document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value.trim();

  // Load users list (array)
  let users = [];
  try {
    users = JSON.parse(localStorage.getItem("users")) || [];
  } catch {
    users = [];
  }

  // If no users at all
  if (users.length === 0) {
    alert("No record found.\nYou need to create an account first.");
    window.location.href = "signup.html";
    return;
  }

  // Find matching email
  const user = users.find((u) => (u.email || "").toLowerCase() === email);

  // Email not recorded
  if (!user) {
    alert("That email is not recorded.\nCreate an account first.");
    window.location.href = "signup.html";
    return;
  }

  // Email exists but password wrong
  if (user.password !== password) {
    alert("Invalid email or password.\nTry again.");
    return;
  }

  // Login success
  localStorage.setItem("token", "aizawa-approved-token");

  // For account page
  localStorage.setItem(
    "currentUser",
    JSON.stringify({ codename: user.codename, email: user.email })
  );

  window.location.href = "browse.html";
});
