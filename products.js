const idToken = sessionStorage.getItem("idToken");
    const name = sessionStorage.getItem("displayName");
    const email = sessionStorage.getItem("email");

    if (!idToken) {
      window.location.href = "index.html";
    } else {
      document.getElementById("userInfo").innerHTML = `
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
      `;
    }

    document.getElementById("logoutBtn").addEventListener("click", () => {
      sessionStorage.clear();
      window.location.href = "index.html";
    });
    const role = sessionStorage.getItem("role");
if (role === "admin") {
  document.getElementById("adminFormContainer").style.display = "block";
}
const adminForm = document.getElementById("adminProductForm");
adminForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const idToken = sessionStorage.getItem("idToken");

  const name = document.getElementById("productName").value;
  const description = document.getElementById("productDescription").value;
  const price = document.getElementById("productPrice").value;

  try {
    // Firestore REST API: create document with auto-generated ID
    await axios.post(
      `https://firestore.googleapis.com/v1/projects/onlineshopping-be882/databases/(default)/documents/shoppingProducts`,
      {
        fields: {
          name: { stringValue: name },
          description: { stringValue: description },
          price: { integerValue: price },
        },
      },
      {
        headers: { Authorization: `Bearer ${idToken}` },
      }
    );

    alert("Product added successfully!");
    adminForm.reset();
    fetchProducts(); // refresh product list
  } catch (err) {
    console.error("Error adding product:", err.response?.data || err);
    alert("Failed to add product.");
  }
});


   async function fetchProducts() {
  const container = document.getElementById("productsContainer");
  container.innerHTML = ""; 

  const idToken = sessionStorage.getItem("idToken");
  const role = sessionStorage.getItem("role"); 

  try {
    const res = await axios.get(
      "https://firestore.googleapis.com/v1/projects/onlineshopping-be882/databases/(default)/documents/shoppingProducts",
      {
        headers: { Authorization: `Bearer ${idToken}` },
      }
    );

    const products = res.data.documents || [];

 products.forEach((productDoc) => {
  const fields = productDoc.fields || {};
  const productId = productDoc.name.split("/").pop();

  const productName = fields.name?.stringValue || "Unnamed Product";
  const productDescription = fields.desc?.stringValue || "";
  const productPrice = fields.price?.integerValue || fields.price?.doubleValue || "N/A";

  const productBox = document.createElement("div");
  productBox.classList.add("product-box");

  productBox.innerHTML = `
    <h3>${productName}</h3>
    <p>${productDescription}</p>
    <p>Price: ${productPrice}</p>
  `;

  if (sessionStorage.getItem("role") === "admin") {
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";

    deleteBtn.addEventListener("click", async () => {
      try {
        const idToken = sessionStorage.getItem("idToken");
        await axios.delete(
          `https://firestore.googleapis.com/v1/projects/onlineshopping-be882/databases/(default)/documents/shoppingProducts/${productId}`,
          {
            headers: { Authorization: `Bearer ${idToken}` },
          }
        );
        productBox.remove(); // remove from page immediately
        alert("Product deleted successfully!");
      } catch (err) {
        console.error("Error deleting product:", err.response?.data || err);
        alert("Failed to delete product.");
      }
    });

    productBox.appendChild(deleteBtn);
  }

  container.appendChild(productBox);
});

  } catch (err) {
    console.error("Error fetching products:", err.response?.data || err);
  }
}


    fetchProducts();