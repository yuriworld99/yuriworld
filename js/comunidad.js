(async function () {
  const botonMenu = document.getElementById("boton-menu");
  const avatarMenu = document.getElementById("avatar-menu");
  const drawer = document.getElementById("drawer");
  const drawerFondo = document.getElementById("drawer-fondo");
  const drawerCuerpo = document.getElementById("drawer-cuerpo");
  const botonNuevo = document.getElementById("boton-nuevo");
  const pestanaTodo = document.getElementById("pestana-todo");
  const pestanaRecomendaciones = document.getElementById("pestana-recomendaciones");
  const navPerfil = document.getElementById("nav-perfil");
  const panelCompositor = document.getElementById("compositor");

  const ICONOS_MENU = {
    perfil: icono('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'),
    catalogo: icono('<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>'),
    recomendar: icono('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'),
    comunidad: icono('<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'),
    salir: icono('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>')
  };

  function direccionPerfil() {
    return "perfil.html?mi=" + Date.now();
  }

  function pintarAvatar(elemento, nombre, direccion) {
    elemento.dataset.foto = "1";
    elemento.style.background = colorDe(nombre);
    elemento.textContent = nombre.charAt(0).toUpperCase();
    if (direccion) {
      elemento.style.backgroundImage = 'url("' + direccion + '")';
      elemento.style.backgroundSize = "cover";
      elemento.style.backgroundPosition = "center";
      elemento.textContent = "";
    }
  }

  function abrirDrawer() {
    drawerFondo.hidden = false;
    drawer.classList.add("abierto");
    drawer.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function cerrarDrawer() {
    drawerFondo.hidden = true;
    drawer.classList.remove("abierto");
    drawer.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  function crearEnlaceDrawer(texto, direccion, iconoHtml) {
    const enlace = document.createElement("a");
    enlace.className = "drawer-enlace";
    enlace.href = direccion;
    enlace.innerHTML = iconoHtml;
    const etiqueta = document.createElement("span");
    etiqueta.textContent = texto;
    enlace.appendChild(etiqueta);
    return enlace;
  }

  function abrirCompositor() {
    document.getElementById("mensaje-compositor").textContent = "";
    panelCompositor.classList.add("abierto");
    document.body.style.overflow = "hidden";
    document.getElementById("texto-publicacion").focus();
  }

  function cerrarCompositor() {
    panelCompositor.classList.remove("abierto");
    document.body.style.overflow = "";
  }

  window.alPublicar = function () {
    cerrarCompositor();
    window.scrollTo(0, 0);
  };

  function elegirPestana(soloRecs) {
    soloRecomendaciones = soloRecs;
    pestanaTodo.classList.toggle("activa", !soloRecs);
    pestanaRecomendaciones.classList.toggle("activa", soloRecs);
    cantidadVisible = PAGINA;
    cargarMuro();
  }

  pestanaTodo.addEventListener("click", function () {
    elegirPestana(false);
  });

  pestanaRecomendaciones.addEventListener("click", function () {
    elegirPestana(true);
  });

  botonMenu.addEventListener("click", abrirDrawer);
  drawerFondo.addEventListener("click", cerrarDrawer);

  const cabeceraCompositor = document.createElement("div");
  cabeceraCompositor.className = "compositor-cabecera";

  const cerrar = document.createElement("button");
  cerrar.type = "button";
  cerrar.className = "cerrar-compositor";
  cerrar.setAttribute("aria-label", "Cerrar");
  cerrar.textContent = "✕";
  cerrar.addEventListener("click", cerrarCompositor);

  const tituloCompositor = document.createElement("span");
  tituloCompositor.className = "compositor-titulo";
  tituloCompositor.textContent = "Nueva publicación";

  const relleno = document.createElement("span");
  relleno.style.width = "40px";

  cabeceraCompositor.appendChild(cerrar);
  cabeceraCompositor.appendChild(tituloCompositor);
  cabeceraCompositor.appendChild(relleno);
  panelCompositor.insertBefore(cabeceraCompositor, panelCompositor.firstChild);

  botonNuevo.addEventListener("click", abrirCompositor);

  const { data: datosSesion } = await supabaseClient.auth.getSession();
  const miSesion = datosSesion.session;

  drawerCuerpo.replaceChildren();

  if (!miSesion) {
    avatarMenu.dataset.foto = "1";
    avatarMenu.style.background = "#b9a9d4";
    avatarMenu.textContent = "?";
    navPerfil.href = "iniciar-sesion.html";

    const titulo = document.createElement("p");
    titulo.className = "drawer-nombre";
    titulo.textContent = "YuriWorld";

    const subtitulo = document.createElement("p");
    subtitulo.className = "drawer-usuario";
    subtitulo.textContent = "Entrá para publicar y conversar.";

    const menu = document.createElement("div");
    menu.className = "drawer-menu";
    menu.appendChild(crearEnlaceDrawer("Entrar", "iniciar-sesion.html", ICONOS_MENU.perfil));
    menu.appendChild(crearEnlaceDrawer("Crear cuenta", "registro.html", ICONOS_MENU.recomendar));
    menu.appendChild(crearEnlaceDrawer("Catálogo", "index.html", ICONOS_MENU.catalogo));

    drawerCuerpo.appendChild(titulo);
    drawerCuerpo.appendChild(subtitulo);
    drawerCuerpo.appendChild(menu);
    return;
  }

  botonNuevo.hidden = false;
  navPerfil.href = direccionPerfil();

  const { data: miPerfil } = await supabaseClient
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", miSesion.user.id)
    .maybeSingle();

  const nombre = miPerfil ? miPerfil.username : "usuario";
  const foto = miPerfil ? miPerfil.avatar_url : null;

  pintarAvatar(avatarMenu, nombre, foto);

  const avatarGrande = document.createElement("div");
  avatarGrande.className = "avatar";
  pintarAvatar(avatarGrande, nombre, foto);

  const nombreMenu = document.createElement("p");
  nombreMenu.className = "drawer-nombre";
  nombreMenu.textContent = nombre;

  const usuarioMenu = document.createElement("p");
  usuarioMenu.className = "drawer-usuario";
  usuarioMenu.textContent = "@" + nombre;

  const cuentas = document.createElement("div");
  cuentas.className = "drawer-cuentas";

  const { count: totalPublicaciones } = await supabaseClient
    .from("publicaciones")
    .select("id", { count: "exact", head: true })
    .eq("user_id", miSesion.user.id)
    .is("repost_de", null);

  const { count: totalRecomendaciones } = await supabaseClient
    .from("recomendaciones")
    .select("id", { count: "exact", head: true })
    .eq("user_id", miSesion.user.id);

  const textoPublicaciones = document.createElement("span");
  textoPublicaciones.textContent = (totalPublicaciones || 0) + " publicaciones";

  const textoRecomendaciones = document.createElement("span");
  textoRecomendaciones.textContent = (totalRecomendaciones || 0) + " recomendaciones";

  cuentas.appendChild(textoPublicaciones);
  cuentas.appendChild(textoRecomendaciones);

  const menu = document.createElement("div");
  menu.className = "drawer-menu";
  menu.appendChild(crearEnlaceDrawer("Perfil", direccionPerfil(), ICONOS_MENU.perfil));
  menu.appendChild(crearEnlaceDrawer("Comunidad", "foro.html", ICONOS_MENU.comunidad));
  menu.appendChild(crearEnlaceDrawer("Catálogo", "index.html", ICONOS_MENU.catalogo));
  menu.appendChild(crearEnlaceDrawer("Recomendar una obra", "publicar.html", ICONOS_MENU.recomendar));

  const botonSalir = document.createElement("button");
  botonSalir.type = "button";
  botonSalir.className = "drawer-enlace";
  botonSalir.innerHTML = ICONOS_MENU.salir;
  const etiquetaSalir = document.createElement("span");
  etiquetaSalir.textContent = "Salir";
  botonSalir.appendChild(etiquetaSalir);
  botonSalir.addEventListener("click", async function () {
    await supabaseClient.auth.signOut();
    window.location.reload();
  });
  menu.appendChild(botonSalir);

  drawerCuerpo.appendChild(avatarGrande);
  drawerCuerpo.appendChild(nombreMenu);
  drawerCuerpo.appendChild(usuarioMenu);
  drawerCuerpo.appendChild(cuentas);
  drawerCuerpo.appendChild(menu);
})();
