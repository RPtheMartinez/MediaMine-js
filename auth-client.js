(() => {
  const SESSION_USER_KEY = "mediamine.session.user";

  function setFeedbackState(targetElement, message, status) {
    targetElement.textContent = message;
    targetElement.classList.remove("feedback-success", "feedback-error");

    if (status === "success") {
      targetElement.classList.add("feedback-success");
    }

    if (status === "error") {
      targetElement.classList.add("feedback-error");
    }
  }

  async function postJson(url, payload) {
    const response = await fetch(url, {
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

  function setSessionUser(user) {
    sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
  }

  function clearSessionUser() {
    sessionStorage.removeItem(SESSION_USER_KEY);
  }

  window.MediaMineAuth = {
    SESSION_USER_KEY,
    setFeedbackState,
    postJson,
    setSessionUser,
    clearSessionUser
  };
})();
