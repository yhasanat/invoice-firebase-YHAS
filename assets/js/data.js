
/* ===============================
   data.js – Firebase FINAL
================================ */

const DataStore = {
  products: [],
  customers: [],
  invoices: []
};

async function loadProducts() {
  const rows = await fbGet("Products");
  DataStore.products = rows.map(p => ({
    barcode: p.barcode,
    name: p.name,
    priceRetail: Number(p.priceRetail || 0),
    priceWholesale: Number(p.priceWholesale || 0)
  }));
}

async function loadCustomers() {
  const rows = await fbGet("Customers");
  DataStore.customers = rows;
  const dl = $("#customers-list");
  if (!dl) return;
  dl.innerHTML = "";
  rows.forEach(c => {
    const o = document.createElement("option");
    o.value = c.name;
    dl.appendChild(o);
  });
}

async function loadInvoices() {
  const inv = await fbGet("Invoices");
  const items = await fbGet("InvoiceItems");

  const map = {};
  inv.forEach(i => {
    map[i.id] = { ...i, items: [] };
  });

  items.forEach(it => {
    if (map[it.invoiceId]) {
      map[it.invoiceId].items.push(it);
    }
  });

  DataStore.invoices = Object.values(map);
}

async function calculateAllStocks() {
  const updates = await fbGet("StockUpdates");
  const sales = await fbGet("InvoiceItems");

  const stock = {};
  updates.forEach(r => {
    stock[r.barcode] = (stock[r.barcode] || 0) + Number(r.changeQty || 0);
  });
  sales.forEach(r => {
    stock[r.barcode] = (stock[r.barcode] || 0) - Number(r.qty || 0);
  });
  return stock;
}

async function saveInvoiceToDB(inv) {
  await fbSet("Invoices", inv.id, inv);

  for (const line of inv.items) {
    await fbSet(
      "InvoiceItems",
      `${inv.id}-${line.barcode}`,
      {
        invoiceId: inv.id,
        barcode: line.barcode,
        name: line.name,
        qty: line.qty,
        price: line.price
      }
    );

    await fbAdd("StockUpdates", {
      barcode: line.barcode,
      changeQty: -line.qty,
      source: "sale",
      notes: "Invoice " + inv.id,
      dateISO: inv.dateISO
    });
  }
}
