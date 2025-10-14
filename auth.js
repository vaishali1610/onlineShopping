

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
      sessionStorage.setItem("idToken", data.idToken);
      sessionStorage.setItem("displayName", data.displayName);
      sessionStorage.setItem("email", data.email);

      let role = "user"; 
      try {
        const roleRes = await axios.get(
          `https://firestore.googleapis.com/v1/projects/onlineshopping-be882/databases/(default)/documents/roles/${data.email}`,
          {
            headers: { Authorization: `Bearer ${data.idToken}` },
          }
        );

        role = roleRes.data.fields?.role?.stringValue || "user";
      } catch (err) {
        console.warn("No role found, defaulting to user");
      }

      sessionStorage.setItem("role", role);

      window.location.href = "products.html";
    } catch (err) {
      console.error("Auth Error:", err.response?.data || err);
      alert("Authentication failed. Please try again.");
    }
  }
}
