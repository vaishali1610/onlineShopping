const idToken = sessionStorage.getItem("idToken");
const name = sessionStorage.getItem("displayName");
const email = sessionStorage.getItem("email");
const role = sessionStorage.getItem("role");
let currentPage = 1;
const productsPerPage = 4;

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

const showFormBtn = document.getElementById("showAdminFormBtn");
const adminFormContainer = document.getElementById("adminFormContainer");

if (role === "admin") {

  showFormBtn.style.display = "inline-block";
  showFormBtn.addEventListener("click", () => {
    adminFormContainer.style.display =
      adminFormContainer.style.display === "none" ? "block" : "none";
  });

  const adminForm = document.getElementById("adminProductForm");
  adminForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("productName").value;
    const description = document.getElementById("productDescription").value;
    const price = document.getElementById("productPrice").value;
    const quantity = document.getElementById("productQuantity").value;

    try {
      await axios.post(
        `https://firestore.googleapis.com/v1/projects/onlineshopping-be882/databases/(default)/documents/shoppingProducts`,
        {
          fields: {
            name: { stringValue: name },
            description: { stringValue: description },
            price: { integerValue: parseInt(price) },
            quantity: { integerValue: parseInt(quantity) },
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
    const totalProducts = products.length;
    const totalPages = Math.ceil(totalProducts / productsPerPage);
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const paginatedProducts = products.slice(startIndex, endIndex);
    paginatedProducts.forEach((productDoc) => {
      const fields = productDoc.fields || {};
      const productId = productDoc.name.split("/").pop();

      const productName = fields.name?.stringValue || "Unnamed Product";
      const productDescription = fields.description?.stringValue || "";
      const productPrice =
        fields.price?.integerValue || fields.price?.doubleValue || "N/A";
      const productQty = fields.quantity?.integerValue || 0;

      const productBox = document.createElement("div");
      productBox.classList.add("product-box");

      productBox.innerHTML = `
        <h3>${productName}</h3>
        <p>${productDescription}</p>
        <p>Price: ₹${productPrice}</p>
        <p>Available: ${productQty}</p>
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

        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        editBtn.addEventListener("click", () => {
          openEditForm(productId, productName, productDescription, productPrice, productQty);
        });

        productBox.appendChild(editBtn);
        productBox.appendChild(deleteBtn);
      } else {
        const qtyContainer = document.createElement("div");
        qtyContainer.classList.add("quantity-control");

        const minusBtn = document.createElement("button");
        minusBtn.textContent = "-";
        const qtyDisplay = document.createElement("span");
        qtyDisplay.textContent = "1";
        const plusBtn = document.createElement("button");
        plusBtn.textContent = "+";

        qtyContainer.appendChild(minusBtn);
        qtyContainer.appendChild(qtyDisplay);
        qtyContainer.appendChild(plusBtn);
        productBox.appendChild(qtyContainer);

        let selectedQty = 1;

        minusBtn.addEventListener("click", () => {
          if (selectedQty > 1) {
            selectedQty--;
            qtyDisplay.textContent = selectedQty;
          }
        });

        plusBtn.addEventListener("click", () => {
          if (selectedQty < productQty) {
            selectedQty++;
            qtyDisplay.textContent = selectedQty;
          }
        });

        const addToCartBtn = document.createElement("button");
        addToCartBtn.textContent = "Add to Cart";
        if (productQty == 0) {
          addToCartBtn.style.cursor = "not-allowed";
          addToCartBtn.disabled = true;
          addToCartBtn.textContent = "Out of Stock";
          addToCartBtn.style.backgroundColor = "#aba1a1ff";
        }

        addToCartBtn.addEventListener("click", () =>
          addToCart(productId, productName, productPrice, selectedQty)
        );
        productBox.appendChild(addToCartBtn);
      }

      container.appendChild(productBox);
    });

    const paginationContainer = document.getElementById("paginationContainer");
    paginationContainer.innerHTML = "";
    const prevBtn = document.createElement("button");
    prevBtn.textContent = "Prev";
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        fetchProducts();
      }
    });
    paginationContainer.appendChild(prevBtn);
    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      if (i === currentPage) btn.classList.add("active");
      btn.addEventListener("click", () => {
        currentPage = i;
        fetchProducts();
      });
      paginationContainer.appendChild(btn);
    }
    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next";
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener("click", () => {
      if (currentPage < totalPages) {
        currentPage++;
        fetchProducts();
      }
    });
    paginationContainer.appendChild(nextBtn);

  } catch (err) {
    console.error("Error fetching products:", err.response?.data || err);
  }
}

if(role=="admin"){
    const viewCartBtn = document.createElement("button");
viewCartBtn.innerHTML = '<i class="fa-solid fa-cart-shopping"></i> View Cart';
document.body.appendChild(viewCartBtn);
viewCartBtn.addEventListener("click", openCartModal);
}
async function openCartModal() {
  const cartModal = document.getElementById("cartModal");
  const cartContainer = document.getElementById("cartItemsContainer");
  const totalAmountEl = document.getElementById("totalAmount");

  cartContainer.innerHTML = "";
  let total = 0;

  try {
    const safeUserId = email.replace(/\./g, "_").replace(/@/g, "_");

    const userRes = await axios.get(
      `https://firestore.googleapis.com/v1/projects/onlineshopping-be882/databases/(default)/documents/users/${safeUserId}`,
      { headers: { Authorization: `Bearer ${idToken}` } }
    );

    const userDoc = userRes.data;
    const cartItems = userDoc.fields.cart?.arrayValue?.values || [];

    if (cartItems.length === 0) {
      cartContainer.innerHTML = "<p>Your cart is empty.</p>";
      totalAmountEl.innerHTML = `<strong>Total:</strong> ₹0`;
    } else {
      cartItems.forEach((item) => {
        const data = item.mapValue.fields;
        const name = data.name.stringValue;
        const price = parseInt(data.price.integerValue);
        const qty = parseInt(data.quantity.integerValue);
        const subtotal = price * qty;
        total += subtotal;

        const div = document.createElement("div");
        div.classList.add("cart-item");
        div.innerHTML = `
          <p><strong>${name}</strong></p>
          <p>Qty: ${qty}</p>
          <p>Price: ₹${price}</p>
          <p>Subtotal: ₹${subtotal}</p>
          <hr>
        `;
        cartContainer.appendChild(div);
      });

      totalAmountEl.innerHTML = `<strong>Total:</strong> ₹${total}`;
    }
    cartModal.style.display = "flex";
    document.getElementById("closeCart").onclick = () => {
      cartModal.style.display = "none";
    };
    window.onclick = (e) => {
      if (e.target === cartModal) cartModal.style.display = "none";
    };

 document.getElementById("applyCouponBtn").onclick = async () => {
  try {
    const ordersRes = await axios.get(
      `https://firestore.googleapis.com/v1/projects/onlineshopping-be882/databases/(default)/documents/orders`,
      { headers: { Authorization: `Bearer ${idToken}` } }
    );

    const orders = ordersRes.data.documents || [];
    const userOrders = orders.filter(
      (o) =>
        o.fields &&
        o.fields.email &&
        o.fields.email.stringValue === email
    );

    if (userOrders.length === 0) {
      total = Math.round(total * 0.9); // 10% off
      totalAmountEl.innerHTML = `<strong>Total (after 10% off):</strong> ₹${total}`;
      alert("Coupon applied! 10% off on your first order 🎉");
    } else {
      alert("Coupon only valid for your first order.");
    }
  } catch (err) {
    console.error("Error checking orders:", err.response?.data || err);
    alert("Failed to check coupon eligibility.");
  }
};
    document.getElementById("placeOrderBtn").onclick = async () => {
      const paymentMethod = document.getElementById("paymentMethod").value;

      if (cartItems.length === 0) {
        alert("Your cart is empty!");
        return;
      }

      try {
        await axios.post(
          `https://firestore.googleapis.com/v1/projects/onlineshopping-be882/databases/(default)/documents/orders`,
          {
            fields: {
              name: { stringValue: name },
              email: { stringValue: email },
              paymentMethod: { stringValue: paymentMethod },
              totalAmount: { integerValue: total },
              products: { arrayValue: { values: cartItems } },
              orderDate: { timestampValue: new Date().toISOString() },
            },
          },
          { headers: { Authorization: `Bearer ${idToken}` } }
        );

        alert("Order placed successfully!");
        cartModal.style.display = "none";

        await axios.patch(
          `https://firestore.googleapis.com/v1/projects/onlineshopping-be882/databases/(default)/documents/users/${safeUserId}?updateMask.fieldPaths=cart`,
          { fields: { cart: { arrayValue: {} } } },
          { headers: { Authorization: `Bearer ${idToken}` } }
        );

        fetchProducts();
      } catch (err) {
        console.error("Error placing order:", err.response?.data || err);
        alert("Failed to place order.");
      }
    };
  } catch (err) {
    console.error("Error fetching cart:", err.response?.data || err);
  }
}


async function addToCart(productId, productName, productPrice, selectedQty) {
  try {
    const safeUserId = email.replace(/\./g, "_").replace(/@/g, "_");
    const productRes = await axios.get(
      `https://firestore.googleapis.com/v1/projects/onlineshopping-be882/databases/(default)/documents/shoppingProducts/${productId}`,
      { headers: { Authorization: `Bearer ${idToken}` } }
    );

    const productDoc = productRes.data;
    let availableQty = parseInt(productDoc.fields.quantity?.integerValue || 0);

    if (availableQty < selectedQty) {
      alert("Sorry, not enough stock available!");
      return;
    }
    await axios.patch(
      `https://firestore.googleapis.com/v1/projects/onlineshopping-be882/databases/(default)/documents/shoppingProducts/${productId}?updateMask.fieldPaths=quantity`,
      {
        fields: {
          quantity: { integerValue: availableQty - selectedQty },
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
        parseInt(existingItem.mapValue.fields.quantity.integerValue) + selectedQty;
    } else {
      currentItems.push({
        mapValue: {
          fields: {
            productId: { stringValue: productId },
            name: { stringValue: productName },
            price: { integerValue: parseInt(productPrice) },
            quantity: { integerValue: selectedQty },
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

    alert("Added to cart");
    fetchProducts(); 
  } catch (err) {
    console.error("Error adding to cart:", err.response?.data || err);
    alert("Failed to add product to cart.");
  }
}

const searchInput = document.getElementById("searchInput");
searchInput.addEventListener("input", () => {
  const searchTerm = searchInput.value.toLowerCase();
  document.querySelectorAll(".product-box").forEach((box) => {
    const productName = box.querySelector("h3").textContent.toLowerCase();
    box.style.display = productName.includes(searchTerm) ? "block" : "none";
  });
});
function openEditForm(id, name, description, price, qty) {
  const container = document.createElement("div");
  container.classList.add("edit-modal");

  container.innerHTML = `
    <div class="edit-modal-content">
      <h3>Edit Product</h3>
      <form id="editForm">
        <input type="text" id="editName" value="${name}" required /><br><br>
        <textarea id="editDescription" required>${description}</textarea><br><br>
        <input type="number" id="editPrice" value="${price}" required /><br><br>
        <input type="number" id="editQty" value="${qty}" required /><br><br>
        <button type="submit">Save Changes</button>
        <button type="button" id="cancelEdit">Cancel</button>
      </form>
    </div>
  `;

  document.body.appendChild(container);

  document.getElementById("cancelEdit").addEventListener("click", () => {
    container.remove();
  });

  document.getElementById("editForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const updatedName = document.getElementById("editName").value;
    const updatedDesc = document.getElementById("editDescription").value;
    const updatedPrice = document.getElementById("editPrice").value;
    const updatedQty = document.getElementById("editQty").value;

    try {
      await axios.patch(
        `https://firestore.googleapis.com/v1/projects/onlineshopping-be882/databases/(default)/documents/shoppingProducts/${id}?updateMask.fieldPaths=name&updateMask.fieldPaths=description&updateMask.fieldPaths=price&updateMask.fieldPaths=quantity`,
        {
          fields: {
            name: { stringValue: updatedName },
            description: { stringValue: updatedDesc },
            price: { integerValue: parseInt(updatedPrice) },
            quantity: { integerValue: parseInt(updatedQty) },
          },
        },
        { headers: { Authorization: `Bearer ${idToken}` } }
      );
      alert("Product updated successfully!");
      container.remove();
      fetchProducts();
    } catch (err) {
      console.error("Error updating product:", err.response?.data || err);
      alert("Failed to update product.");
    }
  });
}
fetchProducts();
