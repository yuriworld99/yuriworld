const ROTULOS_AUTOR = { videojuegos: "Estudio: ", novelas_visuales: "Estudio: ", anime: "Estudio: ", peliculas: "Dirección: ", fanart: "Arte de " };

function crearTarjeta(rec, resumen) {
  const tarjeta = document.createElement("a");
  tarjeta.className = "tarjeta";
  tarjeta.href = "recomendacion.html?id=" + encodeURIComponent(rec.id);
  tarjeta.style.color = "inherit";
  tarjeta.style.textDecoration = "none";

  const imagen = document.createElement("img");
  imagen.src = rec.portada_url;
  imagen.alt = "Portada de " + rec.titulo;
  imagen.loading = "lazy";

  const cuerpo = document.createElement("div");
  cuerpo.className = "tarjeta-cuerpo";

  const titulo = document.createElement("h3");
  titulo.textContent = rec.titulo;

  const autor = document.createElement("p");
  autor.className = "tarjeta-autor";
  autor.textContent = (ROTULOS_AUTOR[rec.seccion] || "de ") + rec.autor;

  const estrellas = document.createElement("p");
  estrellas.className = "tarjeta-autor";
  estrellas.style.fontWeight = "bold";
  estrellas.style.color = "var(--peligro)";
  if (resumen) {
    estrellas.textContent =
      "★ " + resumen.promedio + " · " + resumen.cantidad +
      (resumen.cantidad === 1 ? " voto" : " votos");
  } else {
    estrellas.textContent = "☆ Sin calificaciones";
  }

  const sinopsis = document.createElement("p");
  sinopsis.className = "tarjeta-sinopsis";
  sinopsis.textContent = rec.sinopsis;

  const generos = document.createElement("div");
  generos.className = "tarjeta-generos";
  rec.generos.forEach(function (genero) {
    const etiqueta = document.createElement("span");
    etiqueta.className = "etiqueta-genero";
    etiqueta.textContent = genero;
    generos.appendChild(etiqueta);
  });

  const pie = document.createElement("p");
  pie.className = "tarjeta-pie";
  const usuario = rec.profiles ? rec.profiles.username : "usuario";
  pie.textContent = "Recomendado por " + usuario;

  cuerpo.appendChild(titulo);
  cuerpo.appendChild(autor);
  cuerpo.appendChild(estrellas);
  cuerpo.appendChild(sinopsis);
  cuerpo.appendChild(generos);
  cuerpo.appendChild(pie);
  tarjeta.appendChild(imagen);
  tarjeta.appendChild(cuerpo);

  return tarjeta;
}

function crearTarjetaFanart(rec) {
  const enlace = document.createElement("a");
  enlace.className = "fanart-item";
  enlace.href = "recomendacion.html?id=" + encodeURIComponent(rec.id);

  const imagen = document.createElement("img");
  imagen.src = rec.portada_url;
  imagen.alt = rec.titulo;
  imagen.loading = "lazy";
  enlace.appendChild(imagen);

  if (rec.es_18) {
    const marca = document.createElement("span");
    marca.className = "fanart-mas18";
    marca.textContent = "+18";
    enlace.appendChild(marca);
  }

  const pie = document.createElement("div");
  pie.className = "fanart-pie";
  const titulo = document.createElement("strong");
  titulo.textContent = rec.titulo;
  const artista = document.createElement("span");
  artista.textContent = "por " + rec.autor;
  pie.appendChild(titulo);
  pie.appendChild(artista);
  enlace.appendChild(pie);

  return enlace;
}

let pedidoLista = 0;

async function cargarRecomendaciones(seccion) {
  const nombreSeccion = seccion || "lecturas";
  const miPedido = ++pedidoLista;
  const lista = document.getElementById("lista-recomendaciones");

  lista.classList.toggle("modo-fanart", nombreSeccion === "fanart");
  lista.textContent = "Cargando recomendaciones...";

  const { data, error } = await supabaseClient
    .from("recomendaciones")
    .select("id, titulo, autor, sinopsis, generos, portada_url, created_at, seccion, es_18, profiles!recomendaciones_user_id_fkey(username)")
    .eq("seccion", nombreSeccion)
    .order("created_at", { ascending: false })
    .limit(30);

  if (miPedido !== pedidoLista) return;

  if (error) {
    lista.textContent = "No se pudieron cargar las recomendaciones.";
    return;
  }

  if (data.length === 0) {
    lista.textContent =
      nombreSeccion === "lecturas"
        ? "Todavía no hay recomendaciones. ¡Publicá la primera!"
        : "Todavía no hay nada en esta sección. ¡Publicá lo primero!";
    return;
  }

  const ids = data.map(function (rec) {
    return rec.id;
  });

  const { data: resumenes } = await supabaseClient
    .from("resumen_calificaciones")
    .select("recomendacion_id, promedio, cantidad")
    .in("recomendacion_id", ids);

  if (miPedido !== pedidoLista) return;

  const porRecomendacion = {};
  (resumenes || []).forEach(function (resumen) {
    porRecomendacion[resumen.recomendacion_id] = resumen;
  });

  lista.textContent = "";
  data.forEach(function (rec) {
    lista.appendChild(
      nombreSeccion === "fanart"
        ? crearTarjetaFanart(rec)
        : crearTarjeta(rec, porRecomendacion[rec.id])
    );
  });
}


