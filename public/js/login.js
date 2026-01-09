document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value.trim();

  // load users list (array)
  let users = [];
  try {
    users = JSON.parse(localStorage.getItem("users")) || [];
  } catch {
    users = [];
  }

  // if no users at all
  if (users.length === 0) {
    alert("No record found.\nYou need to create an account first.");
    window.location.href = "signup.html";
    return;
  }

  // find matching email
  const user = users.find((u) => (u.email || "").toLowerCase() === email);

  // email not recorded
  if (!user) {
    alert("That email is not recorded.\nCreate an account first.");
    window.location.href = "signup.html";
    return;
  }

  // email exists but password wrong
  if (user.password !== password) {
    alert("Invalid email or password.\nTry again.");
    return;
  }

  // login success
  localStorage.setItem("token", "aizawa-approved-token");

  // save user in BOTH keys so all pages work:
  const savedUser = {
    codename: user.codename || user.username || "",
    username: user.username || user.codename || "",
    email: user.email,
  };

  localStorage.setItem("currentUser", JSON.stringify(savedUser));
  localStorage.setItem("user", JSON.stringify(savedUser));

  // Go to browse (your original flow)
  window.location.href = "browse.html";
});
