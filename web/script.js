const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const tabLogin = document.getElementById("tabLogin");
const tabSignup = document.getElementById("tabSignup");
const viewLogin = document.getElementById("viewLogin");
const viewSignup = document.getElementById("viewSignup");
const goToSignupBtn = document.getElementById("goToSignupBtn");
const goToLoginBtn = document.getElementById("goToLoginBtn");

function activateView(target) {
  const isLogin = target === "login";
  tabLogin.classList.toggle("active", isLogin);
  tabSignup.classList.toggle("active", !isLogin);
  viewLogin.classList.toggle("active", isLogin);
  viewSignup.classList.toggle("active", !isLogin);

  // clear messages when switching
  document.getElementById("loginMsg").textContent = "";
  document.getElementById("signupMsg").textContent = "";
}

tabLogin.addEventListener("click", () => activateView("login"));
tabSignup.addEventListener("click", () => activateView("signup"));
goToSignupBtn.addEventListener("click", () => activateView("signup"));
goToLoginBtn.addEventListener("click", () => activateView("login"));

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const res = await fetch("http://localhost:8081/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json().catch(() => ({}));
    const msg = document.getElementById("loginMsg");

    if (res.ok) {
      localStorage.setItem("token", data.token || "");
      msg.textContent = "Login successful, redirecting to dashboard...";
      msg.className = "message success";
      console.log("Login response:", res.status, data);
      // Redirect to dashboard in the same tab
      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 600);
    } else {
      msg.textContent = data.error || "Login failed";
      msg.className = "message error";
      console.log("Login response (error):", res.status, data);
    }
  } catch (err) {
    console.error("Login error:", err);
    const msg = document.getElementById("loginMsg");
    msg.textContent = "Cannot connect to server.";
    msg.className = "message error";
  }
});

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("signupName").value;
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  try {
    const res = await fetch("http://localhost:8081/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json().catch(() => ({}));
    const msg = document.getElementById("signupMsg");

    if (res.ok) {
      msg.textContent = "Sign up successful! You can now login.";
      msg.className = "message success";
      console.log("Signup response:", res.status, data);
      // After sign up, automatically switch back to login tab
      setTimeout(() => activateView("login"), 700);
    } else {
      msg.textContent = data.error || "Sign up failed";
      msg.className = "message error";
      console.log("Signup response (error):", res.status, data);
    }
  } catch (err) {
    console.error("Signup error:", err);
    const msg = document.getElementById("signupMsg");
    msg.textContent = "Cannot connect to server.";
    msg.className = "message error";
  }
});
