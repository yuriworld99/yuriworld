(function () {
  function agregarEstilos(ruta) {
    const base = ruta.split("?")[0];
    if (document.querySelector('link[href^="' + base + '"]')) return;
    const enlace = document.createElement("link");
    enlace.rel = "stylesheet";
    enlace.href = ruta;
    document.head.appendChild(enlace);
  }

    async function esAdministradora(userId) {
    const rpc = await supabaseClient.rpc("es_administrador");
    if (!rpc.error) return rpc.data === true;

    const tabla = await supabaseClient
      .from("administradores")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    return !!tabla.data;
  }

  async function mostrarSesion(zona) {
    const { data } = await supabaseClient.auth.getSession();
    const sesion = data.session;

    if (!sesion) {
      const entrar = document.createElement("a");
      entrar.href = "iniciar-sesion.html";
      entrar.className = "enlace-nav";
      entrar.textContent = "Entrar";

      const registro = document.createElement("a");
      registro.href = "registro.html";
      registro.className = "boton-nav";
      registro.textContent = "Registrarme";

      zona.appendChild(entrar);
      zona.appendChild(registro);
      return;
    }

    const { data: perfil } = await supabaseClient
      .from("profiles")
      .select("username")
      .eq("id", sesion.user.id)
      .maybeSingle();

    const saludo = document.createElement("a");
    saludo.className = "saludo";
    saludo.href = "perfil.html?mi=" + Date.now();
    saludo.style.color = "#ffffff";
    saludo.style.textDecoration = "none";
    saludo.textContent = "Hola, " + (perfil ? perfil.username : "usuario");

    const salir = document.createElement("button");
    salir.type = "button";
    salir.className = "boton-nav";
    salir.textContent = "Salir";
    salir.addEventListener("click", async function () {
      await supabaseClient.auth.signOut();
      window.location.reload();
    });

    if (await esAdministradora(sesion.user.id)) {
      const admin = document.createElement("a");
      admin.href = "admin.html";
      admin.className = "enlace-nav";
      admin.textContent = "Admin";
      zona.appendChild(admin);
    }
    zona.appendChild(saludo);
    zona.appendChild(salir);
  }

  agregarEstilos("css/cabecera.css?v=2");
  agregarEstilos("css/layout.css");

  if (!document.querySelector(".cabecera")) {
    const cabecera = document.createElement("header");
    cabecera.className = "cabecera";

    const logo = document.createElement("a");
    logo.href = "index.html";
    logo.className = "logo";
    logo.style.fontWeight = "700";
    logo.style.textDecoration = "none";
    logo.textContent = "YuriWorld";

    const menu = document.createElement("div");
    menu.className = "zona-usuario";

    const publicar = document.createElement("a");
    publicar.href = "publicar.html";
    publicar.className = "enlace-nav";
    publicar.textContent = "Publicar";

    const comunidad = document.createElement("a");
    comunidad.href = "foro.html";
    comunidad.className = "enlace-nav";
    comunidad.textContent = "Comunidad";

    const zonaUsuario = document.createElement("div");
    zonaUsuario.className = "zona-usuario";

    menu.appendChild(publicar);
    menu.appendChild(comunidad);
    menu.appendChild(zonaUsuario);
    cabecera.appendChild(logo);
    cabecera.appendChild(menu);
    document.body.prepend(cabecera);

    mostrarSesion(zonaUsuario);
  }

  if (!document.querySelector(".pie-pagina")) {
    const pie = document.createElement("footer");
    pie.className = "pie-pagina";
    pie.textContent = "YuriWorld · Hecho con 💜 para la comunidad Yuri/GL";
    document.body.appendChild(pie);
  }
})();
