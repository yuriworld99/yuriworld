const formulario = document.getElementById("form-registro");
const mensaje = document.getElementById("mensaje");
const boton = document.getElementById("boton-registro");

function mostrarMensaje(texto, tipo) {
  mensaje.textContent = texto;
  mensaje.className = "mensaje " + tipo;
}

formulario.addEventListener("submit", async function (evento) {
  evento.preventDefault();

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (username.length < 3 || username.length > 20) {
    mostrarMensaje("El nombre de usuario debe tener entre 3 y 20 caracteres.", "error");
    return;
  }
  if (!/^[A-Za-z0-9_]+$/.test(username)) {
    mostrarMensaje("El nombre de usuario solo puede tener letras, números y guion bajo (_).", "error");
    return;
  }
  if (password.length < 6) {
    mostrarMensaje("La contraseña debe tener al menos 6 caracteres.", "error");
    return;
  }

  boton.disabled = true;
  mostrarMensaje("Creando tu cuenta...", "");

  const { data: existente } = await supabaseClient
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existente) {
    mostrarMensaje("Ese nombre de usuario ya está en uso.", "error");
    boton.disabled = false;
    return;
  }

  const { error } = await supabaseClient.auth.signUp({
    email: email,
    password: password,
    options: { data: { username: username } }
  });

  if (error) {
    mostrarMensaje("No se pudo crear la cuenta: " + error.message, "error");
    boton.disabled = false;
    return;
  }

  mostrarMensaje("¡Cuenta creada! Ya sos parte de YuriWorld 💜", "ok");
  formulario.reset();
  boton.disabled = false;
});
