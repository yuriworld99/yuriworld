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
  const acepto = document.getElementById("acepto");

  if (username.length < 3 || username.length > 20) {
    mostrarMensaje("El nombre de usuario debe tener entre 3 y 20 caracteres.", "error");
    return;
  }
  if (!/^[A-Za-z0-9_]+$/.test(username)) {
    mostrarMensaje("El nombre de usuario solo puede tener letras, números y guion bajo (_).", "error");
    return;
  }
  if (password.length < 8) {
    mostrarMensaje("La contraseña debe tener al menos 8 caracteres.", "error");
    return;
  }
  if (acepto && !acepto.checked) {
    mostrarMensaje("Tenés que aceptar los términos y las reglas de la comunidad.", "error");
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

  const { data, error } = await supabaseClient.auth.signUp({
    email: email,
    password: password,
    options: {
      data: { username: username },
      emailRedirectTo: "https://yuriworld99.github.io/yuriworld/iniciar-sesion.html"
    }
  });

  if (error) {
    const texto = (error.message || "").toLowerCase();
    if (texto.includes("rate limit")) {
      mostrarMensaje("Se enviaron muchos emails. Esperá unos minutos y probá de nuevo.", "error");
    } else {
      mostrarMensaje("No se pudo crear la cuenta: " + error.message, "error");
    }
    boton.disabled = false;
    return;
  }

  if (data.user && data.user.identities && data.user.identities.length === 0) {
    mostrarMensaje(
      "Ese email ya está registrado. Probá iniciar sesión o recuperar tu contraseña.",
      "error"
    );
    boton.disabled = false;
    return;
  }

  if (data.session) {
    mostrarMensaje("¡Cuenta creada! Ya sos parte de YuriWorld 💜", "ok");
  } else {
    mostrarMensaje(
      "¡Casi listo! Te enviamos un email para confirmar tu cuenta. Revisá también la carpeta de spam.",
      "ok"
    );
  }

  formulario.reset();
  boton.disabled = false;
});
