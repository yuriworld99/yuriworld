(function () {
  let miId = null;

  const ICONO_LIBRO =
    '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>';

  function pestanaDelPerfil() {
    const nav = document.querySelector(".perfil-pestanas");
    if (!nav || nav.querySelector(".yw-pestana-biblioteca")) return;

    const objetivo = new URLSearchParams(window.location.search).get("id") || miId;
    if (!objetivo) return;

    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "perfil-pestana yw-pestana-biblioteca";
    boton.textContent = "Biblioteca";
    boton.addEventListener("click", function () {
      window.location.href = "biblioteca.html?id=" + encodeURIComponent(objetivo);
    });

    nav.appendChild(boton);
  }

  function enlaceDelMenu() {
    if (!miId) return;

    const menu = document.querySelector("#drawer-cuerpo .drawer-menu");
    if (!menu || menu.querySelector("[data-biblioteca]")) return;

    const enlace = document.createElement("a");
    enlace.className = "drawer-enlace";
    enlace.href = "biblioteca.html?id=" + encodeURIComponent(miId);
    enlace.dataset.biblioteca = "1";
    enlace.innerHTML = ICONO_LIBRO;

    const etiqueta = document.createElement("span");
    etiqueta.textContent = "Mi biblioteca";
    enlace.appendChild(etiqueta);

    const notificaciones = menu.querySelector("[data-notificaciones]");
    if (notificaciones) {
      notificaciones.insertAdjacentElement("afterend", enlace);
    } else {
      menu.appendChild(enlace);
    }
  }

  function decorar() {
    pestanaDelPerfil();
    enlaceDelMenu();
  }

  async function iniciar() {
    const { data } = await supabaseClient.auth.getSession();
    miId = data.session ? data.session.user.id : null;

    decorar();
    new MutationObserver(decorar).observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  iniciar();
})();
