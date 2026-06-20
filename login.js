const loginForm = document.getElementById("loginForm");
const loginFeedback = document.getElementById("loginFeedback");
const loginBtn = document.getElementById("loginBtn");

const { postJson, setFeedbackState, setSessionUser } = window.MediaMineAuth;

function setLoginFeedback(message, status) {
  setFeedbackState(loginFeedback, message, status);
}

async function signIn(payload) {
  return postJson("/api/login", payload);
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = String(loginForm.email.value || "").trim();
  const password = String(loginForm.password.value || "").trim();

  if (!email || !password) {
    setLoginFeedback("Please enter your email and password.", "error");
    return;
  }

  loginBtn.disabled = true;
  setLoginFeedback("Signing you in...", null);

  try {
    const result = await signIn({ email, password });
    if (result && result.user) {
      setSessionUser(result.user);
    }

    setLoginFeedback("Sign in successful. Redirecting...", "success");
    window.location.href = "/index.html";
  } catch (error) {
    setLoginFeedback(`Login failed: ${error.message}`, "error");
  } finally {
    loginBtn.disabled = false;
  }
});
