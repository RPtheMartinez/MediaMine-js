const loginForm = document.getElementById("loginForm");
const loginFeedback = document.getElementById("loginFeedback");
const loginBtn = document.getElementById("loginBtn");

const SESSION_USER_KEY = "mediamine.session.user";

function setLoginFeedback(message, status) {
  loginFeedback.textContent = message;
  loginFeedback.classList.remove("feedback-success", "feedback-error");

  if (status === "success") {
    loginFeedback.classList.add("feedback-success");
  }

  if (status === "error") {
    loginFeedback.classList.add("feedback-error");
  }
}

async function signIn(payload) {
  const response = await fetch("/api/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  let body = null;

  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const errorMessage = body && body.message ? body.message : `HTTP ${response.status}`;
    throw new Error(errorMessage);
  }

  return body;
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
      sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(result.user));
    }

    setLoginFeedback("Sign in successful. Redirecting...", "success");
    window.location.href = "/index.html";
  } catch (error) {
    setLoginFeedback(`Login failed: ${error.message}`, "error");
  } finally {
    loginBtn.disabled = false;
  }
});
