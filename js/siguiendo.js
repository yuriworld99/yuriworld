(function () {
  if (!/foro\.html$/.test(window.location.pathname)) return;

  function agregarEstilos(ruta) {
    const base = ruta.split("?")[0];
    if (document.querySelector('link[href^="' + base + '"]')) return;
    const enlace = document.createElement("link");
    enlace.rel = "stylesheet";
    enlace.href = ruta;
    document.head.appendChild(enlace);
  }

  agregarEstilos("css/seguidores.css?v=1");

  let intentos = 0;
  const espera = setInterval(function () {
    intentos += 1;
    const listo =
      typeof cargarMuro === "function" &&
      document.getElementById("pestana-todo") &&
      document.getElementById("pestana-recomendaciones");

    if (listo) {
      clearInterval(espera);
      iniciar();
    } else if (intentos > 100) {
      clearInterval(espera);
    }
  }, 100);

  async function iniciar() {
    const { data: datosSesion } = await supabaseClient.auth.getSession();
    if (!datosSesion.session) return;

    const contenedor = document.querySelector(".pestanas-comunidad");
    const pestanaTodo = document.getElementById("pestana-todo");
    const pestanaRecs = document.getElementById("pestana-recomendaciones");

    const pestanaSiguiendo = document.createElement("button");
    pestanaSiguiendo.type = "button";
    pestanaSiguiendo.id = "pestana-siguiendo-muro";
    pestanaSiguiendo.className = "pestana-com";
    pestanaSiguiendo.textContent = "Siguiendo";
    contenedor.insertBefore(pestanaSiguiendo, pestanaRecs);

    const cargarMuroOriginal = cargarMuro;

    cargarMuro = async function () {
      if (!pestanaSiguiendo.classList.contains("activa")) {
        return cargarMuroOriginal();
      }
      return cargarMuroSiguiendo();
    };

    contenedor.addEventListener(
      "click",
      function (evento) {
        const boton = evento.target.closest("button");
        if (!boton) return;

        if (boton === pestanaSiguiendo) {
          pestanaTodo.classList.remove("activa");
          pestanaRecs.classList.remove("activa");
          pestanaSiguiendo.classList.add("activa");
          soloRecomendaciones = false;
          cantidadVisible = PAGINA;
          cargarMuro();
        } else {
          pestanaSiguiendo.classList.remove("activa");
        }
      },
      true
    );
  }

  async function cargarMuroSiguiendo() {
    const { data: datosSesion } = await supabaseClient.auth.getSession();
    const miSesion = datosSesion.session;

    if (!miSesion) {
      lista.textContent = "Iniciá sesión para ver lo que publican quienes seguís.";
      botonCargarMas.hidden = true;
      return;
    }

    const { data: seguidos, error: errorSeguidos } = await supabaseClient
      .from("seguidores")
      .select("seguido_id")
      .eq("seguidor_id", miSesion.user.id);

    if (errorSeguidos) {
      lista.textContent = "No se pudo cargar tu lista de seguidos.";
      botonCargarMas.hidden = true;
      return;
    }

    const idsSeguidos = (seguidos || []).map(function (fila) {
      return fila.seguido_id;
    });

    if (idsSeguidos.length === 0) {
      const vacio = document.createElement("p");
      vacio.className = "muro-vacio";
      vacio.textContent = "Todavía no seguís a nadie. Entrá al perfil de alguien y tocá Seguir.";
      lista.replaceChildren(vacio);
      botonCargarMas.hidden = true;
      return;
    }

    const { data: items, error } = await supabaseClient
      .from("muro_publicaciones")
      .select("*")
      .in("user_id", idsSeguidos)
      .order("created_at", { ascending: false })
      .range(0, cantidadVisible - 1);

    if (error) {
      lista.textContent = "No se pudieron cargar las publicaciones.";
      botonCargarMas.hidden = true;
      return;
    }

    if (items.length === 0) {
      const vacio = document.createElement("p");
      vacio.className = "muro-vacio";
      vacio.textContent = "Las personas que seguís todavía no publicaron nada.";
      lista.replaceChildren(vacio);
      botonCargarMas.hidden = true;
      return;
    }

    const originales = {};
    items.forEach(function (item) {
      originales[item.id] = item;
    });

    const faltantes = [];
    items.forEach(function (item) {
      if (item.repost_de && !originales[item.repost_de] && !faltantes.includes(item.repost_de)) {
        faltantes.push(item.repost_de);
      }
    });

    if (faltantes.length > 0) {
      const { data: extra } = await supabaseClient
        .from("muro_publicaciones")
        .select("*")
        .in("id", faltantes);
      (extra || []).forEach(function (original) {
        originales[original.id] = original;
      });
    }

    const idsUsuarios = [];
    function sumarUsuario(id) {
      if (id && !idsUsuarios.includes(id)) idsUsuarios.push(id);
    }
    items.forEach(function (item) {
      sumarUsuario(item.user_id);
      if (item.repost_de && originales[item.repost_de]) {
        sumarUsuario(originales[item.repost_de].user_id);
      }
    });

    const perfiles = {};
    const { data: filasPerfiles } = await supabaseClient
      .from("profiles")
      .select("id, username")
      .in("id", idsUsuarios);
    (filasPerfiles || []).forEach(function (perfil) {
      perfiles[perfil.id] = perfil.username;
    });

    const idsPosts = [];
    items.forEach(function (item) {
      const id = item.repost_de ? item.repost_de : item.id;
      if (!idsPosts.includes(id)) idsPosts.push(id);
    });

    const megusta = new Set();
    const reposteados = new Set();

    if (idsPosts.length > 0) {
      const { data: misMeGusta } = await supabaseClient
        .from("me_gusta")
        .select("publicacion_id")
        .eq("user_id", miSesion.user.id)
        .in("publicacion_id", idsPosts);
      (misMeGusta || []).forEach(function (fila) {
        megusta.add(fila.publicacion_id);
      });

      const { data: misReposts } = await supabaseClient
        .from("publicaciones")
        .select("repost_de")
        .eq("user_id", miSesion.user.id)
        .in("repost_de", idsPosts);
      (misReposts || []).forEach(function (fila) {
        reposteados.add(fila.repost_de);
      });
    }

    const contexto = {
      originales: originales,
      perfiles: perfiles,
      megusta: megusta,
      reposteados: reposteados
    };

    const fragmento = document.createDocumentFragment();
    items.forEach(function (item) {
      const tarjeta = crearPost(item, contexto);
      if (tarjeta) fragmento.appendChild(tarjeta);
    });

    lista.replaceChildren(fragmento);
    botonCargarMas.hidden = items.length < cantidadVisible;
  }
})();
