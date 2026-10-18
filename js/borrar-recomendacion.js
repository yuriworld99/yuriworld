(async function () {
  const id = new URLSearchParams(window.location.search).get("id");
  const contenedor = document.getElementById("acciones-recomendacion");
  if (!id || !contenedor) return;

  const { data: datosSesion } = await supabaseClient.auth.getSession();
  const sesion = datosSesion.session;
  if (!sesion) return;

  const { data: rec } = await supabaseClient
    .from("recomendaciones")
    .select("id, user_id, portada_url")
    .eq("id", id)
    .maybeSingle();

  if (!rec || rec.user_id !== sesion.user.id) return;

  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "boton-borrar";
  boton.textContent = "Borrar mi recomendación";

  boton.addEventListener("click", async function () {
    if (!confirm("¿Borrar esta recomendación con sus comentarios y calificaciones?")) return;

    boton.disabled = true;

    const { error } = await supabaseClient
      .from("recomendaciones")
      .delete()
      .eq("id", rec.id);

    if (error) {
      alert("No se pudo borrar la recomendación.");
      boton.disabled = false;
      return;
    }

    const partes = rec.portada_url ? rec.portada_url.split("/portadas/") : [];
    if (partes.length === 2) {
      await supabaseClient.storage
        .from("portadas")
        .remove([decodeURIComponent(partes[1])]);
    }

    window.location.href = "index.html";
  });

  contenedor.appendChild(boton);
})();
