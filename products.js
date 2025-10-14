const idToken = localStorage.getItem("idToken");
    const name = localStorage.getItem("displayName");
    const email = localStorage.getItem("email");

    if (!idToken) {
      window.location.href = "index.html";
    } else {
      document.getElementById("userInfo").innerHTML = `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
      `;
    }

    document.getElementById("logoutBtn").addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "index.html";
    });

    async function fetchProducts() {
      try {
        const res = await axios.get(FIREBASE_CONFIG.FIRESTORE_URL, {
          headers: { Authorization: `Bearer ${idToken}` },
        });

        const docs = res.data.documents;
        if (!docs || docs.length === 0) {
          document.getElementById("productList").innerText = "No products found.";
          return;
        }

        const html = docs
          .map((doc) => {
            const f = doc.fields;
            return `
              <div class="product">
                ${f.image ? `<img src="${f.image.stringValue}" alt="">` : ""}
                <h3>${f.productName?.stringValue}</h3>
                <p>Price: ₹${f.price?.integerValue}</p>
              </div>
            `;
          })
          .join("");
        document.getElementById("productList").innerHTML = html;
      } catch (err) {
        console.error("Error fetching products:", err.response?.data || err);
        document.getElementById("productList").innerText = "Failed to load products.";
      }
    }

    fetchProducts();