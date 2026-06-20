const signupForm = document.getElementById("signupForm");
const signupFeedback = document.getElementById("signupFeedback");
const signupBtn = document.getElementById("signupBtn");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const passwordToggles = Array.from(document.querySelectorAll("[data-password-toggle]"));
const SESSION_USER_KEY = "mediamine.session.user";

function validatePasswordMatch() {
  const password = String(passwordInput.value || "");
  const confirmPassword = String(confirmPasswordInput.value || "");

  if (!confirmPassword) {
    confirmPasswordInput.classList.remove("input-error");
    if (signupFeedback.textContent === "Passwords do not match.") {
      setSignupFeedback("", null);
    }
    return true;
  }

  const matches = password === confirmPassword;
  confirmPasswordInput.classList.toggle("input-error", !matches);

  if (!matches) {
    setSignupFeedback("Passwords do not match.", "error");
  } else if (signupFeedback.textContent === "Passwords do not match.") {
    setSignupFeedback("", null);
  }

  return matches;
}

passwordToggles.forEach((toggleBtn) => {
  toggleBtn.addEventListener("click", () => {
    const inputId = toggleBtn.dataset.targetInput || "";
    const input = document.getElementById(inputId);
    if (!input) return;

    const shouldShow = input.type === "password";
    input.type = shouldShow ? "text" : "password";
    toggleBtn.textContent = shouldShow ? "Hide" : "Show";
    toggleBtn.setAttribute("aria-pressed", String(shouldShow));
  });
});

passwordInput.addEventListener("input", validatePasswordMatch);
confirmPasswordInput.addEventListener("input", validatePasswordMatch);

function setSignupFeedback(message, status) {
  signupFeedback.textContent = message;
  signupFeedback.classList.remove("feedback-success", "feedback-error");

  if (status === "success") {
    signupFeedback.classList.add("feedback-success");
  }

  if (status === "error") {
    signupFeedback.classList.add("feedback-error");
  }
}

async function createAccount(payload) {
  const response = await fetch("/api/signup", {
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

signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const firstName = String(signupForm.firstName.value || "").trim();
  const lastName = String(signupForm.lastName.value || "").trim();
  const email = String(signupForm.email.value || "").trim();
  const state = String(signupForm.state.value || "").trim();
  const password = String(signupForm.password.value || "").trim();
  const confirmPassword = String(signupForm.confirmPassword.value || "").trim();

  if (!firstName || !lastName || !email || !password || !confirmPassword) {
    setSignupFeedback("Please fill in all required fields.", "error");
    return;
  }

  if (password.length < 8) {
    setSignupFeedback("Password must be at least 8 characters.", "error");
    return;
  }

  if (password !== confirmPassword) {
    validatePasswordMatch();
    setSignupFeedback("Passwords do not match.", "error");
    return;
  }

  signupBtn.disabled = true;
  setSignupFeedback("Creating your account...", null);

  try {
    const result = await createAccount({
      firstName,
      lastName,
      email,
      state,
      password
    });

    const successMessage = result && result.message
      ? result.message
      : "Signup submitted successfully.";
    setSignupFeedback(successMessage, "success");

    if (result && result.hasSession && result.user) {
      sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(result.user));
      window.location.href = "/index.html";
      return;
    }

    signupForm.reset();
  } catch (error) {
    setSignupFeedback(`Signup failed: ${error.message}`, "error");
  } finally {
    signupBtn.disabled = false;
  }
});
