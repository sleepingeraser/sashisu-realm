document.getElementById("signupForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const codename = document.getElementById("codename").value.trim();
  const email = document.getElementById("email").value.trim().toLowerCase();
  const password = document.getElementById("password").value.trim();

  // basic validation
  if (!codename || !email || !password) {
    alert("Aizawa needs a complete record.");
    return;
  }

  // load users array
  let users = [];
  try {
    users = JSON.parse(localStorage.getItem("users")) || [];
  } catch {
    users = [];
  }

  // check if email already exists
  const exists = users.some((u) => (u.email || "").toLowerCase() === email);

  if (exists) {
    alert("A record already exists for this email.\nLog in instead.");
    window.location.href = "login.html";
    return;
  }

  // add new user
  users.push({ codename, email, password });
  localStorage.setItem("users", JSON.stringify(users));

  // IMPORTANT: do NOT auto-login
  localStorage.removeItem("token");
  localStorage.removeItem("currentUser");

  // success popup then go login
  alert("Record created successfully.\nNow log in quietly.");
  window.location.href = "login.html";
});
