/* =====================================================
   data.js – Firebase First + Offline fallback
===================================================== */

const DB = {
  products: "Products",
  customers: "Customers",
  invoices: "Invoices",
  invoiceItems: "InvoiceItems",
  payments: "Payments",
  stockUpdates: "StockUpdates"
};

const DataStore = {
  products: [],
  customers: [],
  invoices: []
};

const FALLBACK_PRODUCTS = [
  { barcode:"11001000111", name:"جاكيت", priceRetail:90, priceWholesale:80 },
  { barcode:"20001000111", name:"بنطلون", priceRetail:70, priceWholesale:60 }
];

function fbOK() {
  return !!(window.FIREBASE_OK && window.FB && window.FB.db);
}

/* --------------------------
   Loaders
-------------------------- */

async function loadProducts() {
  try {
    if (fbOK()) {
      const rows = await window.FB.getAll(DB.products);
      DataStore.products = (rows || []).map(p => ({
        barcode: String(p.barcode || p.__docId || ""),
        name: p.name || "",
        priceRetail: Number(p.priceRetail || 0),
        priceWholesale: Number(p.priceWholesale || 0)
      })).filter(p => p.barcode);
      if (!DataStore.products.length) DataStore.products = FALLBACK_PRODUCTS.slice();
    } else {
      DataStore.products = FALLBACK_PRODUCTS.slice();
    }
  } catch (e) {
    console.error("loadProducts error", e);
    DataStore.products = FALLBACK_PRODUCTS.slice();
  }
}

async function loadCustomers() {
  try {
    if (fbOK()) {
      const rows = await window.FB.getAll(DB.customers);
      DataStore.customers = (rows || [])
        .map(c => ({ name: (c.name || c.__docId || "").trim() }))
        .filter(c => c.name);
      if (!DataStore.customers.length) DataStore.customers = [{ name: "زبون نقدي" }, { name: "تاجر" }];
    } else {
      DataStore.customers = [{ name: "زبون نقدي" }, { name: "تاجر" }];
    }
  } catch (e) {
    console.error("loadCustomers error", e);
    DataStore.customers = [{ name: "زبون نقدي" }, { name: "تاجر" }];
  }
  updateCustomersDatalist();
}

async function loadInvoices() {
  try {
    if (!fbOK()) {
      DataStore.invoices = [];
      return;
    }

    const inv = await window.FB.getAll(DB.invoices);
    const items = await window.FB.getAll(DB.invoiceItems);

    const map = {};
    (inv || []).forEach(r => {
      const id = String(r.id || r.__docId || "");
      if (!id) return;
      map[id] = {
        id,
        type: r.type,
        name: r.name,
        customerType: r.customerType,
        dateISO: r.dateISO,
        discount: Number(r.discount || 0),
        paid: Number(r.paid || 0),
        total: Number(r.total || 0),
        items: []
      };
    });

    (items || []).forEach(line => {
      const invoiceId = String(line.invoiceId || "");
      if (!map[invoiceId]) return;
      map[invoiceId].items.push({
        barcode: String(line.barcode || ""),
        name: line.name || "",
        qty: Number(line.qty || 0),
        price: Number(line.price || line.priceRetail || line.priceWholesale || 0)
      });
    });

    DataStore.invoices = Object.values(map);
  } catch (e) {
    console.error("loadInvoices error", e);
    DataStore.invoices = [];
  }
}

/* --------------------------
   Stocks (dynamic)
-------------------------- */
async function calculateAllStocks() {
  if (!fbOK()) {
    // Offline fallback: مخزون صفر (أو عدّلها حسب رغبتك)
    return {};
  }

  const adds = await window.FB.getAll(DB.stockUpdates);
  const sales = await window.FB.getAll(DB.invoiceItems);
  const stockMap = {};

  (adds || []).forEach(r => {
    const bc = String(r.barcode || "");
    const qty = Number(r.changeQty || 0);
    if (!bc) return;
    stockMap[bc] = (stockMap[bc] || 0) + qty;
  });

  (sales || []).forEach(r => {
    const bc = String(r.barcode || "");
    const qty = Number(r.qty || 0);
    if (!bc) return;
    stockMap[bc] = (stockMap[bc] || 0) - qty;
  });

  return stockMap;
}

