(function () {
  const cache = {};
  let programado = false;
  let sesionId = null;

  const promesaSesion = supabaseClient.auth.getSession().then(function (respuesta) {
    sesionId = respuesta.data.session ? respuesta.data.session.user.id : null;
  });

  function idDeAvatar(elemento) {
    const href = elemento.getAttribute("href");
    if (href && href.indexOf("perfil.html?id=") !== -1) {
      return decodeURIComponent(href.split("perfil.html?id=")[1].split("&")[0]);
    }
    if (elemento.closest(".compositor-fila, .compositor-respuesta")) {
      return sesionId;
    }
    if (elemento.closest(".perfil-cabecera")) {
      const idUrl = new URLSearchParams(window.location.search).get("id");
      return idUrl || sesionId;
    }
    return null;
  }

  function aplicarFoto(elemento, direccion) {
    elemento.style.backgroundImage = 'url("' + direccion + '")';
    elemento.style.backgroundSize = "cover";
    elemento.style.backgroundPosition = "center";
    elemento.textContent = "";
  }

  async function procesar() {
    programado = false;
    await promesaSesion;

    const elementos = document.querySelectorAll(".avatar:not([data-foto])");
    const porId = {};

    elementos.forEach(function (elemento) {
      elemento.dataset.foto = "1";
      const id = idDeAvatar(elemento);
      if (!id) return;
      if (!porId[id]) porId[id] = [];
      porId[id].push(elemento);
    });

    const faltantes = Object.keys(porId).filter(function (id) {
      return !(id in cache);
    });

    if (faltantes.length > 0) {
      const { data } = await supabaseClient
        .from("profiles")
        .select("id, avatar_url")
        .in("id", faltantes);
      faltantes.forEach(function (id) {
        cache[id] = null;
      });
      (data || []).forEach(function (perfil) {
        cache[perfil.id] = perfil.avatar_url;
      });
    }

    Object.keys(porId).forEach(function (id) {
      const direccion = cache[id];
      if (!direccion) return;
      porId[id].forEach(function (elemento) {
        aplicarFoto(elemento, direccion);
      });
    });
  }

  function programar() {
    if (programado) return;
    programado = true;
    setTimeout(procesar, 80);
  }

  new MutationObserver(programar).observe(document.body, {
    childList: true,
    subtree: true
  });

  programar();
})();
