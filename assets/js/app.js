/* -----------------------------------------
   app.js – نقطة دخول التطبيق
------------------------------------------*/

function showView(viewId){
  $all(".view").forEach(v => v.classList.remove("active"));
  $("#view-" + viewId).classList.add("active");
  $all(".nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === viewId);
  });

  if(viewId === "dashboard"){
    refreshDashboard();
  } else if(viewId === "stock"){
    renderStockTable($("#stock-search").value);
  }
}

function initEvents(){

  $("#btn-update-balances").addEventListener("click", () => {
    alert("يتم احتساب الأرصدة من الفواتير المسجلة (مدين - دائن) لكل عميل دون تعديل يدوي.");
  });

  $("#btn-recalc-stock").addEventListener("click", async () => {
    await loadProducts();
    await renderStockTable($("#stock-search").value);
    await refreshDashboard();
    alert("تم تحديث عرض المخزون من Firebase باستخدام المعادلة الديناميكية.");
  });

  $("#btn-full-sync").addEventListener("click", async () => {
    const syncRes = await syncAllPendingData();
    await loadProducts();
    await loadCustomers();
    await loadInvoices();
    await refreshDashboard();
    alert(
      "مزامنة البيانات المعلقة مع Firebase:\n" +
      `- فواتير أرسلت: ${syncRes.invoicesSent} (متبقي: ${syncRes.invoicesRemaining})\n` +
      `- حركات مخزون أرسلت: ${syncRes.stockSent} (متبقي: ${syncRes.stockRemaining})`
    );
  });

  $all(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      showView(btn.dataset.view);
    });
  });

  $("#retail-barcode").addEventListener("keydown", e => {
    if(e.key === "Enter"){
      const code = e.target.value.trim();
      const qty = Number($("#retail-default-qty").value || 1);
      if(code){
        addItemToCurrentInvoice(code, qty, "retail");
        e.target.value = "";
      }
    }
  });

  $("#wh-barcode").addEventListener("keydown", e => {
    if(e.key === "Enter"){
      const code = e.target.value.trim();
      const qty = Number($("#wh-default-qty").value || 1);
      if(code){
        addItemToCurrentInvoice(code, qty, "wholesale");
        e.target.value = "";
      }
    }
  });

  $("#retail-search").addEventListener("input", e => {
    const text = e.target.value;
    const results = searchProductsAdvanced(text);
    showSuggestions(results, e.target, "retail");
  });

  $("#wh-search").addEventListener("input", e => {
    const text = e.target.value;
    const results = searchProductsAdvanced(text);
    showSuggestions(results, e.target, "wholesale");
  });

  $("#retail-discount").addEventListener("input", () => updateInvoiceTotals("retail"));
  $("#retail-paid").addEventListener("input", () => updateInvoiceTotals("retail"));
  $("#wh-discount").addEventListener("input", () => updateInvoiceTotals("wholesale"));
  $("#wh-paid").addEventListener("input", () => updateInvoiceTotals("wholesale"));

  $("#retail-customer").addEventListener("change", () => updateInvoiceTotals("retail"));
  $("#wh-customer").addEventListener("change", () => updateInvoiceTotals("wholesale"));

  $("#btn-retail-new").addEventListener("click", () => createNewInvoice("retail"));
  $("#btn-wh-new").addEventListener("click", () => createNewInvoice("wholesale"));

  $("#btn-retail-save").addEventListener("click", () => saveCurrentInvoice("retail", false));
  $("#btn-retail-save-payment-only").addEventListener("click", () => saveCurrentInvoice("retail", true));
  $("#btn-wh-save").addEventListener("click", () => saveCurrentInvoice("wholesale", false));
  $("#btn-wh-save-payment-only").addEventListener("click", () => saveCurrentInvoice("wholesale", true));

  $("#btn-retail-print").addEventListener("click", () => printCurrentInvoice("retail"));
  $("#btn-wh-print").addEventListener("click", () => printCurrentInvoice("wholesale"));

  $("#btn-st-run").addEventListener("click", runStatement);
  $("#btn-st-print").addEventListener("click", printStatement);

  $("#btn-stock-save").addEventListener("click", saveStockItem);
  $("#stock-search").addEventListener("input", e => {
    renderStockTable(e.target.value);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadAllData();
  await createNewInvoice("retail");
  initEvents();
  initSync();
  await refreshDashboard();
});
