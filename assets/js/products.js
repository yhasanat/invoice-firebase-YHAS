/* ===============================
   products.js – Firebase FINAL
================================ */

async function renderStockTable(filter = "") {
  const tbody = $("#stock-table tbody");
  const stock = await calculateAllStocks();
  tbody.innerHTML = "";

  DataStore.products
    .filter(p =>
      !filter ||
      p.barcode.includes(filter) ||
      p.name.toLowerCase().includes(filter.toLowerCase())
    )
    .forEach(p => {
      const tr = create("tr");
      tr.innerHTML = `
        <td>${p.barcode}</td>
        <td>${p.name}</td>
        <td>${fnum(p.priceRetail)}</td>
        <td>${fnum(p.priceWholesale)}</td>
        <td>${stock[p.barcode] || 0}</td>
      `;
      tbody.appendChild(tr);
    });
}

async function saveStockItem() {
  const barcode = $("#stock-barcode").value.trim();
  const name = $("#stock-name").value.trim();
  const priceRetail = Number($("#stock-price-retail").value || 0);
  const priceWholesale = Number($("#stock-price-wholesale").value || 0);
  const qty = Number($("#stock-qty").value || 0);

  await fbSet("Products", barcode, {
    barcode, name, priceRetail, priceWholesale
  });

  await fbAdd("StockUpdates", {
    barcode,
    changeQty: qty,
    source: "manual",
    notes: "",
    dateISO: todayISO()
  });

  alert("تم الحفظ على Firebase");
  renderStockTable();
}
