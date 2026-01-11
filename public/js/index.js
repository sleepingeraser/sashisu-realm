document.addEventListener("DOMContentLoaded", function () {
  console.log("Home page loaded");

  const enterRealmBtn = document.getElementById("enterRealmBtn");

  if (enterRealmBtn) {
    enterRealmBtn.addEventListener("click", () => {
      const token = localStorage.getItem("token");

      if (token) {
        console.log("User logged in, going to browse");
        window.location.href = "browse.html";
      } else {
        console.log("User not logged in, going to login");
        window.location.href = "login.html";
      }
    });
  }
});
