(async function () {
  const contenedor = document.getElementById("acciones-recomendacion");
  const id = new URLSearchParams(window.location.search).get("id");
  if (!contenedor || !id) return;

  const { data: datosSesion } = await supabaseClient.auth.getSession();
  const sesion = datosSesion.session;
  if (!sesion) return;

  const { data: rec } = await supabaseClient
    .from("recomendaciones")
    .select("user_id")
    .eq("id", id)
    .maybeSingle();

  if (!rec || rec.user_id !== sesion.user.id) return;
  if (contenedor.querySelector(".yw-boton-editar")) return;

  const enlace = document.createElement("a");
  enlace.className = "yw-boton-editar";
  enlace.href = "editar-recomendacion.html?id=" + encodeURIComponent(id);
  enlace.textContent = "Editar mi recomendación";
  enlace.style.display = "inline-block";
  enlace.style.margin = "0 8px 8px 0";
  enlace.style.padding = "10px 18px";
  enlace.style.border = "2px solid #7b3fe4";
  enlace.style.borderRadius = "999px";
  enlace.style.background = "#ffffff";
  enlace.style.color = "#7b3fe4";
  enlace.style.fontWeight = "700";
  enlace.style.textDecoration = "none";

  contenedor.insertBefore(enlace, contenedor.firstChild);
})();
