(function () {
  if (!/foro\.html$/.test(window.location.pathname)) return;

  // Condición pendiente para la próxima consulta al muro (se usa una sola vez).
  let condicionPendiente = null;

  const desdeOriginal = supabaseClient.from.bind(supabaseClient);
  supabaseClient.from = function (tabla) {
    const constructor = desdeOriginal(tabla);
    if (tabla !== "muro_publicaciones") return constructor;

    const selectOriginal = constructor.select.bind(constructor);
    constructor.select = function () {
      const filtro = selectOriginal.apply(null, arguments);
      if (condicionPendiente && arguments[0] === "*") {
        const condicion = condicionPendiente;
        condicionPendiente = null;
        return filtro.or(condicion);
      }
      return filtro;
    };
    return constructor;
  };

  async function idsPermitidos() {
    const { data } = await supabaseClient.auth.getSession();
    const sesionActual = data.session;
    if (!sesionActual) return [];

    const ids = [sesionActual.user.id];
    const { data: seguidos } = await supabaseClient
      .from("seguidores")
      .select("seguido_id")
      .eq("seguidor_id", sesionActual.user.id)
      .limit(150);
    (seguidos || []).forEach(function (fila) {
      ids.push(fila.seguido_id);
    });
    return ids;
  }

  function instalar() {
    const original = cargarMuro;

    cargarMuro = async function () {
      const pestanaSiguiendo = document.getElementById("pestana-siguiendo-muro");
      const enSiguiendo = pestanaSiguiendo && pestanaSiguiendo.classList.contains("activa");

      // Solo se filtra la pestaña general: Recomendaciones y Siguiendo no cambian.
      if (soloRecomendaciones || enSiguiendo) {
        return original.apply(this, arguments);
      }

      let condicion = "repost_de.is.null";
      try {
        const ids = await idsPermitidos();
        if (ids.length > 0) condicion += ",user_id.in.(" + ids.join(",") + ")";
      } catch (error) {
        console.error(error);
        condicion = null;
      }

      condicionPendiente = condicion;
      try {
        return await original.apply(this, arguments);
      } finally {
        condicionPendiente = null;
      }
    };

    // El muro ya pudo haberse cargado sin el filtro: se vuelve a cargar una vez.
    setTimeout(function () {
      cargarMuro();
    }, 800);
  }

  let intentos = 0;
  const espera = setInterval(function () {
    intentos += 1;
    if (typeof cargarMuro === "function") {
      clearInterval(espera);
      instalar();
    } else if (intentos > 200) {
      clearInterval(espera);
    }
  }, 50);
})();
