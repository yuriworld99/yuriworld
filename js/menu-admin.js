(function () {
  let esAdmin = false;
  let pendientes = 0;

  if (!document.querySelector('link[href^="css/notificaciones.css"]')) {
    const enlaceCss = document.createElement("link");
    enlaceCss.rel = "stylesheet";
    enlaceCss.href = "css/notificaciones.css?v=1";
    document.head.appendChild(enlaceCss);
  }

  const ICONO_ESCUDO =
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';

  function decorar() {
    if (!esAdmin) return;

    const menu = document.querySelector("#drawer-cuerpo .drawer-menu");
    if (!menu || menu.querySelector("[data-admin]")) return;

    const enlace = document.createElement("a");
    enlace.className = "drawer-enlace";
    enlace.href = "admin.html";
    enlace.dataset.admin = "1";
    enlace.innerHTML = ICONO_ESCUDO;

    const etiqueta = document.createElement("span");
    etiqueta.textContent = "Administración";
    enlace.appendChild(etiqueta);

    if (pendientes > 0) {
      const insignia = document.createElement("span");
      insignia.className = "notif-insignia";
      insignia.textContent = pendientes > 99 ? "99+" : String(pendientes);
      enlace.appendChild(insignia);
    }

    menu.appendChild(enlace);
  }

  async function iniciar() {
    const { data: datosSesion } = await supabaseClient.auth.getSession();
    if (!datosSesion.session) return;

    const { data } = await supabaseClient.rpc("es_administrador");
    esAdmin = data === true;
    if (!esAdmin) return;

    const { count } = await supabaseClient
      .from("denuncias")
      .select("id", { count: "exact", head: true })
      .eq("estado", "pendiente");
    pendientes = count || 0;

    decorar();
    new MutationObserver(decorar).observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  iniciar();
})();
