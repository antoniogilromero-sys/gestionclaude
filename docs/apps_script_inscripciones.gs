// Google Apps Script — envía cada respuesta nueva del Forms de
// inscripción a la app del club, y de paso manda un correo de
// bienvenida automático a quien se acaba de apuntar (desde tu propia
// cuenta de Gmail, sin que tengas que hacer nada).
//
// CÓMO INSTALARLO (una sola vez):
// 1. Abre la hoja de cálculo "Form_Responses" (donde caen las respuestas).
// 2. Menú Extensiones > Apps Script.
// 3. Borra lo que haya en el editor y pega este archivo entero.
// 4. Sustituye WEBHOOK_URL y WEBHOOK_SECRET por los valores reales (te
//    los doy yo cuando despliegue la parte de la app).
// 5. Arriba a la izquierda, en el desplegable de funciones, elige
//    `instalarDisparador` y pulsa "Ejecutar" UNA VEZ — te pedirá
//    autorización, acéptala. Esto deja el envío automático funcionando
//    para todas las respuestas nuevas a partir de ahora (las que ya
//    estaban antes de instalar esto no se reenvían solas).

var WEBHOOK_URL = "https://gestionclaude.vercel.app/api/inscripciones/webhook";
var WEBHOOK_SECRET = "PON_AQUI_EL_SECRETO";

function instalarDisparador() {
  var hoja = SpreadsheetApp.getActiveSpreadsheet();
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "alRecibirRespuesta") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("alRecibirRespuesta").forSpreadsheet(hoja).onFormSubmit().create();
}

// Busca la primera pregunta del formulario cuyo título empiece por el
// texto dado (sin distinguir mayúsculas). Los títulos completos de tus
// preguntas pueden ser más largos de lo que cabe en la columna de la
// hoja, así que se busca por el principio, no por el texto exacto.
function buscar(namedValues, empiezaPor) {
  var claves = Object.keys(namedValues);
  for (var i = 0; i < claves.length; i++) {
    if (claves[i].toUpperCase().indexOf(empiezaPor.toUpperCase()) === 0) {
      return (namedValues[claves[i]] || [])[0] || "";
    }
  }
  return "";
}

function alRecibirRespuesta(e) {
  var nv = e.namedValues;
  var payload = {
    email: buscar(nv, "EMAIL"),
    nombreCompleto: buscar(nv, "NOMBRE"),
    dni: buscar(nv, "DNI"),
    fechaNacimiento: buscar(nv, "FECHA DE"),
    domicilio: buscar(nv, "DOMICILIO"),
    tallaCamiseta: buscar(nv, "TALLA"),
    diasPiscina: buscar(nv, "USO DE PISCI"),
    proteccionDatos: buscar(nv, "PROTECCION"),
    derechosImagen: buscar(nv, "DERECHOS"),
    telefono: buscar(nv, "TELEFONO"),
    email2: buscar(nv, "EMAIL 2"),
    tarifa: buscar(nv, "TARIFA"),
  };

  var respuesta = UrlFetchApp.fetch(WEBHOOK_URL, {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + WEBHOOK_SECRET },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  if (respuesta.getResponseCode() !== 200) {
    // Deja constancia en los registros de ejecución (Apps Script > Ejecuciones)
    // para poder ver qué falló sin tener que adivinarlo.
    Logger.log("Fallo al enviar inscripción: " + respuesta.getContentText());
  }

  enviarBienvenida(payload.email || payload.email2, payload.nombreCompleto);
}

// Correo de bienvenida automático, mandado desde tu propia cuenta de
// Gmail (la que tenga esta hoja abierta) en el momento en que alguien
// rellena el formulario. Si no hay ningún email (pasa con muy pocos
// registros, ej. quien solo dejó teléfono), no manda nada y lo deja
// anotado en los registros de ejecución para que lo veas tú.
function enviarBienvenida(email, nombreCompleto) {
  if (!email) {
    Logger.log("Sin email, no se manda bienvenida a: " + nombreCompleto);
    return;
  }
  var nombrePila = (nombreCompleto || "").trim().split(" ")[0] || "";

  var asunto = "¡Bienvenido/a al C.D.E. Triatlón Alpedrete!";
  var cuerpo =
    "¡Hola " + nombrePila + "! 🏊‍♂️🚴‍♀️🏃‍♂️\n\n" +
    "Bienvenido/a al C.D.E. Triatlón Alpedrete. Hemos recibido tu inscripción, " +
    "¡así que ya formas parte del club!\n\n" +
    "Puedes consultar los horarios de entrenamiento (días, disciplina y hora) sin " +
    "necesidad de cuenta ni contraseña, aquí:\n" +
    "https://triatlonalpedrete.vercel.app/horario-publico\n\n" +
    "Y si quieres equipación oficial del club (camiseta, sudadera, etc.), puedes " +
    "comprarla aquí:\n" +
    "https://tienda.austral.es/alpedretetriatlon/index.php?id_category=48&controller=category\n\n" +
    "Cualquier duda sobre grupo, material que necesites o primer día de " +
    "entrenamiento, escríbeme por aquí sin problema.\n\n" +
    "¡Nos vemos pronto en la piscina/pista! 💪\n\n" +
    "Toni — Director técnico";

  try {
    MailApp.sendEmail(email, asunto, cuerpo);
  } catch (err) {
    Logger.log("Fallo al mandar bienvenida a " + email + ": " + err);
  }
}
