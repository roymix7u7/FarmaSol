# FarmaSol

Farmacia online: catálogo, carrito, pedidos y panel de gestión.

- `apps/front` — React + TypeScript (Vite)
- `apps/back` — Spring Boot + MySQL

---

## Cómo arrancarlo

Hay dos formas. **Elige una**: las dos dejan el proyecto igual.

| | Sin Docker | Con Docker |
|---|---|---|
| Instalas | Java 17+, Node 22 y MySQL 8 | Solo Docker Desktop |
| Te conviene si | ya tienes MySQL (Workbench) y usas IntelliJ o VS Code | no quieres instalar nada más |

En las dos, la base de datos se crea y se llena sola con productos y usuarios de
prueba. No hay que importar ningún `.sql`.

### Opción A: sin Docker

**Necesitas tener instalado:**

- **Java 17 o más nuevo** (el JDK). Compruébalo con `java -version`
- **Node.js 22**. Compruébalo con `node -v`
- **MySQL 8** corriendo: el de siempre, el que usas con Workbench

Maven no hace falta: el proyecto trae `mvnw`, que lo descarga solo.

**1. Clona el repo**

```
git clone https://github.com/roymix7u7/FarmaSol.git
cd FarmaSol
```

**2. Pon la contraseña de tu MySQL** (solo la primera vez)

En la carpeta `apps/back` hay un archivo `.env.example`. Cópialo **en esa misma
carpeta** con el nombre `.env`, ábrelo y pon tu contraseña:

```
DB_PASSWORD=la_contraseña_de_tu_mysql
```

Ese archivo no se sube al repo: tu contraseña se queda en tu computadora.

**3. Arranca el backend** (en una terminal)

```
cd apps/back
.\mvnw spring-boot:run
```

Está listo cuando aparece `Started FarmaSolBackApplication`. La primera vez tarda
unos minutos porque descarga Maven y las dependencias.

> El comando depende de tu terminal: `.\mvnw` en PowerShell, `mvnw` en CMD, y
> `./mvnw` en Git Bash, Mac o Linux.
>
> ¿Prefieres el IDE? En IntelliJ, abre la carpeta `apps/back` y ejecuta
> `FarmaSolBackApplication` con el botón verde. Lee el mismo `.env`.

**4. Arranca el frontend** (en otra terminal, sin cerrar la del backend)

```
cd apps/front
npm install
npm run dev
```

`npm install` solo hace falta la primera vez, o cuando cambie `package.json`.

Abre **http://localhost:5173**.

**Si algo falla**

| Mensaje | Qué hacer |
|---|---|
| `Access denied for user 'root'` | La contraseña de `apps/back/.env` no es la de tu MySQL. Revísala. |
| `Communications link failure` | Tu MySQL está apagado. Enciéndelo desde Servicios de Windows (suele llamarse `MySQL80`). |
| `'java' no se reconoce` o `release version 17 not supported` | Instala el JDK 17 o 21. |
| `Port 8080 was already in use` | Ya tienes el backend abierto en otra terminal, o Docker corriendo. Ciérralo. |
| `npm run dev` falla con un error de versión | Actualiza Node a la versión 22. |

### Opción B: con Docker

Solo necesitas [Docker Desktop](https://www.docker.com/products/docker-desktop/)
abierto. No hace falta Java, Node ni MySQL, ni configurar contraseñas.

```
git clone https://github.com/roymix7u7/FarmaSol.git
cd FarmaSol
docker compose up
```

Cuando deje de mostrar texto nuevo, abre **http://localhost:5173**. La primera vez
tarda 3-5 minutos porque descarga todo; las siguientes, segundos.

| Para | Comando |
|---|---|
| Arrancar | `docker compose up` |
| Parar | `docker compose down` |
| Ver qué hace el backend | `docker compose logs -f back` |
| Aplicar cambios del backend o de dependencias | `docker compose up -d --build` |
| Empezar con la base vacía | `docker compose down -v` y luego `docker compose up` |

Si dice `port is already allocated`, tienes algo usando el 5173, 8080 o 3307:
ciérralo, o apaga tu MySQL local desde Servicios de Windows.

### Entra con estos usuarios

| Quién | Dónde entra | Usuario | Contraseña |
|---|---|---|---|
| Cliente | `/login` | `cliente@demo.pe` | `Cliente123!` |
| Gerente | `/gerente/login` | `gerente` | `Gerente123!` |
| Empleado | `/gerente/login` | `empleado` | `Empleado123!` |

El cliente entra con correo y el personal con usuario (sin `@`). El empleado entra
directo al **Punto de Venta**.

---

## Cómo trabajar en equipo

**Nunca subas cambios directo a `main`.** Está protegida: no te va a dejar.
El flujo es siempre el mismo:

```bash
git checkout main
git pull                            # 1. traer lo último

git checkout -b feat/lo-que-haras   # 2. tu propia rama

# ... haces tus cambios y los commiteas ...

git push -u origin feat/lo-que-haras  # 3. subir
```

Después entra a GitHub y abre un **Pull Request**. Un compañero lo revisa y lo
aprueba, y recién ahí se mergea a `main`.

**Nombra tu rama así:** `feat/` para algo nuevo, `fix/` para arreglar un bug.
Por ejemplo: `feat/filtro-por-categoria` o `fix/error-al-pagar`.

**Antes de abrir el PR**, asegúrate de que compila. Es lo mismo que revisa
GitHub automáticamente, y si falla no te deja mergear:

```
cd apps/front
npm run build
cd ../back
.\mvnw test
```

(En Git Bash, Mac o Linux, la última línea es `./mvnw test`.)

---

## Base de datos compartida (opcional)

Por defecto cada uno tiene su propia base de datos, con los mismos datos de
prueba. **Eso es lo normal y lo que debes usar casi siempre**: es más rápido y
nadie te borra tu trabajo.

Solo si necesitan ver **los mismos datos entre varios** (por ejemplo para la
presentación), usen la base compartida en la nube:

1. `cp .env.aiven.example .env.aiven`
2. Pídele a Roy los datos de conexión y ponlos en ese `.env.aiven`
3. Arranca con:
   ```bash
   docker compose --env-file .env.aiven -f docker-compose.yml -f docker-compose.aiven.yml up
   ```

Para volver al modo normal, `docker compose up` de siempre. Los dos modos son
independientes: tener `.env.aiven` no afecta a tu base local.

⚠️ **Cuidado:** ahí lo que borres lo borras para todos. Y va más lento, porque
la base está en internet y no en tu máquina.

🔒 **Nunca subas el archivo `.env.aiven`.** Tiene la contraseña real. Ya está
en `.gitignore` para que no pase por accidente.

---

## Dónde está cada cosa

```
apps/front/src/
├── api/        llamadas al backend
├── auth/       login y sesión
├── Cliente/    pantallas del cliente
├── Gerente/    panel de gestión
└── shared/     componentes reutilizables

apps/back/src/main/java/com/farmasol/backend/
├── controller/  endpoints de la API
├── service/     lógica de negocio
├── repository/  acceso a la base de datos
├── model/       tablas (entidades)
└── config/      seguridad y datos de prueba
```

El frontend llama a `/api/...` y Vite lo redirige al backend. No hay URLs
escritas a mano en el código.
