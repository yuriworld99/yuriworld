/* =====================================================================
   Editar perfil a pantalla completa + editor de recorte (foto y banner)
   ===================================================================== */

const PE_COLORES = ["#e0529a", "#7b3fe4", "#c2418c", "#6a35c9", "#d94f8a", "#8a4fe8", "#b8387f", "#5d2fb8"];

const PE_ICONOS = {
  volver: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
  camara: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
  ubicacion: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
  enlace: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
  regalo: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>'
};

function peInyectarEstilos() {
  if (document.getElementById("estilos-perfil-editar")) return;
  const estilo = document.createElement("style");
  estilo.id = "estilos-perfil-editar";
  estilo.textContent = [
    /* datos públicos en el perfil */
    ".perfil-info { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 16px; margin: 10px 0 0; color: var(--texto-suave); font-size: 0.92rem; }",
    ".perfil-info span, .perfil-info a { display: inline-flex; align-items: center; gap: 6px; }",
    ".perfil-info a { color: var(--violeta-texto); text-decoration: none; overflow-wrap: anywhere; }",

    /* pantalla de edición */
    ".pe-pantalla { position: fixed; inset: 0; z-index: 150; display: flex; flex-direction: column; background: var(--superficie); color: var(--texto); }",
    ".pe-barra { display: flex; align-items: center; gap: 12px; min-height: 56px; padding: max(8px, env(safe-area-inset-top)) 14px 8px; border-bottom: 1px solid var(--borde-suave); }",
    ".pe-volver { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border: none; border-radius: 50%; background: none; color: var(--texto); cursor: pointer; }",
    ".pe-barra h2 { flex: 1; margin: 0; font-size: 1.2rem; color: var(--texto); }",
    ".pe-guardar { padding: 8px 20px; border: none; border-radius: 999px; background: linear-gradient(90deg, var(--rosa), var(--violeta)); color: #ffffff; font: inherit; font-weight: 800; cursor: pointer; }",
    ".pe-guardar:disabled { background: transparent; color: var(--texto-suave); cursor: default; }",
    ".pe-cuerpo { flex: 1; overflow-y: auto; padding-bottom: 48px; }",
    ".pe-banner { position: relative; aspect-ratio: 3 / 1; background: linear-gradient(135deg, var(--rosa), var(--violeta)); background-position: center; background-size: cover; }",
    ".pe-banner::after { content: ''; position: absolute; inset: 0; background: rgba(0, 0, 0, 0.28); }",
    ".pe-camara { position: absolute; z-index: 2; display: flex; align-items: center; justify-content: center; width: 46px; height: 46px; border: none; border-radius: 50%; background: rgba(15, 10, 25, 0.62); color: #ffffff; cursor: pointer; }",
    ".pe-camara-banner { top: 50%; left: 50%; transform: translate(-50%, -50%); }",
    ".pe-avatar-fila { position: relative; z-index: 3; margin-top: -48px; padding: 0 16px; }",
    ".pe-avatar { position: relative; display: flex; align-items: center; justify-content: center; width: 96px; height: 96px; overflow: hidden; border: 4px solid var(--superficie); border-radius: 50%; background-position: center; background-size: cover; color: #ffffff; font-size: 38px; font-weight: 700; }",
    ".pe-avatar::after { content: ''; position: absolute; inset: 0; background: rgba(0, 0, 0, 0.28); }",
    ".pe-camara-avatar { top: 50%; left: 50%; transform: translate(-50%, -50%); width: 42px; height: 42px; }",
    ".pe-campos { padding: 8px 16px 0; }",
    ".pe-campo { display: block; margin-top: 8px; padding: 10px 0 6px; border-bottom: 1px solid var(--borde-medio); }",
    ".pe-campo:focus-within { border-bottom-color: var(--violeta-texto); }",
    ".pe-campo > span { display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--texto-suave); }",
    ".pe-campo:focus-within > span { color: var(--violeta-texto); }",
    ".pe-campo input, .pe-campo textarea { display: block; width: 100%; margin: 0; padding: 4px 0; border: none; border-radius: 0; background: transparent; color: var(--texto); font: inherit; font-size: 1.08rem; outline: none; resize: none; }",
    ".pe-visibilidad { display: flex; flex-direction: column; gap: 6px; padding: 10px 0 0; color: var(--texto-suave); font-size: 0.9rem; }",
    ".pe-visibilidad select { padding: 0; border: none; background: transparent; color: var(--violeta-texto); font: inherit; font-weight: 700; }",
    ".pe-nota { margin: 4px 0 0; color: var(--texto-suave); font-size: 0.8rem; }",
    ".pe-mensaje { min-height: 1.3em; margin: 14px 0 0; font-size: 0.92rem; }",
    ".pe-mensaje.error { color: var(--peligro); }",
    ".pe-mensaje.ok { color: #2f9e44; }",

    /* editor de recorte */
    ".rc-pantalla { position: fixed; inset: 0; z-index: 200; display: flex; flex-direction: column; background: var(--superficie); color: var(--texto); }",
    ".rc-barra { display: flex; align-items: center; gap: 12px; min-height: 56px; padding: max(8px, env(safe-area-inset-top)) 14px 8px; border-bottom: 1px solid var(--borde-suave); }",
    ".rc-barra h2 { flex: 1; margin: 0; font-size: 1.1rem; color: var(--texto); }",
    ".rc-aplicar { padding: 8px 18px; border: none; border-radius: 999px; background: linear-gradient(90deg, var(--rosa), var(--violeta)); color: #ffffff; font: inherit; font-weight: 800; cursor: pointer; }",
    ".rc-escenario { position: relative; flex: 1; overflow: hidden; background: var(--fondo-pagina); touch-action: none; user-select: none; -webkit-user-select: none; }",
    ".rc-img { position: absolute; top: 0; left: 0; max-width: none; transform-origin: 0 0; pointer-events: none; -webkit-user-drag: none; }",
    ".rc-marco { position: absolute; box-sizing: border-box; border: 2px solid rgba(255, 255, 255, 0.95); box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.58); pointer-events: none; background-image: linear-gradient(rgba(255,255,255,0.55), rgba(255,255,255,0.55)), linear-gradient(rgba(255,255,255,0.55), rgba(255,255,255,0.55)), linear-gradient(rgba(255,255,255,0.55), rgba(255,255,255,0.55)), linear-gradient(rgba(255,255,255,0.55), rgba(255,255,255,0.55)); background-repeat: no-repeat; background-size: 1px 100%, 1px 100%, 100% 1px, 100% 1px; background-position: 33.333% 0, 66.666% 0, 0 33.333%, 0 66.666%; }",
    ".rc-control { display: flex; align-items: center; gap: 12px; padding: 12px 18px max(14px, env(safe-area-inset-bottom)); border-top: 1px solid var(--borde-suave); font-size: 0.9rem; color: var(--texto-suave); }",
    ".rc-control input { flex: 1; accent-color: var(--violeta); }"
  ].join("\n");
  document.head.appendChild(estilo);
}

