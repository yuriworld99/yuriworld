(function () {
  if (!/perfil\.html$/.test(window.location.pathname)) return;

  function agregarEstilos(ruta) {
    const base = ruta.split("?")[0];
    if (document.querySelector('link[href^="' + base + '"]')) return;
    const enlace = document.createElement("link");
    enlace.rel = "stylesheet";
    enlace.href = ruta;
    document.head.appendChild(enlace);
  }

  agregarEstilos("css/seguidores.css?v=1");

  let sesionId = null;
  let montado = false;

  const promesaSesion = supabaseClient.auth.getSession().then(function (respuesta) {
    sesionId = respuesta.data.session ? respuesta.data.session.user.id : null;
  });

  async function montar() {
    if (montado) return;

    const elementoNombre = document.getElementById("perfil-nombre");
    const botones = document.getElementById("perfil-botones");
    const cuentas = document.querySelector(".perfil-cuentas");
    if (!elementoNombre || !elementoNombre.textContent || !botones || !cuentas) return;

    montado = true;
    await promesaSesion;

    const idUrl = new URLSearchParams(window.location.search).get("id");
    const idPerfil = idUrl || sesionId;
    if (!idPerfil) return;

    const esPropio = idPerfil === sesionId;
    const nombreUsuario = elementoNombre.textContent;

    const { count: totalSeguidores } = await supabaseClient
      .from("seguidores")
      .select("seguidor_id", { count: "exact", head: true })
      .eq("seguido_id", idPerfil);

    const { count: totalSiguiendo } = await supabaseClient
      .from("seguidores")
      .select("seguidor_id", { count: "exact", head: true })
      .eq("seguidor_id", idPerfil);

    let cantidadSeguidores = totalSeguidores || 0;

    function crearContador(tipo, cantidad, etiqueta) {
      const contenedor = document.createElement("span");
      const enlace = document.createElement("a");
      enlace.href =
        "seguidores.html?id=" + encodeURIComponent(idPerfil) + "&tipo=" + tipo;
      enlace.style.color = "inherit";
      enlace.style.textDecoration = "none";
      const numero = document.createElement("strong");
      numero.textContent = cantidad;
      enlace.appendChild(numero);
      enlace.append(" " + etiqueta);
      contenedor.appendChild(enlace);
      return { contenedor: contenedor, numero: numero };
    }

    const contadorSeguidores = crearContador("seguidores", cantidadSeguidores, "seguidores");
    const contadorSiguiendo = crearContador("siguiendo", totalSiguiendo || 0, "siguiendo");
    cuentas.appendChild(contadorSeguidores.contenedor);
    cuentas.appendChild(contadorSiguiendo.contenedor);

    if (esPropio) return;

    let siguiendo = false;
    if (sesionId) {
      const { data } = await supabaseClient
        .from("seguidores")
        .select("seguido_id")
        .eq("seguidor_id", sesionId)
        .eq("seguido_id", idPerfil)
        .maybeSingle();
      siguiendo = !!data;
    }

    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "boton-perfil";

    function pintar() {
      boton.textContent = siguiendo ? "Siguiendo" : "Seguir";
      if (siguiendo) {
        boton.style.background = "";
        boton.style.color = "";
        boton.style.borderColor = "";
      } else {
        boton.style.background = "linear-gradient(90deg, #ff5fa2, #7b3fe4)";
        boton.style.color = "#ffffff";
        boton.style.borderColor = "transparent";
      }
    }

    pintar();

    boton.addEventListener("click", async function () {
      if (!sesionId) {
        window.location.href = "iniciar-sesion.html";
        return;
      }

      boton.disabled = true;

      if (siguiendo) {
        if (!confirm("¿Dejar de seguir a @" + nombreUsuario + "?")) {
          boton.disabled = false;
          return;
        }
        const { error } = await supabaseClient
          .from("seguidores")
          .delete()
          .eq("seguidor_id", sesionId)
          .eq("seguido_id", idPerfil);
        if (error) {
          alert("No se pudo dejar de seguir.");
        } else {
          siguiendo = false;
          cantidadSeguidores = Math.max(0, cantidadSeguidores - 1);
        }
      } else {
        const { error } = await supabaseClient
          .from("seguidores")
          .insert({ seguido_id: idPerfil });
        if (!error) {
          siguiendo = true;
          cantidadSeguidores += 1;
        } else if (error.code === "23505") {
          siguiendo = true;
        } else {
          alert("No se pudo seguir a este usuario.");
        }
      }

      contadorSeguidores.numero.textContent = cantidadSeguidores;
      pintar();
      boton.disabled = false;
    });

    botones.insertBefore(boton, botones.firstChild);
    botones.classList.remove("uno");
  }

  new MutationObserver(montar).observe(document.body, {
    childList: true,
    subtree: true
  });

  montar();
})();
