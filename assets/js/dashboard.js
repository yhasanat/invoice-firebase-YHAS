/* -----------------------------------------
   dashboard.js – لوحة التحكم
------------------------------------------*/

async function refreshDashboard(){
  const stockMap = await calculateAllStocks();

  let lowStockCount = 0;
  DataStore.products.forEach(p => {
    if((stockMap[p.barcode] ?? 0) < 5){
      lowStockCount++;
    }
  });

  const today = todayISO();
  let todaySales = 0;
  let invoicesCount = DataStore.invoices.length;
  let customersCount = new Set(DataStore.customers.map(c => c.name)).size;

  DataStore.invoices.forEach(inv => {
    if(inv.dateISO === today){
      todaySales += Number(inv.total || 0);
    }
  });

  $("#db-today-sales").textContent = fnum(todaySales);
  $("#db-invoices-count").textContent = invoicesCount;
  $("#db-customers-count").textContent = customersCount;
  $("#db-low-stock").textContent = lowStockCount;
}