/* Abre el editor de recorte. Devuelve una promesa con el Blob recortado,
   o null si la persona cancela. */
function abrirRecortador(archivo, opciones) {
  peInyectarEstilos();

  return new Promise(function (resolver, rechazar) {
    const direccion = URL.createObjectURL(archivo);
    const imagen = new Image();

    imagen.onerror = function () {
      URL.revokeObjectURL(direccion);
      rechazar(new Error("No se pudo leer la imagen."));
    };

    imagen.onload = function () {
      const iw = imagen.naturalWidth;
      const ih = imagen.naturalHeight;
      if (!iw || !ih) {
        URL.revokeObjectURL(direccion);
        rechazar(new Error("No se pudo leer la imagen."));
        return;
      }

      const bodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      const pantalla = document.createElement("div");
      pantalla.className = "rc-pantalla";
      pantalla.setAttribute("role", "dialog");
      pantalla.setAttribute("aria-modal", "true");

      const barra = document.createElement("div");
      barra.className = "rc-barra";
      const botonVolver = document.createElement("button");
      botonVolver.type = "button";
      botonVolver.className = "pe-volver";
      botonVolver.setAttribute("aria-label", "Cancelar");
      botonVolver.innerHTML = PE_ICONOS.volver;
      const titulo = document.createElement("h2");
      titulo.textContent = opciones.titulo || "Recortar";
      const botonAplicar = document.createElement("button");
      botonAplicar.type = "button";
      botonAplicar.className = "rc-aplicar";
      botonAplicar.textContent = "Aplicar";
      barra.appendChild(botonVolver);
      barra.appendChild(titulo);
      barra.appendChild(botonAplicar);

      const escenario = document.createElement("div");
      escenario.className = "rc-escenario";
      const img = document.createElement("img");
      img.className = "rc-img";
      img.alt = "";
      img.draggable = false;
      img.src = direccion;
      img.style.width = iw + "px";
      img.style.height = ih + "px";
      const marco = document.createElement("div");
      marco.className = "rc-marco";
      escenario.appendChild(img);
      escenario.appendChild(marco);

      const control = document.createElement("div");
      control.className = "rc-control";
      const textoZoom = document.createElement("span");
      textoZoom.textContent = "Zoom";
      const rango = document.createElement("input");
      rango.type = "range";
      rango.min = "1";
      rango.max = "4";
      rango.step = "0.01";
      rango.value = "1";
      rango.setAttribute("aria-label", "Zoom");
      control.appendChild(textoZoom);
      control.appendChild(rango);

      pantalla.appendChild(barra);
      pantalla.appendChild(escenario);
      pantalla.appendChild(control);
      document.body.appendChild(pantalla);

      const area = escenario.getBoundingClientRect();
      const W = area.width;
      const H = area.height;

      // marco de recorte
      const relacion = opciones.relacion || 1;
      let fw;
      let fh;
      if (relacion >= 2) {
        fw = W;
        fh = fw / relacion;
        if (fh > H * 0.8) {
          fh = H * 0.8;
          fw = fh * relacion;
        }
      } else {
        fw = Math.min(W * 0.92, H * 0.72);
        fh = fw / relacion;
      }
      const fx = (W - fw) / 2;
      const fy = (H - fh) / 2;
      marco.style.left = fx + "px";
      marco.style.top = fy + "px";
      marco.style.width = fw + "px";
      marco.style.height = fh + "px";

      // posición y zoom
      const escMin = Math.max(fw / iw, fh / ih);
      let s = escMin;
      let tx = fx + (fw - iw * s) / 2;
      let ty = fy + (fh - ih * s) / 2;

      function limitar() {
        tx = Math.min(fx, Math.max(fx + fw - iw * s, tx));
        ty = Math.min(fy, Math.max(fy + fh - ih * s, ty));
      }

      function pintar() {
        img.style.transform = "translate(" + tx + "px," + ty + "px) scale(" + s + ")";
      }

      function zoomA(nuevaEscala, cx, cy) {
        nuevaEscala = Math.min(escMin * 4, Math.max(escMin, nuevaEscala));
        const k = nuevaEscala / s;
        tx = cx - (cx - tx) * k;
        ty = cy - (cy - ty) * k;
        s = nuevaEscala;
        limitar();
        pintar();
        rango.value = String(s / escMin);
      }

      limitar();
      pintar();

      // gestos: arrastrar con un dedo, pellizcar con dos
      const punteros = new Map();
      let distanciaInicial = 0;
      let escalaInicial = s;

      escenario.addEventListener("pointerdown", function (evento) {
        try { escenario.setPointerCapture(evento.pointerId); } catch (error) {}
        punteros.set(evento.pointerId, { x: evento.clientX, y: evento.clientY });
        if (punteros.size === 2) {
          const puntos = Array.from(punteros.values());
          distanciaInicial = Math.hypot(puntos[0].x - puntos[1].x, puntos[0].y - puntos[1].y) || 1;
          escalaInicial = s;
        }
      });

      escenario.addEventListener("pointermove", function (evento) {
        if (!punteros.has(evento.pointerId)) return;
        const previo = punteros.get(evento.pointerId);

        if (punteros.size === 1) {
          tx += evento.clientX - previo.x;
          ty += evento.clientY - previo.y;
          limitar();
          pintar();
          punteros.set(evento.pointerId, { x: evento.clientX, y: evento.clientY });
        } else if (punteros.size === 2) {
          punteros.set(evento.pointerId, { x: evento.clientX, y: evento.clientY });
          const puntos = Array.from(punteros.values());
          const distancia = Math.hypot(puntos[0].x - puntos[1].x, puntos[0].y - puntos[1].y);
          const rect = escenario.getBoundingClientRect();
          const cx = (puntos[0].x + puntos[1].x) / 2 - rect.left;
          const cy = (puntos[0].y + puntos[1].y) / 2 - rect.top;
          zoomA(escalaInicial * (distancia / distanciaInicial), cx, cy);
        }
      });

      function soltar(evento) {
        punteros.delete(evento.pointerId);
      }
      escenario.addEventListener("pointerup", soltar);
      escenario.addEventListener("pointercancel", soltar);

      escenario.addEventListener(
        "wheel",
        function (evento) {
          evento.preventDefault();
          const factor = evento.deltaY < 0 ? 1.08 : 1 / 1.08;
          const rect = escenario.getBoundingClientRect();
          zoomA(s * factor, evento.clientX - rect.left, evento.clientY - rect.top);
        },
        { passive: false }
      );

      rango.addEventListener("input", function () {
        zoomA(escMin * Number(rango.value), fx + fw / 2, fy + fh / 2);
      });

      function cerrar() {
        document.removeEventListener("keydown", alTeclear);
        pantalla.remove();
        document.body.style.overflow = bodyOverflow;
        URL.revokeObjectURL(direccion);
      }

      function alTeclear(evento) {
        if (evento.key === "Escape") {
          cerrar();
          resolver(null);
        }
      }
      document.addEventListener("keydown", alTeclear);

      botonVolver.addEventListener("click", function () {
        cerrar();
        resolver(null);
      });

      botonAplicar.addEventListener("click", function () {
        const anchoSalida = opciones.ancho;
        const altoSalida = opciones.alto;
        const sw = fw / s;
        const sh = fh / s;
        const sx = Math.max(0, Math.min(iw - sw, (fx - tx) / s));
        const sy = Math.max(0, Math.min(ih - sh, (fy - ty) / s));

        const lienzo = document.createElement("canvas");
        lienzo.width = anchoSalida;
        lienzo.height = altoSalida;
        const contexto = lienzo.getContext("2d");
        contexto.fillStyle = "#ffffff";
        contexto.fillRect(0, 0, anchoSalida, altoSalida);
        contexto.imageSmoothingQuality = "high";
        contexto.drawImage(img, sx, sy, sw, sh, 0, 0, anchoSalida, altoSalida);

        lienzo.toBlob(
          function (blob) {
            cerrar();
            if (blob) resolver(blob);
            else rechazar(new Error("No se pudo procesar la imagen."));
          },
          "image/jpeg",
          opciones.calidad || 0.9
        );
      });
    };

    imagen.src = direccion;
  });
}

