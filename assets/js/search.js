/* -----------------------------------------
   search.js – البحث المتقدم عن الأصناف
------------------------------------------*/

function searchProductsAdvanced(txt){
  txt = txt.trim();
  if(!txt) return [];
  const lower = txt.toLowerCase();

  if(txt.startsWith("#")){
    const codePart = txt.substring(1);
    if(!codePart) return [];
    return DataStore.products.filter(p =>
      String(p.barcode || "").includes(codePart)
    );
  }

  return DataStore.products.filter(p =>
    (p.name && String(p.name).toLowerCase().includes(lower)) ||
    String(p.barcode || "").includes(txt)
  );
}

function showSuggestions(results, attachToInput, type){
  const box = $("#search-suggestions");
  box.innerHTML = "";
  if(!results || results.length === 0){
    box.classList.add("hidden");
    return;
  }
  const rect = attachToInput.getBoundingClientRect();
  box.style.left = rect.left + "px";
  box.style.top = (rect.bottom + window.scrollY) + "px";
  box.style.width = rect.width + "px";

  results.forEach(p => {
    const div = create("div","search-item");
    div.textContent = `${p.name} | ${p.barcode}`;
    div.addEventListener("click", () => {
      addItemToCurrentInvoice(p.barcode, 1, type);
      box.classList.add("hidden");
    });
    box.appendChild(div);
  });
  box.classList.remove("hidden");
}

document.addEventListener("click", e => {
  if(
    !e.target.closest("#search-suggestions") &&
    !e.target.closest("#retail-search") &&
    !e.target.closest("#wh-search")
  ){
    const box = $("#search-suggestions");
    if(box) box.classList.add("hidden");
  }
});
