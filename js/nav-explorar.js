(function () {
  const ICONO =
    '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';

  function decorar() {
    document.querySelectorAll(".nav-inferior").forEach(function (nav) {
      if (nav.querySelector('a[href="explorar.html"]')) return;

      const enlace = document.createElement("a");
      enlace.href = "explorar.html";
      enlace.className = "nav-item";
      enlace.innerHTML = ICONO + "<span>Explorar</span>";

      const primero = nav.firstElementChild;
      if (primero && primero.nextElementSibling) {
        nav.insertBefore(enlace, primero.nextElementSibling);
      } else {
        nav.appendChild(enlace);
      }
    });
  }

  new MutationObserver(decorar).observe(document.body, {
    childList: true,
    subtree: true
  });

  decorar();
})();
