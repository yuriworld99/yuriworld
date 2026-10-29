const formulario = document.getElementById("form-login");
const mensaje = document.getElementById("mensaje");
const boton = document.getElementById("boton-login");

function mostrarMensaje(texto, tipo) {
  mensaje.textContent = texto;
  mensaje.className = "mensaje " + tipo;
}

function quitarBotonReenviar() {
  const existente = document.getElementById("boton-reenviar");
  if (existente) existente.remove();
}

function mostrarBotonReenviar(email) {
  quitarBotonReenviar();

  const reenviar = document.createElement("button");
  reenviar.type = "button";
  reenviar.id = "boton-reenviar";
  reenviar.className = "boton";
  reenviar.style.marginTop = "10px";
  reenviar.textContent = "Reenviar email de confirmación";

  reenviar.addEventListener("click", async function () {
    reenviar.disabled = true;
    const { error } = await supabaseClient.auth.resend({
      type: "signup",
      email: email,
      options: { emailRedirectTo: "https://yuriworld99.github.io/yuriworld/iniciar-sesion.html" }
    });
    if (error) {
      mostrarMensaje("No se pudo reenviar el email. Esperá un minuto y probá de nuevo.", "error");
    } else {
      mostrarMensaje("Te enviamos el email de nuevo. Revisá también la carpeta de spam.", "ok");
    }
    reenviar.disabled = false;
  });

  mensaje.insertAdjacentElement("afterend", reenviar);
}

formulario.addEventListener("submit", async function (evento) {
  evento.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  quitarBotonReenviar();
  boton.disabled = true;
  mostrarMensaje("Entrando...", "");

  const { error } = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    const texto = (error.message || "").toLowerCase();
    if (texto.includes("email not confirmed")) {
      mostrarMensaje(
        "Todavía no confirmaste tu email. Revisá tu correo (y la carpeta de spam).",
        "error"
      );
      mostrarBotonReenviar(email);
    } else {
      mostrarMensaje("Email o contraseña incorrectos.", "error");
    }
    boton.disabled = false;
    return;
  }

  mostrarMensaje("¡Sesión iniciada! Te llevamos al inicio 💜", "ok");
  setTimeout(function () {
    window.location.href = "index.html";
  }, 1500);
});
