const idToken = sessionStorage.getItem("idToken");
const role = sessionStorage.getItem("role");
if (!idToken || role != "admin") {
  alert("Access denied! Admins only.");
  window.location.href = "index.html";
}

document.getElementById("backBtn").addEventListener("click", () => {
  window.location.href = "products.html";
});

const customerTableContainer = document.getElementById("customerTableContainer");
const customerFrom = document.getElementById("customerFrom");
const customerTo = document.getElementById("customerTo");

async function fetchCustomerData() {
  try {
    const res = await axios.get(
      `https://firestore.googleapis.com/v1/projects/onlineshopping-be882/databases/(default)/documents/users`,
      { headers: { Authorization: `Bearer ${idToken}` } }
    );
    return res.data.documents || [];
  } catch (err) {
    console.error("Error fetching customers:", err);
    return [];
  }
}

function renderCustomerTable(customers) {
  if(customers.length === 0) {
    customerTableContainer.innerHTML = "<p>No data found.</p>";
    return;
  }

  let table = "<table><tr><th>Name</th><th>Email</th><th>Cart Items</th></tr>";
  customers.forEach(c => {
    const fields = c.fields || {};
    const name = fields.name?.stringValue || "-";
    const email = fields.email?.stringValue || "-";
    const cartCount = fields.cart?.arrayValue?.values?.length || 0;
    table += `<tr><td>${name}</td><td>${email}</td><td>${cartCount}</td></tr>`;
  });
  table += "</table>";
  customerTableContainer.innerHTML = table;
}

document.getElementById("customerAllBtn").addEventListener("click", async () => {
  const customers = await fetchCustomerData();
  renderCustomerTable(customers);
});

document.getElementById("customerTop10Btn").addEventListener("click", async () => {
  let customers = await fetchCustomerData();
  customers.sort((a,b)=>{
    const aCount = a.fields.cart?.arrayValue?.values?.length || 0;
    const bCount = b.fields.cart?.arrayValue?.values?.length || 0;
    return bCount - aCount;
  });
  renderCustomerTable(customers.slice(0,10));
});

// TODO: Add cashPurchaseBtn and creditPurchaseBtn logic similarly

// ---------- INVENTORY REPORTS ----------
const inventoryTableContainer = document.getElementById("inventoryTableContainer");

async function fetchProducts() {
  try {
    const res = await axios.get(
      `https://firestore.googleapis.com/v1/projects/onlineshopping-be882/databases/(default)/documents/shoppingProducts`,
      { headers: { Authorization: `Bearer ${idToken}` } }
    );
    return res.data.documents || [];
  } catch (err) {
    console.error("Error fetching products:", err);
    return [];
  }
}

function renderInventoryTable(products) {
  if(products.length === 0){
    inventoryTableContainer.innerHTML = "<p>No products found.</p>";
    return;
  }
  let table = "<table><tr><th>Name</th><th>Category</th><th>Price</th><th>Qty</th></tr>";
  products.forEach(p=>{
    const f=p.fields||{};
    table+=`<tr>
      <td>${f.name?.stringValue||"-"}</td>
      <td>${f.category?.stringValue||"-"}</td>
      <td>${f.price?.integerValue||f.price?.doubleValue||"-"}</td>
      <td>${f.quantity?.integerValue||0}</td>
    </tr>`;
  });
  table+="</table>";
  inventoryTableContainer.innerHTML = table;
}

document.getElementById("currentStockBtn").addEventListener("click", async ()=>{
  const products = await fetchProducts();
  renderInventoryTable(products);
});

document.getElementById("categoryStockBtn").addEventListener("click", async ()=>{
  const products = await fetchProducts();
  const grouped = {};
  products.forEach(p=>{
    const cat = p.fields.category?.stringValue || "No Category";
    if(!grouped[cat]) grouped[cat]=[];
    grouped[cat].push(p);
  });
  let html="";
  for(let cat in grouped){
    html+=`<h3>${cat}</h3>`;
    let table="<table><tr><th>Name</th><th>Qty</th></tr>";
    grouped[cat].forEach(p=>{
      table+=`<tr><td>${p.fields.name?.stringValue||"-"}</td><td>${p.fields.quantity?.integerValue||0}</td></tr>`;
    });
    table+="</table>";
    html+=table;
  }
  inventoryTableContainer.innerHTML=html;
});

document.getElementById("highLowStockBtn").addEventListener("click", async ()=>{
  const products = await fetchProducts();
  const high = products.filter(p=>(p.fields.quantity?.integerValue||0)>100);
  const low = products.filter(p=>(p.fields.quantity?.integerValue||0)<15);
  let html="<h3>High Stock (&gt;100)</h3>";
  html+=renderInventoryTableHTML(high);
  html+="<h3>Low Stock (&lt;15)</h3>";
  html+=renderInventoryTableHTML(low);
  inventoryTableContainer.innerHTML=html;
});

function renderInventoryTableHTML(products){
  if(products.length===0) return "<p>No products</p>";
  let table="<table><tr><th>Name</th><th>Qty</th></tr>";
  products.forEach(p=>{
    table+=`<tr><td>${p.fields.name?.stringValue||"-"}</td><td>${p.fields.quantity?.integerValue||0}</td></tr>`;
  });
  table+="</table>";
  return table;
}

// ---------- SALES REPORTS ----------
const salesTableContainer = document.getElementById("salesTableContainer");

async function fetchOrders() {
  try{
    const res = await axios.get(
      `https://firestore.googleapis.com/v1/projects/onlineshopping-be882/databases/(default)/documents/orders`,
      { headers: { Authorization: `Bearer ${idToken}` } }
    );
    return res.data.documents || [];
  }catch(err){ console.error("Error fetching orders:",err); return []; }
}

function renderSalesTable(orders){
  if(orders.length===0){ salesTableContainer.innerHTML="<p>No orders</p>"; return; }
  let table="<table><tr><th>Name</th><th>Email</th><th>Products</th><th>Total</th><th>Payment</th></tr>";
  orders.forEach(o=>{
    const f=o.fields||{};
    const prods = f.products?.arrayValue?.values?.map(p=>p.mapValue.fields.name.stringValue).join(", ")||"-";
    table+=`<tr>
      <td>${f.name?.stringValue||"-"}</td>
      <td>${f.email?.stringValue||"-"}</td>
      <td>${prods}</td>
      <td>${f.totalAmount?.integerValue||0}</td>
      <td>${f.paymentMethod?.stringValue||"-"}</td>
    </tr>`;
  });
  table+="</table>";
  salesTableContainer.innerHTML=table;
}

document.getElementById("allSalesBtn").addEventListener("click", async ()=>{
  const orders = await fetchOrders();
  renderSalesTable(orders);
});

// TODO: Add categorySalesBtn, cashSalesBtn, creditSalesBtn, top10Btn, bottom10Btn
