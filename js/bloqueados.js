(async function () {
  const estado = document.getElementById("estado-bloqueados");
  const contenido = document.getElementById("contenido-bloqueados");
  const lista = document.getElementById("lista-bloqueados");

  const { data: datosSesion } = await supabaseClient.auth.getSession();
  const sesion = datosSesion.session;

  if (!sesion) {
    estado.textContent = "Iniciá sesión para ver tus usuarios bloqueados.";
    return;
  }

  estado.hidden = true;
  contenido.hidden = false;

  async function cargar() {
    const { data: filas, error } = await supabaseClient
      .from("bloqueos")
      .select("bloqueado_id, created_at")
      .eq("bloqueador_id", sesion.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      lista.textContent = "No se pudo cargar la lista.";
      return;
    }

    if (filas.length === 0) {
      lista.textContent = "No tenés usuarios bloqueados.";
      return;
    }

    const ids = filas.map(function (fila) {
      return fila.bloqueado_id;
    });

    const { data: perfiles } = await supabaseClient
      .from("profiles")
      .select("id, username")
      .in("id", ids);

    const nombres = {};
    (perfiles || []).forEach(function (perfil) {
      nombres[perfil.id] = perfil.username;
    });

    const fragmento = document.createDocumentFragment();

    filas.forEach(function (fila) {
      const nombre = nombres[fila.bloqueado_id] || "usuario";

      const tarjeta = document.createElement("article");
      tarjeta.className = "denuncia";

      const enlace = document.createElement("a");
      enlace.href = "perfil.html?id=" + encodeURIComponent(fila.bloqueado_id);
      enlace.textContent = "@" + nombre;
      enlace.style.fontWeight = "700";

      const botones = document.createElement("div");
      botones.className = "den-botones";

      const desbloquear = document.createElement("button");
      desbloquear.type = "button";
      desbloquear.className = "den-boton principal";
      desbloquear.textContent = "Desbloquear";
      desbloquear.addEventListener("click", async function () {
        desbloquear.disabled = true;
        const { error: errorBorrar } = await supabaseClient
          .from("bloqueos")
          .delete()
          .eq("bloqueador_id", sesion.user.id)
          .eq("bloqueado_id", fila.bloqueado_id);
        if (errorBorrar) {
          desbloquear.disabled = false;
          alert("No se pudo desbloquear.");
          return;
        }
        cargar();
      });

      botones.appendChild(desbloquear);
      tarjeta.appendChild(enlace);
      tarjeta.appendChild(botones);
      fragmento.appendChild(tarjeta);
    });

    lista.replaceChildren(fragmento);
  }

  cargar();
})();
