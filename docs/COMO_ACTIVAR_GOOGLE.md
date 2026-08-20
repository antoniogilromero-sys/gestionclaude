# Cómo activar el acceso con Google

La aplicación **ya tiene el botón "Entrar con Google"** en la pantalla de
entrada. Para que funcione hay que darle permiso a Google, y eso son tres
pasos que solo puedes hacer tú, porque son cuentas tuyas.

Calcula unos 15 minutos la primera vez. Si algo no cuadra, para y pregunta:
es preferible eso a dejarlo a medias.

---

## Antes de nada: la migración de la base de datos

Abre Supabase → **SQL Editor** → pega entero el fichero
`docs/migracion_google_login.sql` → **Run**.

Sin esto, un entrenador que entre con Google aparecería en tu lista con su
correo (`celia.lopez@gmail.com`) en vez de con su nombre, y no sabrías quién
es quién a la hora de aprobar altas.

---

## Paso 1 · Crear las credenciales en Google

1. Entra en [console.cloud.google.com](https://console.cloud.google.com) con
   tu cuenta de Google.
2. Arriba a la izquierda, donde pone el nombre del proyecto, pulsa y luego
   **"Proyecto nuevo"**. Llámalo `Triatlon Alpedrete` y créalo.
3. Con ese proyecto seleccionado, busca en el buscador de arriba
   **"Pantalla de consentimiento de OAuth"** y entra.
   - Tipo de usuario: **Externo**.
   - Nombre de la aplicación: `C.D.E. Triatlón Alpedrete`.
   - Correo de asistencia y de contacto: el tuyo.
   - Guarda y continúa hasta el final (los apartados de "Permisos" y
     "Usuarios de prueba" los puedes dejar como están).
4. Ahora busca **"Credenciales"** en el mismo buscador.
   - **Crear credenciales** → **ID de cliente de OAuth**.
   - Tipo de aplicación: **Aplicación web**.
   - Nombre: `App del club`.
   - En **URI de redirección autorizados**, pulsa "Añadir URI" y pega
     exactamente esto:

     ```
     https://kzltlqdfeajxouistouw.supabase.co/auth/v1/callback
     ```

   - Pulsa **Crear**.
5. Google te enseña dos valores: **ID de cliente** y **Secreto de cliente**.
   No cierres esa ventana todavía.

---

## Paso 2 · Pegarlos en Supabase

1. En Supabase, ve a **Authentication** → **Sign In / Providers**.
2. Busca **Google** en la lista y actívalo.
3. Pega el **ID de cliente** y el **Secreto de cliente** del paso anterior.
4. Guarda.

---

## Paso 3 · Comprobar que funciona

1. Entra en `https://triatlonalpedrete.vercel.app` (mejor en una ventana de
   incógnito, para que no te reconozca ya).
2. Pulsa **"Entrar con Google"**.
3. Elige tu cuenta.
4. Deberías volver a la aplicación ya dentro.

Si sale un error tipo *"redirect_uri_mismatch"*, es que la dirección del
paso 1.4 no está copiada exactamente. Vuelve a Google → Credenciales →
tu ID de cliente, y compárala carácter a carácter.

---

## Qué cambia para los entrenadores

Antes tenían que pedir un enlace por correo, esperarlo, y abrirlo desde el
mismo dispositivo. Ahora entran con dos toques y su cuenta de Google, que es
la que ya tienen abierta en el móvil.

El resto no cambia: siguen entrando como **pendientes**, y no ven nada hasta
que tú los apruebes en la pantalla de **Equipo** (donde ahora te avisa un
contador naranja en la barra de arriba en cuanto alguien está esperando).

El acceso por correo sigue estando disponible debajo, por si alguien no
tiene cuenta de Google o prefiere no usarla.
