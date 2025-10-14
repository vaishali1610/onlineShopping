

document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("loginBtn");
  if (loginBtn) loginBtn.addEventListener("click", startGoogleLogin);

  handleRedirectAuth();
});


function startGoogleLogin() {
  const oauthUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${FIREBASE_CONFIG.CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(FIREBASE_CONFIG.REDIRECT_URI)}` +
    `&response_type=token` +
    `&scope=profile email` +
    `&prompt=select_account`;

  window.location.href = oauthUrl;
}


async function handleRedirectAuth() {
  if (window.location.hash.includes("access_token")) {
    const params = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = params.get("access_token");
    if (!accessToken) return;

    try {
      const res = await axios.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${FIREBASE_CONFIG.API_KEY}`,
        {
          postBody: `access_token=${accessToken}&providerId=google.com`,
          requestUri: FIREBASE_CONFIG.REDIRECT_URI,
          returnSecureToken: true,
        },
        { headers: { "Content-Type": "application/json" } }
      );

      const data = res.data;
      localStorage.setItem("idToken", data.idToken);
      localStorage.setItem("displayName", data.displayName);
      localStorage.setItem("email", data.email);

      window.location.href = "products.html";
    } catch (err) {
      console.error("Auth Error:", err.response?.data || err);
      alert("Authentication failed. Please try again.");
    }
  }
}
