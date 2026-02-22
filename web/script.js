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

// OAuth Provider Functionality
document.addEventListener('DOMContentLoaded', function() {
  const oauthButtons = document.querySelectorAll('.oauth-btn');
  
  oauthButtons.forEach(button => {
    button.addEventListener('click', async function() {
      const provider = this.getAttribute('data-provider');
      await initiateOAuth(provider);
    });
  });
});

async function initiateOAuth(provider) {
  const msg = document.getElementById("signupMsg");
  
  try {
    // Store OAuth state for security
    const state = generateOAuthState();
    localStorage.setItem('oauth_state', state);
    localStorage.setItem('oauth_provider', provider);
    
    // Get OAuth URLs based on provider
    const oauthUrls = {
      google: `https://accounts.google.com/oauth/authorize?` +
        `client_id=YOUR_GOOGLE_CLIENT_ID&` +
        `redirect_uri=${encodeURIComponent(window.location.origin + '/oauth/callback')}&` +
        `response_type=code&` +
        `scope=email profile&` +
        `state=${state}`,
      
      apple: `https://appleid.apple.com/auth/authorize?` +
        `client_id=YOUR_APPLE_CLIENT_ID&` +
        `redirect_uri=${encodeURIComponent(window.location.origin + '/oauth/callback')}&` +
        `response_type=code&` +
        `scope=email name&` +
        `state=${state}`,
      
      microsoft: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
        `client_id=YOUR_MICROSOFT_CLIENT_ID&` +
        `redirect_uri=${encodeURIComponent(window.location.origin + '/oauth/callback')}&` +
        `response_type=code&` +
        `scope=openid email profile&` +
        `state=${state}`
    };
    
    const authUrl = oauthUrls[provider];
    
    if (authUrl) {
      msg.textContent = `Redirecting to ${provider}...`;
      msg.className = "message";
      
      // Open OAuth provider in popup for better UX
      const popup = window.open(authUrl, `${provider}_oauth`, 'width=500,height=600,scrollbars=yes,resizable=yes');
      
      // Listen for popup close
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          msg.textContent = "OAuth login cancelled or completed.";
          setTimeout(() => {
            msg.textContent = "";
          }, 3000);
        }
      }, 1000);
      
    } else {
      msg.textContent = `${provider} OAuth not configured`;
      msg.className = "message error";
    }
    
  } catch (err) {
    console.error('OAuth error:', err);
    msg.textContent = `Failed to initiate ${provider} login`;
    msg.className = "message error";
  }
}

function generateOAuthState() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Handle OAuth callback (this would be called on a callback page)
function handleOAuthCallback(code, state, provider) {
  const storedState = localStorage.getItem('oauth_state');
  const storedProvider = localStorage.getItem('oauth_provider');
  
  if (state !== storedState || provider !== storedProvider) {
    console.error('OAuth state mismatch');
    return;
  }
  
  // Clear OAuth state
  localStorage.removeItem('oauth_state');
  localStorage.removeItem('oauth_provider');
  
  // Send authorization code to backend
  fetch('/api/oauth/callback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, state, provider })
  })
  .then(response => response.json())
  .then(data => {
    if (data.token) {
      localStorage.setItem('token', data.token);
      window.location.href = 'dashboard.html';
    }
  })
  .catch(err => {
    console.error('OAuth callback error:', err);
  });
}
