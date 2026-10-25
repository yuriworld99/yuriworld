(function () {
  let conteo = 0;

  function agregarEstilos(ruta) {
    const base = ruta.split("?")[0];
    if (document.querySelector('link[href^="' + base + '"]')) return;
    const enlace = document.createElement("link");
    enlace.rel = "stylesheet";
    enlace.href = ruta;
    document.head.appendChild(enlace);
  }

  agregarEstilos("css/notificaciones.css?v=1");

  const ICONO_CAMPANA =
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></svg>';

  function decorar() {
    const botonMenu = document.getElementById("boton-menu");
    if (botonMenu && conteo > 0 && !botonMenu.querySelector(".punto-notificaciones")) {
      botonMenu.style.position = "relative";
      const punto = document.createElement("span");
      punto.className = "punto-notificaciones";
      botonMenu.appendChild(punto);
    }

    const menu = document.querySelector("#drawer-cuerpo .drawer-menu");
    if (menu && !menu.querySelector("[data-notificaciones]")) {
      const enlace = document.createElement("a");
      enlace.className = "drawer-enlace";
      enlace.href = "notificaciones.html";
      enlace.dataset.notificaciones = "1";
      enlace.innerHTML = ICONO_CAMPANA;

      const etiqueta = document.createElement("span");
      etiqueta.textContent = "Notificaciones";
      enlace.appendChild(etiqueta);

      if (conteo > 0) {
        const insignia = document.createElement("span");
        insignia.className = "notif-insignia";
        insignia.textContent = conteo > 99 ? "99+" : String(conteo);
        enlace.appendChild(insignia);
      }

      menu.insertBefore(enlace, menu.firstChild);
    }
  }

  async function iniciar() {
    const { data } = await supabaseClient.auth.getSession();
    if (!data.session) return;

    const { count } = await supabaseClient
      .from("notificaciones")
      .select("id", { count: "exact", head: true })
      .eq("destinatario_id", data.session.user.id)
      .eq("leida", false);

    conteo = count || 0;

    decorar();
    new MutationObserver(decorar).observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  iniciar();
})();
