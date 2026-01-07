document.getElementById("enterRealmBtn").addEventListener("click", () => {
  const token = localStorage.getItem("token");

  if (token) {
    window.location.href = "browse.html";
  } else {
    window.location.href = "login.html";
  }
});
