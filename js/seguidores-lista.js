(async function () {
  const estado = document.getElementById("estado-seguidores");
  const contenido = document.getElementById("contenido-seguidores");
  const titulo = document.getElementById("titulo-seguidores");
  const pestanaSeguidores = document.getElementById("pestana-seguidores");
  const pestanaSiguiendo = document.getElementById("pestana-siguiendo");
  const lista = document.getElementById("lista-seguidores");

  const COLORES_AVATAR = ["#e0529a", "#7b3fe4", "#c2418c", "#6a35c9", "#d94f8a", "#8a4fe8", "#b8387f", "#5d2fb8"];

  const parametros = new URLSearchParams(window.location.search);
  const perfilId = parametros.get("id");
  let tipo = parametros.get("tipo") === "siguiendo" ? "siguiendo" : "seguidores";

  if (!perfilId) {
    estado.textContent = "No encontramos ese perfil.";
    return;
  }

  const { data: datosSesion } = await supabaseClient.auth.getSession();
  const sesionId = datosSesion.session ? datosSesion.session.user.id : null;

  const { data: perfil } = await supabaseClient
    .from("profiles")
    .select("id, username")
    .eq("id", perfilId)
    .maybeSingle();

  if (!perfil) {
    estado.textContent = "No encontramos ese perfil.";
    return;
  }

  titulo.textContent = "@" + perfil.username;
  document.title = "@" + perfil.username + " - YuriWorld";
  estado.hidden = true;
  contenido.hidden = false;

  function colorDe(texto) {
    let valor = 0;
    for (let i = 0; i < texto.length; i++) {
      valor = (valor * 31 + texto.charCodeAt(i)) >>> 0;
    }
    return COLORES_AVATAR[valor % COLORES_AVATAR.length];
  }

  function pintarPestanas() {
    pestanaSeguidores.classList.toggle("activa", tipo === "seguidores");
    pestanaSiguiendo.classList.toggle("activa", tipo === "siguiendo");
  }

  function crearBoton(usuarioId, nombre, siguiendoInicial) {
    let siguiendo = siguiendoInicial;
    const boton = document.createElement("button");
    boton.type = "button";

    function pintar() {
      boton.textContent = siguiendo ? "Siguiendo" : "Seguir";
      boton.className = "seg-boton" + (siguiendo ? "" : " seguir");
    }

    pintar();

    boton.addEventListener("click", async function () {
      boton.disabled = true;

      if (siguiendo) {
        if (!confirm("¿Dejar de seguir a @" + nombre + "?")) {
          boton.disabled = false;
          return;
        }
        const { error } = await supabaseClient
          .from("seguidores")
          .delete()
          .eq("seguidor_id", sesionId)
          .eq("seguido_id", usuarioId);
        if (error) alert("No se pudo dejar de seguir.");
        else siguiendo = false;
      } else {
        const { error } = await supabaseClient
          .from("seguidores")
          .insert({ seguido_id: usuarioId });
        if (!error || error.code === "23505") siguiendo = true;
        else alert("No se pudo seguir a este usuario.");
      }

      pintar();
      boton.disabled = false;
    });

    return boton;
  }

  async function cargar() {
    lista.textContent = "Cargando...";

    const columna = tipo === "seguidores" ? "seguidor_id" : "seguido_id";
    const filtro = tipo === "seguidores" ? "seguido_id" : "seguidor_id";

    const { data: filas, error } = await supabaseClient
      .from("seguidores")
      .select(columna)
      .eq(filtro, perfilId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      lista.textContent = "No se pudo cargar la lista.";
      return;
    }

    if (filas.length === 0) {
      const vacio = document.createElement("p");
      vacio.className = "seg-vacio";
      vacio.textContent =
        tipo === "seguidores" ? "Todavía no tiene seguidores." : "Todavía no sigue a nadie.";
      lista.replaceChildren(vacio);
      return;
    }

    const ids = filas.map(function (fila) {
      return fila[columna];
    });

    const { data: perfiles } = await supabaseClient
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", ids);

    const porId = {};
    (perfiles || []).forEach(function (fila) {
      porId[fila.id] = fila;
    });

    const misSeguidos = new Set();
    if (sesionId) {
      const { data: mios } = await supabaseClient
        .from("seguidores")
        .select("seguido_id")
        .eq("seguidor_id", sesionId)
        .in("seguido_id", ids);
      (mios || []).forEach(function (fila) {
        misSeguidos.add(fila.seguido_id);
      });
    }

    const fragmento = document.createDocumentFragment();

    ids.forEach(function (id) {
      const datos = porId[id];
      if (!datos) return;

      const fila = document.createElement("div");
      fila.className = "seg-fila";

      const avatar = document.createElement("a");
      avatar.className = "seg-avatar";
      avatar.href = "perfil.html?id=" + encodeURIComponent(id);
      avatar.style.background = colorDe(datos.username);
      avatar.textContent = datos.username.charAt(0).toUpperCase();
      if (datos.avatar_url) {
        avatar.style.backgroundImage = 'url("' + datos.avatar_url + '")';
        avatar.style.backgroundSize = "cover";
        avatar.style.backgroundPosition = "center";
        avatar.textContent = "";
      }

      const nombre = document.createElement("a");
      nombre.className = "seg-nombre";
      nombre.href = "perfil.html?id=" + encodeURIComponent(id);
      nombre.textContent = "@" + datos.username;

      fila.appendChild(avatar);
      fila.appendChild(nombre);

      if (sesionId && id !== sesionId) {
        fila.appendChild(crearBoton(id, datos.username, misSeguidos.has(id)));
      }

      fragmento.appendChild(fila);
    });

    lista.replaceChildren(fragmento);
  }

  pestanaSeguidores.addEventListener("click", function () {
    tipo = "seguidores";
    pintarPestanas();
    cargar();
  });

  pestanaSiguiendo.addEventListener("click", function () {
    tipo = "siguiendo";
    pintarPestanas();
    cargar();
  });

  pintarPestanas();
  cargar();
})();
