# Guía Definitiva de Despliegue en la Nube (Cloud)

Para evitar todos los bloqueos de seguridad del teléfono y tener tu aplicación funcionando **24/7 con HTTPS oficial**, la mejor solución es subir tus proyectos a plataformas gratuitas en la nube. 

Aquí tienes el plan paso a paso.

## 1. El Backend (Servidor Express/Node.js) -> a Render.com
Toda tu base de datos y servidor que provee los Pokémon necesita estar en línea. 

1. Ve a [Render.com](https://render.com/) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **"New"** y selecciona **"Web Service"**.
3. Conecta el repositorio de GitHub donde tengas guardada la carpeta `BE` de tu proyecto.
    - _(Si aún no lo tienes en GitHub, tendrás que subirlo primero usando Git)._
4. Configuración en Render:
    - **Build Command:** `npm install`
    - **Start Command:** `node index.js`
    - **Environment Variables (Variables de Entorno):** Aquí debes poner todo lo que tienes en tu archivo `.env` local (Ej: `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, etc). ¡Asegúrate de cambiar tu conexión a la de una base de datos PostgreSQL alojada en la nube también!
5. Render te dará un enlace oficial seguro (ej. `https://mi-pokedex-back.onrender.com`).

## 2. El Frontend (Vue/Vite) -> a Vercel.com
Vercel es la mejor plataforma para subir proyectos frontend de Vite de manera gratuita.

**Paso Prévio CRÍTICO:**
Antes de subir el frontend, debes ir a los archivos donde haces las llamadas a la API (usualmente usan Axios o Fetch) y **cambiar la URL** de `localhost:3000` por el nuevo enlace que te dio Render en el paso anterior.

1. Ve a [Vercel.com](https://vercel.com/) e inicia sesión con GitHub.
2. Da clic en **"Add New..."** -> **"Project"**.
3. Importa el repositorio donde tienes tu carpeta `pokedex`.
4. Vercel detectará automáticamente que es un proyecto **Vite/Vue**.
    - La configuración predeterminada de "Build Command" (`npm run build`) y "Output Directory" (`dist`) es correcta.
5. Haz clic en **"Deploy"**.

## ✨ El Resultado Final
Vercel te proporcionará un enlace limpio, oficial y 100% seguro (ej. `https://mi-pokedex.vercel.app`).

Cuando abras ese enlace en tu celular:
1. Al ser un servidor real con HTTPS oficial, funcionará instantáneamente.
2. Chrome no pondrá ninguna traba ni triángulo rojo.
3. Te aparecerá el aviso de **"Añadir a la pantalla de inicio"** de inmediato.
4. Se instalará perfecto sin barra de navegación para siempre.