/* --------------------------
   Save Invoice (Batch)
-------------------------- */
async function saveInvoiceToDB(invoice) {
  if (!fbOK()) {
    return { status: "error", message: "Firebase not ready" };
  }

  try {
    const batch = window.FB.batch();

    // Invoice doc id = invoice.id
    const invRef = window.FB.docRef(DB.invoices, invoice.id);
    batch.set(invRef, {
      id: String(invoice.id),
      type: invoice.type,
      name: invoice.name,
      customerType: invoice.customerType || "cash",
      dateISO: invoice.dateISO,
      discount: Number(invoice.discount || 0),
      paid: Number(invoice.paid || 0),
      total: Number(invoice.total || 0),
      updatedAt: window.FB.FieldValue.serverTimestamp()
    }, { merge: true });

    // Items + StockUpdates sale
    (invoice.items || []).forEach((line, idx) => {
      const itemId = `${invoice.id}_${idx}_${line.barcode}`;
      const itemRef = window.FB.docRef(DB.invoiceItems, itemId);

      batch.set(itemRef, {
        invoiceId: String(invoice.id),
        barcode: String(line.barcode),
        name: line.name,
        qty: Number(line.qty || 0),
        price: Number(line.price || 0),
        dateISO: invoice.dateISO
      }, { merge: true });

      const stId = `${invoice.id}_${idx}_${line.barcode}_sale`;
      const stRef = window.FB.docRef(DB.stockUpdates, stId);

      batch.set(stRef, {
        barcode: String(line.barcode),
        changeQty: -Number(line.qty || 0),
        source: "sale",
        notes: "Invoice " + String(invoice.id),
        dateISO: invoice.dateISO
      }, { merge: true });
    });

    await batch.commit();
    return { status: "success" };
  } catch (e) {
    console.error("saveInvoiceToDB error", e);
    return { status: "error", message: e.message };
  }
}

/* --------------------------
   Save stock update + product
-------------------------- */
async function saveProductToDB(data) {
  if (!fbOK()) {
    return { status: "error", message: "Firebase not ready" };
  }

  try {
    // 1) upsert product doc id = barcode
    await window.FB.set(DB.products, String(data.barcode), {
      barcode: String(data.barcode),
      name: data.name,
      priceRetail: Number(data.priceRetail || 0),
      priceWholesale: Number(data.priceWholesale || 0),
      updatedAt: window.FB.FieldValue.serverTimestamp()
    }, true);

    // 2) stock update record (unique by timestamp)
    const docId = `${data.dateISO}_${data.barcode}_${data.source}_${Date.now()}`;
    await window.FB.set(DB.stockUpdates, docId, {
      barcode: String(data.barcode),
      changeQty: Number(data.qty || 0),
      source: data.source,
      notes: data.notes || "",
      dateISO: data.dateISO
    }, true);

    return { status: "success" };
  } catch (e) {
    console.error("saveProductToDB error", e);
    return { status: "error", message: e.message };
  }
}

/* --------------------------
   Datalist
-------------------------- */
function updateCustomersDatalist() {
  const dl = document.querySelector("#customers-list");
  if (!dl) return;
  dl.innerHTML = "";
  const names = [...new Set(DataStore.customers.map(c => c.name))].filter(Boolean);
  names.forEach(n => {
    const opt = document.createElement("option");
    opt.value = n;
    dl.appendChild(opt);
  });
}

/* --------------------------
   Load All
-------------------------- */
async function loadAllData() {
  console.log("loadAllData()", fbOK() ? "FIREBASE" : "OFFLINE");
  await loadProducts();
  await loadCustomers();
  await loadInvoices();
}