(async function () {
  const botonEditar = document.getElementById("boton-editar-perfil");
  const formularioViejo = document.getElementById("form-editar-perfil");
  const descripcion = document.getElementById("perfil-descripcion");
  const desde = document.getElementById("perfil-desde");

  if (!botonEditar) return;

  const parametros = new URLSearchParams(window.location.search);
  const { data: datosSesion } = await supabaseClient.auth.getSession();
  const sesion = datosSesion.session;
  const perfilId = parametros.get("id") || (sesion ? sesion.user.id : null);
  if (!perfilId) return;

  // ---------- datos del perfil (con respaldo si faltan columnas nuevas) ----------
  const intentos = [
    "id, username, avatar_url, banner_url, descripcion, nombre_visible, ubicacion, sitio_web, cumple_publico",
    "id, username, avatar_url, banner_url, descripcion, nombre_visible",
    "id, username, avatar_url, descripcion"
  ];
  let perfil = null;
  for (let i = 0; i < intentos.length; i++) {
    const respuesta = await supabaseClient
      .from("profiles")
      .select(intentos[i])
      .eq("id", perfilId)
      .maybeSingle();
    if (!respuesta.error) {
      perfil = respuesta.data;
      break;
    }
  }
  if (!perfil) return;

  // ---------- lo que ven todas las personas ----------
  if (perfil.descripcion && descripcion) {
    descripcion.textContent = perfil.descripcion;
    descripcion.hidden = false;
  }

  function dominioDe(direccion) {
    try {
      return new URL(direccion).hostname.replace(/^www\./, "");
    } catch (error) {
      return direccion;
    }
  }

  function mostrarInfoPublica() {
    peInyectarEstilos();
    const anterior = document.querySelector(".perfil-info");
    if (anterior) anterior.remove();

    const piezas = [];

    if (perfil.ubicacion) {
      const lugar = document.createElement("span");
      lugar.innerHTML = PE_ICONOS.ubicacion;
      lugar.appendChild(document.createTextNode(perfil.ubicacion));
      piezas.push(lugar);
    }

    if (perfil.sitio_web) {
      const enlace = document.createElement("a");
      enlace.href = perfil.sitio_web;
      enlace.target = "_blank";
      enlace.rel = "noopener noreferrer nofollow ugc";
      enlace.innerHTML = PE_ICONOS.enlace;
      enlace.appendChild(document.createTextNode(dominioDe(perfil.sitio_web)));
      piezas.push(enlace);
    }

    if (perfil.cumple_publico) {
      const cumple = document.createElement("span");
      cumple.innerHTML = PE_ICONOS.regalo;
      const texto = /^\d{4}$/.test(perfil.cumple_publico)
        ? "Nació en " + perfil.cumple_publico
        : "Nació el " + perfil.cumple_publico;
      cumple.appendChild(document.createTextNode(texto));
      piezas.push(cumple);
    }

    if (piezas.length === 0 || !desde) return;

    const caja = document.createElement("div");
    caja.className = "perfil-info";
    piezas.forEach(function (pieza) {
      caja.appendChild(pieza);
    });
    desde.insertAdjacentElement("beforebegin", caja);
  }

  mostrarInfoPublica();

  // ---------- a partir de acá, solo la dueña del perfil ----------
  if (!sesion || sesion.user.id !== perfil.id) return;

  if (formularioViejo) formularioViejo.remove();
  botonEditar.hidden = false;

  const WORKER_SUBIDA = "https://subir-img.yuriworld-avisos.workers.dev";
  const R2_PUBLICO = "https://pub-c643606c6a4545f18f9677fe2dca68ee.r2.dev/";

  async function subirSupabase(bucket, blob, rutas) {
    const ruta = sesion.user.id + "/" + Date.now() + "-" + Math.random().toString(36).slice(2, 7) + ".jpg";
    const { error } = await supabaseClient.storage
      .from(bucket)
      .upload(ruta, blob, { contentType: "image/jpeg", cacheControl: "31536000" });
    if (error) throw error;
rutas.push({ bucket: bucket, ruta: ruta });
    return supabaseClient.storage.from(bucket).getPublicUrl(ruta).data.publicUrl;
  }

  async function subir(bucket, blob, rutas) {
    const ruta = sesion.user.id + "/" + Date.now() + "-" + Math.random().toString(36).slice(2, 7) + ".jpg";
    try {
      const { data: datosActuales } = await supabaseClient.auth.getSession();
      const token = datosActuales.session ? datosActuales.session.access_token : sesion.access_token;
      const respuesta = await fetch(WORKER_SUBIDA + "/" + bucket + "/" + ruta, {
        method: "PUT",
        headers: { Authorization: "Bearer " + token, "Content-Type": "image/jpeg" },
        body: blob
      });
      if (!respuesta.ok) throw new Error("Worker " + respuesta.status);
      return R2_PUBLICO + bucket + "/" + ruta;
    } catch (error) {
      console.warn("Subida a R2 falló, uso Supabase:", error);
      return subirSupabase(bucket, blob, rutas);
    }
  }

  async function borrarAnterior(bucket, direccion) {
    if (!direccion) return;
    const partes = direccion.split("/" + bucket + "/");
    if (partes.length !== 2) return;
    await supabaseClient.storage.from(bucket).remove([decodeURIComponent(partes[1])]);
  }

  function colorDe(texto) {
    let valor = 0;
    for (let i = 0; i < texto.length; i++) {
      valor = (valor * 31 + texto.charCodeAt(i)) >>> 0;
    }
    return PE_COLORES[valor % PE_COLORES.length];
  }

  // ---------- validaciones ----------
  function normalizarSitio(texto) {
    let direccion = String(texto || "").trim();
    if (!direccion) return null;
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(direccion)) direccion = "https://" + direccion;
    let url;
    try {
      url = new URL(direccion);
    } catch (error) {
      return undefined;
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    if (!url.hostname || url.hostname.indexOf(".") === -1) return undefined;
    if (url.href.length > 100) return undefined;
    return url.href;
  }

  function edadDe(anio, mes, dia) {
    const hoy = new Date();
    let edad = hoy.getFullYear() - anio;
    const mesHoy = hoy.getMonth() + 1;
    if (mesHoy < mes || (mesHoy === mes && hoy.getDate() < dia)) edad -= 1;
    return edad;
  }

  function textoCumple(fecha, verDiaMes, verAnio) {
    if (!fecha) return null;
    const partes = fecha.split("-").map(Number);
    const fechaUtc = new Date(Date.UTC(partes[0], partes[1] - 1, partes[2]));
    if (verDiaMes === "todos" && verAnio === "todos") {
      return new Intl.DateTimeFormat("es", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(fechaUtc);
    }
    if (verDiaMes === "todos") {
      return new Intl.DateTimeFormat("es", { day: "numeric", month: "long", timeZone: "UTC" }).format(fechaUtc);
    }
    if (verAnio === "todos") return String(partes[0]);
    return null;
  }

  // ---------- datos privados (fecha de nacimiento) ----------
  let privado = { fecha_nacimiento: null, ver_dia_mes: "solo_yo", ver_anio: "solo_yo" };
  try {
    const { data: filaPrivada } = await supabaseClient
      .from("perfiles_privados")
      .select("fecha_nacimiento, ver_dia_mes, ver_anio")
      .eq("user_id", sesion.user.id)
      .maybeSingle();
    if (filaPrivada) privado = filaPrivada;
  } catch (error) {
    console.warn("No se pudieron leer los datos privados:", error);
  }

  // ---------- pantalla de edición ----------
  let pantalla = null;
  let avatarNuevo = null;
  let bannerNuevo = null;
  let urlVistaAvatar = null;
  let urlVistaBanner = null;

  function crear(etiqueta, clase, texto) {
    const elemento = document.createElement(etiqueta);
    if (clase) elemento.className = clase;
    if (texto) elemento.textContent = texto;
    return elemento;
  }

  function crearCampo(titulo, control, maximo) {
    const caja = crear("label", "pe-campo");
    const rotulo = crear("span");
    rotulo.appendChild(crear("span", "", titulo));
    let contador = null;
    if (maximo) {
      contador = crear("span", "", "0/" + maximo);
      rotulo.appendChild(contador);
    }
    caja.appendChild(rotulo);
    caja.appendChild(control);
    if (contador) {
      const actualizar = function () {
        contador.textContent = control.value.length + "/" + maximo;
      };
      control.addEventListener("input", actualizar);
      actualizar();
    }
    return caja;
  }

  function abrirEdicion() {
    peInyectarEstilos();

    const nombreMostrado = perfil.nombre_visible || perfil.username || "?";
    const bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    pantalla = crear("div", "pe-pantalla");
    pantalla.setAttribute("role", "dialog");
    pantalla.setAttribute("aria-modal", "true");

    // barra superior
    const barra = crear("div", "pe-barra");
    const botonVolver = crear("button", "pe-volver");
    botonVolver.type = "button";
    botonVolver.setAttribute("aria-label", "Volver");
    botonVolver.innerHTML = PE_ICONOS.volver;
    const titulo = crear("h2", "", "Editar perfil");
    const botonGuardar = crear("button", "pe-guardar", "Guardar");
    botonGuardar.type = "button";
    botonGuardar.disabled = true;
    barra.appendChild(botonVolver);
    barra.appendChild(titulo);
    barra.appendChild(botonGuardar);

    const cuerpo = crear("div", "pe-cuerpo");

    // banner
    const banner = crear("div", "pe-banner");
    if (perfil.banner_url) banner.style.backgroundImage = 'url("' + perfil.banner_url + '")';
    const camaraBanner = crear("button", "pe-camara pe-camara-banner");
    camaraBanner.type = "button";
    camaraBanner.setAttribute("aria-label", "Cambiar el banner");
    camaraBanner.innerHTML = PE_ICONOS.camara;
    banner.appendChild(camaraBanner);

    // foto de perfil
    const filaAvatar = crear("div", "pe-avatar-fila");
    const avatar = crear("div", "pe-avatar");
    avatar.style.background = colorDe(nombreMostrado);
    avatar.textContent = nombreMostrado.charAt(0).toUpperCase();
    if (perfil.avatar_url) {
      avatar.textContent = "";
      avatar.style.backgroundImage = 'url("' + perfil.avatar_url + '")';
      avatar.style.backgroundSize = "cover";
      avatar.style.backgroundPosition = "center";
    }
    const camaraAvatar = crear("button", "pe-camara pe-camara-avatar");
    camaraAvatar.type = "button";
    camaraAvatar.setAttribute("aria-label", "Cambiar la foto de perfil");
    camaraAvatar.innerHTML = PE_ICONOS.camara;
    avatar.appendChild(camaraAvatar);
    filaAvatar.appendChild(avatar);

    // archivos ocultos
    const archivoAvatar = document.createElement("input");
    archivoAvatar.type = "file";
    archivoAvatar.accept = "image/*";
    archivoAvatar.hidden = true;
    const archivoBanner = document.createElement("input");
    archivoBanner.type = "file";
    archivoBanner.accept = "image/*";
    archivoBanner.hidden = true;

    // campos
    const campos = crear("div", "pe-campos");

    const campoNombre = document.createElement("input");
    campoNombre.type = "text";
    campoNombre.maxLength = 30;
    campoNombre.value = perfil.nombre_visible || "";
    campoNombre.placeholder = perfil.username || "";
    campoNombre.autocomplete = "off";

    const campoBio = document.createElement("textarea");
    campoBio.maxLength = 160;
    campoBio.rows = 3;
    campoBio.value = perfil.descripcion || "";

    const campoUbicacion = document.createElement("input");
    campoUbicacion.type = "text";
    campoUbicacion.maxLength = 30;
    campoUbicacion.value = perfil.ubicacion || "";
    campoUbicacion.autocomplete = "off";

    const campoSitio = document.createElement("input");
    campoSitio.type = "text";
    campoSitio.inputMode = "url";
    campoSitio.maxLength = 100;
    campoSitio.value = perfil.sitio_web || "";
    campoSitio.placeholder = "https://";
    campoSitio.autocomplete = "off";

    const campoFecha = document.createElement("input");
    campoFecha.type = "date";
    campoFecha.min = "1900-01-01";
    campoFecha.max = new Date().toISOString().slice(0, 10);
    campoFecha.value = privado.fecha_nacimiento || "";

    campos.appendChild(crearCampo("Nombre", campoNombre, 30));
    campos.appendChild(crearCampo("Biografía", campoBio, 160));
    campos.appendChild(crearCampo("Ubicación", campoUbicacion, 30));
    campos.appendChild(crearCampo("Sitio web", campoSitio, 0));
    campos.appendChild(crearCampo("Fecha de nacimiento", campoFecha, 0));

    // visibilidad de la fecha
    function crearSelectorVisibilidad(valor) {
      const selector = document.createElement("select");
      [["solo_yo", "Solo tú"], ["todos", "Todos"]].forEach(function (par) {
        const opcion = document.createElement("option");
        opcion.value = par[0];
        opcion.textContent = par[1];
        selector.appendChild(opcion);
      });
      selector.value = valor === "todos" ? "todos" : "solo_yo";
      return selector;
    }

    const visibilidad = crear("div", "pe-visibilidad");
    const lineaDiaMes = crear("label", "", "Mes y día: ");
    const selectorDiaMes = crearSelectorVisibilidad(privado.ver_dia_mes);
    lineaDiaMes.appendChild(selectorDiaMes);
    const lineaAnio = crear("label", "", "Año: ");
    const selectorAnio = crearSelectorVisibilidad(privado.ver_anio);
    lineaAnio.appendChild(selectorAnio);
    visibilidad.appendChild(lineaDiaMes);
    visibilidad.appendChild(lineaAnio);
    campos.appendChild(visibilidad);
    campos.appendChild(
      crear("p", "pe-nota", "Tu fecha de nacimiento es privada. Solo se muestra a las demás personas lo que elijas acá. Hay que tener 13 años o más.")
    );

    const mensaje = crear("p", "pe-mensaje");
    campos.appendChild(mensaje);

    cuerpo.appendChild(banner);
    cuerpo.appendChild(filaAvatar);
    cuerpo.appendChild(campos);

    pantalla.appendChild(barra);
    pantalla.appendChild(cuerpo);
    pantalla.appendChild(archivoAvatar);
    pantalla.appendChild(archivoBanner);
    document.body.appendChild(pantalla);

    function mostrarMensaje(texto, tipo) {
      mensaje.textContent = texto;
      mensaje.className = "pe-mensaje" + (tipo ? " " + tipo : "");
    }

    // ----- cambios pendientes -----
    const inicial = {
      nombre: campoNombre.value,
      bio: campoBio.value,
      ubicacion: campoUbicacion.value,
      sitio: campoSitio.value,
      fecha: campoFecha.value,
      diaMes: selectorDiaMes.value,
      anio: selectorAnio.value
    };

    function cambioCumple() {
      return (
        campoFecha.value !== inicial.fecha ||
        selectorDiaMes.value !== inicial.diaMes ||
        selectorAnio.value !== inicial.anio
      );
    }

    function hayCambios() {
      return (
        !!avatarNuevo ||
        !!bannerNuevo ||
        campoNombre.value !== inicial.nombre ||
        campoBio.value !== inicial.bio ||
        campoUbicacion.value !== inicial.ubicacion ||
        campoSitio.value !== inicial.sitio ||
        cambioCumple()
      );
    }

    function actualizarGuardar() {
      botonGuardar.disabled = !hayCambios();
    }

    [campoNombre, campoBio, campoUbicacion, campoSitio, campoFecha, selectorDiaMes, selectorAnio].forEach(function (control) {
      control.addEventListener("input", actualizarGuardar);
      control.addEventListener("change", actualizarGuardar);
    });

    function cerrar() {
      if (urlVistaAvatar) URL.revokeObjectURL(urlVistaAvatar);
      if (urlVistaBanner) URL.revokeObjectURL(urlVistaBanner);
      urlVistaAvatar = null;
      urlVistaBanner = null;
      avatarNuevo = null;
      bannerNuevo = null;
      pantalla.remove();
      pantalla = null;
      document.body.style.overflow = bodyOverflow;
    }

    botonVolver.addEventListener("click", function () {
      if (hayCambios() && !confirm("¿Descartar los cambios?")) return;
      cerrar();
    });

    // ----- fotos con recorte -----
    async function elegirImagen(entrada, opciones, alListo) {
      const archivo = entrada.files[0];
      entrada.value = "";
      if (!archivo) return;
      if (!archivo.type.startsWith("image/")) {
        mostrarMensaje("El archivo tiene que ser una imagen.", "error");
        return;
      }
      try {
        const blob = await abrirRecortador(archivo, opciones);
        if (!blob) return;
        alListo(blob);
        mostrarMensaje("", "");
        actualizarGuardar();
      } catch (error) {
        mostrarMensaje(error.message || "No se pudo procesar la imagen.", "error");
      }
    }

    camaraAvatar.addEventListener("click", function () {
      archivoAvatar.click();
    });
    camaraBanner.addEventListener("click", function () {
      archivoBanner.click();
    });

    archivoAvatar.addEventListener("change", function () {
      elegirImagen(
        archivoAvatar,
        { relacion: 1, ancho: 400, alto: 400, calidad: 0.9, titulo: "Foto de perfil" },
        function (blob) {
          avatarNuevo = blob;
          if (urlVistaAvatar) URL.revokeObjectURL(urlVistaAvatar);
          urlVistaAvatar = URL.createObjectURL(blob);
          avatar.style.backgroundImage = 'url("' + urlVistaAvatar + '")';
          avatar.style.backgroundSize = "cover";
          avatar.style.backgroundPosition = "center";
          Array.from(avatar.childNodes).forEach(function (nodo) {
            if (nodo.nodeType === 3) avatar.removeChild(nodo);
          });
        }
      );
    });

    archivoBanner.addEventListener("change", function () {
      elegirImagen(
        archivoBanner,
        { relacion: 3, ancho: 1500, alto: 500, calidad: 0.85, titulo: "Banner" },
        function (blob) {
          if (blob.size > 2 * 1024 * 1024) {
            mostrarMensaje("El banner pesa más de 2 MB. Elegí otra imagen o acercala un poco.", "error");
            return;
          }
          bannerNuevo = blob;
          if (urlVistaBanner) URL.revokeObjectURL(urlVistaBanner);
          urlVistaBanner = URL.createObjectURL(blob);
          banner.style.backgroundImage = 'url("' + urlVistaBanner + '")';
        }
      );
    });

    // ----- guardar -----
    botonGuardar.addEventListener("click", async function () {
      const nombre = campoNombre.value.trim();
      const biografia = campoBio.value.trim();
      const ubicacion = campoUbicacion.value.trim();
      const sitio = normalizarSitio(campoSitio.value);
      const fecha = campoFecha.value;

      if (sitio === undefined) {
        mostrarMensaje("El sitio web no es válido. Tiene que ser una dirección como https://sitio.com", "error");
        return;
      }

      if (fecha) {
        const partes = fecha.split("-").map(Number);
        const fechaUtc = new Date(Date.UTC(partes[0], partes[1] - 1, partes[2]));
        const valida =
          partes.length === 3 &&
          fechaUtc.getUTCFullYear() === partes[0] &&
          fechaUtc.getUTCMonth() === partes[1] - 1 &&
          fechaUtc.getUTCDate() === partes[2] &&
          partes[0] >= 1900 &&
          fechaUtc.getTime() <= Date.now();
        if (!valida) {
          mostrarMensaje("La fecha de nacimiento no es válida.", "error");
          return;
        }
        if (edadDe(partes[0], partes[1], partes[2]) < 13) {
          mostrarMensaje("YuriWorld es para personas de 13 años o más.", "error");
          return;
        }
      }

      botonGuardar.disabled = true;
      mostrarMensaje("Guardando...", "");

      let urlAvatar = perfil.avatar_url;
      let urlBanner = perfil.banner_url || null;
      const subidos = [];

      try {
        if (avatarNuevo) urlAvatar = await subir("avatares", avatarNuevo, subidos);
        if (bannerNuevo) urlBanner = await subir("banners", bannerNuevo, subidos);

        const cumplePublico = textoCumple(fecha, selectorDiaMes.value, selectorAnio.value);

        if (cambioCumple()) {
          if (!fecha) {
            const { error: errorBorrar } = await supabaseClient
              .from("perfiles_privados")
              .delete()
              .eq("user_id", sesion.user.id);
            if (errorBorrar) throw errorBorrar;
          } else {
            const { error: errorPrivado } = await supabaseClient
              .from("perfiles_privados")
              .upsert(
                {
                  user_id: sesion.user.id,
                  fecha_nacimiento: fecha,
                  ver_dia_mes: selectorDiaMes.value,
                  ver_anio: selectorAnio.value,
                  actualizado: new Date().toISOString()
                },
                { onConflict: "user_id" }
              );
            if (errorPrivado) throw errorPrivado;
          }
        }

        const cambios = {
          avatar_url: urlAvatar,
          descripcion: biografia || null,
          nombre_visible: nombre || null,
          ubicacion: ubicacion || null,
          sitio_web: sitio,
          cumple_publico: cumplePublico
        };
        if (bannerNuevo) cambios.banner_url = urlBanner;

        const { error: errorPerfil } = await supabaseClient
          .from("profiles")
          .update(cambios)
          .eq("id", sesion.user.id);
        if (errorPerfil) throw errorPerfil;
      } catch (error) {
        for (const subido of subidos) {
          await supabaseClient.storage.from(subido.bucket).remove([subido.ruta]);
        }
        mostrarMensaje("No se pudo guardar: " + (error.message || "error desconocido"), "error");
        actualizarGuardar();
        return;
      }

      if (avatarNuevo) await borrarAnterior("avatares", perfil.avatar_url);
      if (bannerNuevo) await borrarAnterior("banners", perfil.banner_url);

      window.location.reload();
    });
  }

  botonEditar.addEventListener("click", abrirEdicion);
})();
                              
