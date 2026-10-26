(async function () {
  const estado = document.getElementById("estado-notificaciones");
  const contenido = document.getElementById("contenido-notificaciones");
  const lista = document.getElementById("lista-notificaciones");
  const botonMarcar = document.getElementById("marcar-todas");

  const { data: datosSesion } = await supabaseClient.auth.getSession();
  const sesion = datosSesion.session;

  if (!sesion) {
    estado.textContent = "Iniciá sesión para ver tus notificaciones.";
    return;
  }

  estado.hidden = true;
  contenido.hidden = false;

  function icono(ruta) {
    return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ruta + "</svg>";
  }

  const ICONOS = {
    me_gusta: icono('<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>'),
    comentario: icono('<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z"/>'),
    respuesta: icono('<path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5z"/>'),
    repost: icono('<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>'),
    seguidor: icono('<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>')
  };

  const TEXTOS = {
    me_gusta: "le dio Me gusta a tu publicación",
    comentario: "comentó tu publicación",
    respuesta: "respondió a tu comentario",
    repost: "reposteó tu publicación",
    seguidor: "empezó a seguirte"
  };

  function fechaRelativa(iso) {
    const segundos = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (segundos < 60) return "ahora";
    if (segundos < 3600) return "hace " + Math.floor(segundos / 60) + " min";
    if (segundos < 86400) return "hace " + Math.floor(segundos / 3600) + " h";
    if (segundos < 604800) return "hace " + Math.floor(segundos / 86400) + " d";
    return new Date(iso).toLocaleDateString("es");
  }

  function recortar(texto) {
    if (!texto) return "";
    return texto.length > 120 ? texto.slice(0, 120) + "…" : texto;
  }

  async function cargar() {
    const { data: filas, error } = await supabaseClient
      .from("notificaciones")
      .select("id, tipo, actor_id, publicacion_id, respuesta_id, leida, created_at")
      .eq("destinatario_id", sesion.user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      lista.textContent = "No se pudieron cargar las notificaciones.";
      return;
    }

    if (filas.length === 0) {
      const vacio = document.createElement("p");
      vacio.className = "notif-vacio";
      vacio.textContent = "Todavía no tenés notificaciones.";
      lista.replaceChildren(vacio);
      return;
    }

    const idsActores = [];
    const idsPublicaciones = [];
    const idsRespuestas = [];
    filas.forEach(function (fila) {
      if (!idsActores.includes(fila.actor_id)) idsActores.push(fila.actor_id);
      if (fila.publicacion_id && !idsPublicaciones.includes(fila.publicacion_id)) {
        idsPublicaciones.push(fila.publicacion_id);
      }
      if (fila.respuesta_id && !idsRespuestas.includes(fila.respuesta_id)) {
        idsRespuestas.push(fila.respuesta_id);
      }
    });

    const nombres = {};
    const { data: perfiles } = await supabaseClient
      .from("profiles")
      .select("id, username")
      .in("id", idsActores);
    (perfiles || []).forEach(function (perfil) {
      nombres[perfil.id] = perfil.username;
    });

    const publicaciones = {};
    if (idsPublicaciones.length > 0) {
      const { data } = await supabaseClient
        .from("muro_publicaciones")
        .select("id, contenido, rec_titulo, imagen_url")
        .in("id", idsPublicaciones);
      (data || []).forEach(function (fila) {
        publicaciones[fila.id] = fila;
      });
    }

    const respuestas = {};
    if (idsRespuestas.length > 0) {
      const { data } = await supabaseClient
        .from("respuestas")
        .select("id, texto")
        .in("id", idsRespuestas);
      (data || []).forEach(function (fila) {
        respuestas[fila.id] = fila;
      });
    }

    const fragmento = document.createDocumentFragment();

    filas.forEach(function (fila) {
      const enlace = document.createElement("a");
      enlace.className = "notif-item" + (fila.leida ? "" : " nueva");

      if (fila.tipo === "seguidor") {
        enlace.href = "perfil.html?id=" + encodeURIComponent(fila.actor_id);
      } else if (fila.publicacion_id) {
        enlace.href = "publicacion.html?id=" + encodeURIComponent(fila.publicacion_id);
      } else {
        enlace.href = "notificaciones.html";
      }

      const iconoCaja = document.createElement("div");
      iconoCaja.className = "notif-icono " + fila.tipo;
      iconoCaja.innerHTML = ICONOS[fila.tipo] || "";
      if (fila.tipo === "seguidor") {
        iconoCaja.style.background = "#5d2fb8";
      }

      const cuerpo = document.createElement("div");
      cuerpo.className = "notif-cuerpo";

      const texto = document.createElement("p");
      texto.className = "notif-texto";
      const fuerte = document.createElement("strong");
      fuerte.textContent = "@" + (nombres[fila.actor_id] || "usuario");
      texto.appendChild(fuerte);
      texto.append(" " + (TEXTOS[fila.tipo] || "interactuó con vos"));
      cuerpo.appendChild(texto);

      let cita = "";
      if (fila.tipo === "comentario" || fila.tipo === "respuesta") {
        const respuesta = respuestas[fila.respuesta_id];
        cita = respuesta ? respuesta.texto : "";
      } else if (fila.tipo !== "seguidor") {
        const publicacion = publicaciones[fila.publicacion_id];
        if (publicacion) {
          if (publicacion.contenido) cita = publicacion.contenido;
          else if (publicacion.rec_titulo) cita = "Recomendación: " + publicacion.rec_titulo;
          else if (publicacion.imagen_url) cita = "Imagen";
        }
      }

      if (cita) {
        const citaTexto = document.createElement("p");
        citaTexto.className = "notif-cita";
        citaTexto.textContent = recortar(cita);
        cuerpo.appendChild(citaTexto);
      }

      const fecha = document.createElement("p");
      fecha.className = "notif-fecha";
      fecha.textContent = fechaRelativa(fila.created_at);
      cuerpo.appendChild(fecha);

      enlace.appendChild(iconoCaja);
      enlace.appendChild(cuerpo);

      enlace.addEventListener("click", async function (evento) {
        if (fila.leida) return;
        evento.preventDefault();
        await supabaseClient
          .from("notificaciones")
          .update({ leida: true })
          .eq("id", fila.id);
        window.location.href = enlace.href;
      });

      fragmento.appendChild(enlace);
    });

    lista.replaceChildren(fragmento);
  }

  botonMarcar.addEventListener("click", async function () {
    botonMarcar.disabled = true;
    await supabaseClient
      .from("notificaciones")
      .update({ leida: true })
      .eq("destinatario_id", sesion.user.id)
      .eq("leida", false);
    botonMarcar.disabled = false;
    cargar();
  });

  cargar();
})();
