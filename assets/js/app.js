/* =====================================================
   app.js – Bootstrap آمن (Offline + Firebase اختياري)
===================================================== */

/* -----------------------------------------------------
   إظهار الصفحات
----------------------------------------------------- */
function showView(viewId){
  $all(".view").forEach(v => v.classList.remove("active"));

  const view = $("#view-" + viewId);
  if(view) view.classList.add("active");

  $all(".nav-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === viewId);
  });

  if(viewId === "dashboard"){
    refreshDashboard();
  }

  if(viewId === "stock"){
    const search = $("#stock-search");
    renderStockTable(search ? search.value : "");
  }
}

/* -----------------------------------------------------
   ربط الأحداث (Safe – لا يكسر التطبيق)
----------------------------------------------------- */
function initEvents(){

  /* التنقل */
  $all(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      showView(btn.dataset.view);
    });
  });

  /* معلومات */
  on("#btn-update-balances","click", () => {
    alert("يتم احتساب الأرصدة تلقائياً من الفواتير المسجلة.");
  });

  /* تحديث المخزون */
  on("#btn-recalc-stock","click", async () => {
    await loadProducts();
    const s = $("#stock-search");
    await renderStockTable(s ? s.value : "");
    await refreshDashboard();
    alert("تم تحديث عرض المخزون.");
  });

  /* مزامنة */
  on("#btn-full-sync","click", async () => {
    const res = await syncAllPendingData();
    await loadAllData();
    await refreshDashboard();
    alert(
      "المزامنة:\n" +
      `فواتير مرسلة: ${res.invoicesSent}\n` +
      `فواتير متبقية: ${res.invoicesRemaining}\n` +
      `مخزون مرسل: ${res.stockSent}\n` +
      `مخزون متبقي: ${res.stockRemaining}`
    );
  });

  /* باركود – مفرق */
  on("#retail-barcode","keydown", e => {
    if(e.key === "Enter"){
      const code = e.target.value.trim();
      const qty  = Number($("#retail-default-qty")?.value || 1);
      if(code){
        addItemToCurrentInvoice(code, qty, "retail");
        e.target.value = "";
      }
    }
  });

  /* باركود – جملة */
  on("#wh-barcode","keydown", e => {
    if(e.key === "Enter"){
      const code = e.target.value.trim();
      const qty  = Number($("#wh-default-qty")?.value || 1);
      if(code){
        addItemToCurrentInvoice(code, qty, "wholesale");
        e.target.value = "";
      }
    }
  });

  /* البحث */
  on("#retail-search","input", e => {
    const r = searchProductsAdvanced(e.target.value);
    showSuggestions(r, e.target, "retail");
  });

  on("#wh-search","input", e => {
    const r = searchProductsAdvanced(e.target.value);
    showSuggestions(r, e.target, "wholesale");
  });

  /* خصم ودفع */
  on("#retail-discount","input", () => updateInvoiceTotals("retail"));
  on("#retail-paid","input", () => updateInvoiceTotals("retail"));
  on("#wh-discount","input", () => updateInvoiceTotals("wholesale"));
  on("#wh-paid","input", () => updateInvoiceTotals("wholesale"));

  on("#retail-customer","change", () => updateInvoiceTotals("retail"));
  on("#wh-customer","change", () => updateInvoiceTotals("wholesale"));

  /* أزرار الفواتير */
  on("#btn-retail-new","click", () => createNewInvoice("retail"));
  on("#btn-wh-new","click", () => createNewInvoice("wholesale"));

  on("#btn-retail-save","click", () => saveCurrentInvoice("retail", false));
  on("#btn-retail-save-payment-only","click", () => saveCurrentInvoice("retail", true));
  on("#btn-wh-save","click", () => saveCurrentInvoice("wholesale", false));
  on("#btn-wh-save-payment-only","click", () => saveCurrentInvoice("wholesale", true));

  /* طباعة */
  on("#btn-retail-print","click", () => printCurrentInvoice("retail"));
  on("#btn-wh-print","click", () => printCurrentInvoice("wholesale"));

  /* كشف حساب */
  if (typeof runStatement === "function") {
  on("#btn-st-run","click", runStatement);
} else {
  console.warn("runStatement not loaded");
}

if (typeof printStatement === "function") {
  on("#btn-st-print","click", printStatement);
} else {
  console.warn("printStatement not loaded");
}

  /* إدارة الأصناف */
  on("#btn-stock-save","click", saveStockItem);
  on("#stock-search","input", e => renderStockTable(e.target.value));
}

/* -----------------------------------------------------
   Bootstrap نهائي – لا يعتمد على DOMContentLoaded
----------------------------------------------------- */
(async function bootstrapApp(){
  try {
    console.log("BOOTSTRAP START");

    /* تحميل البيانات (Offline أو Firebase) */
    await loadAllData();

    /* إنشاء فاتورة افتراضية */
  if (typeof createNewInvoice !== "function") {
  alert("invoice.js لم يتم تحميله");
  return;
}

await createNewInvoice("retail");


    /* ربط الأحداث */
    initEvents();

    /* تهيئة المزامنة */
    if(typeof initSync === "function"){
      initSync();
    }

    /* لوحة التحكم */
    await refreshDashboard();

    console.log("BOOTSTRAP DONE");
  } catch (e) {
    console.error("BOOTSTRAP ERROR:", e);
    alert("حدث خطأ أثناء تشغيل النظام – راجع Console");
  }
})();
