const idToken = sessionStorage.getItem("idToken");
const name = sessionStorage.getItem("displayName");
const email = sessionStorage.getItem("email");
const role = sessionStorage.getItem("role");

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

if (role === "admin") {
  document.getElementById("adminFormContainer").style.display = "block";

  const adminForm = document.getElementById("adminProductForm");

  adminForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("productName").value;
    const description = document.getElementById("productDescription").value;
    const price = document.getElementById("productPrice").value;

    try {
      await axios.post(
        `https://firestore.googleapis.com/v1/projects/onlineshopping-be882/databases/(default)/documents/shoppingProducts`,
        {
          fields: {
            name: { stringValue: name },
            description: { stringValue: description },
            price: { integerValue: parseInt(price) },
          },
        },
        { headers: { Authorization: `Bearer ${idToken}` } }
      );

      alert("Product added successfully!");
      adminForm.reset();
      fetchProducts();
    } catch (err) {
      console.error("Error adding product:", err.response?.data || err);
      alert("Failed to add product.");
    }
  });
}

async function fetchProducts() {
  const container = document.getElementById("productsContainer");
  container.innerHTML = "";

  try {
    const res = await axios.get(
      "https://firestore.googleapis.com/v1/projects/onlineshopping-be882/databases/(default)/documents/shoppingProducts",
      { headers: { Authorization: `Bearer ${idToken}` } }
    );

    const products = res.data.documents || [];

    products.forEach((productDoc) => {
      const fields = productDoc.fields || {};
      const productId = productDoc.name.split("/").pop();

      const productName = fields.name?.stringValue || "Unnamed Product";
      const productDescription = fields.description?.stringValue || "";
      const productPrice =
        fields.price?.integerValue || fields.price?.doubleValue || "N/A";

      const productBox = document.createElement("div");
      productBox.classList.add("product-box");

      productBox.innerHTML = `
        <h3>${productName}</h3>
        <p>${productDescription}</p>
        <p>Price: ₹${productPrice}</p>
      `;

      if (role === "admin") {
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener("click", async () => {
          try {
            await axios.delete(
              `https://firestore.googleapis.com/v1/projects/onlineshopping-be882/databases/(default)/documents/shoppingProducts/${productId}`,
              { headers: { Authorization: `Bearer ${idToken}` } }
            );
            productBox.remove();
            alert("Product deleted successfully!");
          } catch (err) {
            console.error("Error deleting product:", err.response?.data || err);
            alert("Failed to delete product.");
          }
        });
        productBox.appendChild(deleteBtn);
      } else {
        const addToCartBtn = document.createElement("button");
        addToCartBtn.textContent = "Add to Cart";
        addToCartBtn.addEventListener("click", () =>
          addToCart(productId, productName, productPrice)
        );
        productBox.appendChild(addToCartBtn);
      }

      container.appendChild(productBox);
    });
  } catch (err) {
    console.error("Error fetching products:", err.response?.data || err);
  }
}

async function addToCart(productId, productName, productPrice) {
  try {
    const safeUserId = email.replace(/\./g, "_").replace(/@/g, "_");

    const productRes = await axios.get(
      `https://firestore.googleapis.com/v1/projects/onlineshopping-be882/databases/(default)/documents/shoppingProducts/${productId}`,
      { headers: { Authorization: `Bearer ${idToken}` } }
    );

    const productDoc = productRes.data;
    let availableQty = parseInt(productDoc.fields.quantity?.integerValue || 1);

    if (availableQty <= 0) {
      alert("Sorry, this product is out of stock!");
      return;
    }

    await axios.patch(
      `https://firestore.googleapis.com/v1/projects/onlineshopping-be882/databases/(default)/documents/shoppingProducts/${productId}?updateMask.fieldPaths=quantity`,
      {
        fields: {
          quantity: { integerValue: availableQty - 1 },
        },
      },
      { headers: { Authorization: `Bearer ${idToken}` } }
    );

    const userRes = await axios.get(
      `https://firestore.googleapis.com/v1/projects/onlineshopping-be882/databases/(default)/documents/users/${safeUserId}`,
      { headers: { Authorization: `Bearer ${idToken}` } }
    );

    const userDoc = userRes.data;
    let currentItems = userDoc.fields.cart?.arrayValue?.values || [];

    const existingItem = currentItems.find(
      (item) => item.mapValue.fields.productId.stringValue === productId
    );

    if (existingItem) {
      existingItem.mapValue.fields.quantity.integerValue =
        parseInt(existingItem.mapValue.fields.quantity.integerValue) + 1;
    } else {
      currentItems.push({
        mapValue: {
          fields: {
            productId: { stringValue: productId },
            name: { stringValue: productName },
            price: { integerValue: parseInt(productPrice) },
            quantity: { integerValue: 1 },
          },
        },
      });
    }

    await axios.patch(
      `https://firestore.googleapis.com/v1/projects/onlineshopping-be882/databases/(default)/documents/users/${safeUserId}?updateMask.fieldPaths=cart`,
      {
        fields: { cart: { arrayValue: { values: currentItems } } },
      },
      { headers: { Authorization: `Bearer ${idToken}` } }
    );

    alert(`${productName} added to cart!`);
    fetchProducts(); // refresh product list to show updated quantity
  } catch (err) {
    console.error("Error adding to cart:", err.response?.data || err);
    alert("Failed to add product to cart.");
  }
}

fetchProducts();
