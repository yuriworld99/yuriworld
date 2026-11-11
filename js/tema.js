(function () {
  var b = document.getElementById("btn-tema");
  if (!b) return;
  function aplicar(t) {
    document.documentElement.dataset.theme = t;
    b.textContent = t === "dark" ? "☀️" : "🌙";
    b.setAttribute("aria-label", t === "dark" ? "Modo claro" : "Modo oscuro");
  }
  aplicar(document.documentElement.dataset.theme || "light");
  b.addEventListener("click", function () {
    var t = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    try { localStorage.setItem("tema", t); } catch (e) {}
    aplicar(t);
  });
})();
