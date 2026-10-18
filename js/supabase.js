const SUPABASE_URL = "https://ifgattjcckprijvpfypw.supabase.co";
const SUPABASE_KEY = "sb_publishable_JG7AQQ_tTJJ6SNKVjU50PQ_VNxlzTim";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function probarConexion() {
  const estado = document.getElementById("estado-conexion");
  try {
    const respuesta = await fetch(SUPABASE_URL + "/auth/v1/health", {
      headers: { apikey: SUPABASE_KEY }
    });
    if (!respuesta.ok) throw new Error("Sin conexión");
    estado.textContent = "Conexión con Supabase: correcta ✅";
  } catch (error) {
    estado.textContent = "No se pudo conectar con Supabase ❌";
  }
}

probarConexion();
