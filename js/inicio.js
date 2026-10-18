async function mostrarEstadoSesion() {
  const zona = document.getElementById("zona-usuario");
  const { data } = await supabaseClient.auth.getSession();
  const sesion = data.session;

  if (!sesion) {
    zona.innerHTML =
      '<a href="iniciar-sesion.html" class="enlace-nav">Entrar</a>' +
      '<a href="registro.html" class="boton-nav">Registrarme</a>';
    return;
  }

  const { data: perfil } = await supabaseClient
    .from("profiles")
    .select("username")
    .eq("id", sesion.user.id)
    .maybeSingle();

  const nombre = perfil ? perfil.username : "usuario";

  const saludo = document.createElement("span");
  saludo.className = "saludo";
  saludo.textContent = "Hola, " + nombre;

  const botonSalir = document.createElement("button");
  botonSalir.className = "boton-nav";
  botonSalir.textContent = "Salir";
  botonSalir.addEventListener("click", async function () {
    await supabaseClient.auth.signOut();
    window.location.reload();
  });

  zona.appendChild(saludo);
  zona.appendChild(botonSalir);
}

mostrarEstadoSesion();