const SECCIONES_INICIO = [
  { valor: "lecturas", etiqueta: "Lecturas" },
  { valor: "videojuegos", etiqueta: "Videojuegos" },
  { valor: "novelas_visuales", etiqueta: "Novelas visuales" },
  { valor: "anime", etiqueta: "Anime y OVA" },
  { valor: "series_web", etiqueta: "Series web" },
  { valor: "peliculas", etiqueta: "Películas" },
  { valor: "doujin", etiqueta: "Doujin" },
  { valor: "fanart", etiqueta: "Fanart" }
];

/* ---------- Recordar dónde estabas al volver atrás ---------- */
const CLAVE_ESTADO_INICIO = "yw_catalogo_estado";

function leerEstadoInicio() {
  try {
    const crudo = sessionStorage.getItem(CLAVE_ESTADO_INICIO);
    if (!crudo) return null;
    const estado = JSON.parse(crudo);
    if (!estado || Date.now() - estado.t > 30 * 60 * 1000) return null;
    return estado;
  } catch (error) {
    return null;
  }
}

function guardarEstadoInicio() {
  try {
    const activa = document.querySelector(".sec-pestana.activa");
    sessionStorage.setItem(
      CLAVE_ESTADO_INICIO,
      JSON.stringify({
        seccion: activa ? activa.dataset.seccion : "lecturas",
        y: Math.round(window.scrollY),
        t: Date.now()
      })
    );
  } catch (error) {}
}

function volvioConAtras() {
  try {
    const navegacion = performance.getEntriesByType("navigation")[0];
    if (navegacion) return navegacion.type === "back_forward";
    return !!(performance.navigation && performance.navigation.type === 2);
  } catch (error) {
    return false;
  }
}

/* Vuelve a la posición guardada. Insiste unos segundos porque el contenido
   termina de acomodarse después de cargar; se detiene si la persona toca la pantalla. */
function restaurarPosicion(y) {
  const raiz = document.documentElement;
  const comportamientoOriginal = raiz.style.scrollBehavior;
  raiz.style.scrollBehavior = "auto";

  let interactuo = false;
  function parar() {
    interactuo = true;
  }
  ["touchstart", "wheel", "mousedown", "keydown"].forEach(function (nombre) {
    window.addEventListener(nombre, parar, { passive: true, once: true });
  });

  let intentos = 0;
  let estables = 0;

  const reloj = setInterval(function () {
    intentos += 1;
    if (interactuo || intentos > 30) {
      clearInterval(reloj);
      raiz.style.scrollBehavior = comportamientoOriginal;
      return;
    }

    const maximo = Math.max(0, raiz.scrollHeight - window.innerHeight);
    const objetivo = Math.min(y, maximo);
    window.scrollTo(0, objetivo);

    if (Math.abs(window.scrollY - objetivo) <= 2 && objetivo >= y - 2) {
      estables += 1;
    } else {
      estables = 0;
    }

    if (estables >= 8) {
      clearInterval(reloj);
      raiz.style.scrollBehavior = comportamientoOriginal;
    }
  }, 150);
}

function armarPestanasInicio() {
  const lista = document.getElementById("lista-recomendaciones");
  if (!lista || document.querySelector(".sec-pestanas")) return null;

  const titulo = document.getElementById("recomendaciones");
  const textoTituloInicial = titulo ? titulo.textContent : "";

  const nav = document.createElement("nav");
  nav.className = "sec-pestanas";
  nav.setAttribute("aria-label", "Secciones");

  SECCIONES_INICIO.forEach(function (seccion) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "sec-pestana" + (seccion.valor === "lecturas" ? " activa" : "");
    boton.dataset.seccion = seccion.valor;
    boton.textContent = seccion.etiqueta;
    nav.appendChild(boton);
  });

  lista.insertAdjacentElement("beforebegin", nav);
  document.body.dataset.seccion = "lecturas";

  function activar(valor) {
    const boton = nav.querySelector('.sec-pestana[data-seccion="' + valor + '"]');
    if (!boton) return Promise.resolve();

    document.body.dataset.seccion = valor;
    nav.querySelectorAll(".sec-pestana").forEach(function (otro) {
      otro.classList.toggle("activa", otro === boton);
    });

    if (titulo) {
      titulo.textContent =
        valor === "lecturas" ? textoTituloInicial : "Últimos en " + boton.textContent;
    }

    return cargarRecomendaciones(valor);
  }

  nav.addEventListener("click", function (evento) {
    const boton = evento.target.closest(".sec-pestana");
    if (!boton || boton.classList.contains("activa")) return;
    activar(boton.dataset.seccion);
  });

  return activar;
}

const activarSeccionInicio = armarPestanasInicio();

if (document.getElementById("lista-recomendaciones")) {
  const estadoGuardado = volvioConAtras() ? leerEstadoInicio() : null;

  // Yo me encargo de volver a la posición (el navegador no puede: la lista se carga después).
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  window.addEventListener("pagehide", guardarEstadoInicio);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") guardarEstadoInicio();
  });

  let carga;
  if (activarSeccionInicio && estadoGuardado && estadoGuardado.seccion !== "lecturas") {
    carga = activarSeccionInicio(estadoGuardado.seccion);
  } else {
    carga = cargarRecomendaciones("lecturas");
  }

  if (estadoGuardado && estadoGuardado.y > 0) {
    carga.then(function () {
      restaurarPosicion(estadoGuardado.y);
    });
  }
}
