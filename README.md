# FarmaSol

Sistema de farmacia online: catálogo, carrito, pedidos, recetas médicas y panel
de gestión. Monorepo con el frontend y el backend juntos.

| | |
|---|---|
| `apps/front` | React 19 + TypeScript + Vite |
| `apps/back` | Spring Boot 3.4 + MySQL + JWT |

---

## Arrancar el proyecto

**Requisito único: [Docker Desktop](https://www.docker.com/products/docker-desktop/).**
No necesitas instalar Java, Node, Maven ni MySQL.

```bash
git clone <url-del-repo>
cd farmasol
docker compose up
```

Listo. La primera vez tarda unos minutos (descarga e instala todo); después
arranca en segundos.

| Servicio | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://localhost:8080/api |
| MySQL | `localhost:3307` (usuario `root`, contraseña `admin123`) |

La base de datos se crea y se puebla sola con datos de prueba la primera vez.

### Usuarios de prueba

| Rol | Usuario | Contraseña |
|---|---|---|
| Gerente | `gerente` | `Gerente123!` |
| Empleado | `empleado` | `Empleado123!` |
| Cliente | `cliente@demo.pe` | `Cliente123!` |

El personal entra por `/admin/login` y los clientes por `/login`.

### Comandos útiles

```bash
docker compose up              # levantar todo
docker compose up -d           # levantar en segundo plano
docker compose logs -f back    # ver los logs del backend
docker compose down            # parar todo
docker compose down -v         # parar y BORRAR la base de datos (vuelve a sembrarse al arrancar)
docker compose up --build      # reconstruir tras cambiar dependencias
```

---

## Trabajar con la base de datos compartida

Por defecto cada quien tiene su propia BD local, con los mismos datos de prueba.
Eso es lo que quieres el 90% del tiempo: es más rápido, funciona sin internet y
nadie rompe el trabajo de nadie.

Cuando necesiten ver **los mismos datos** (probar entre varios, preparar la
presentación), usen la BD compartida en Aiven:

1. `cp .env.example .env`
2. En `.env`, comenta el bloque de BD local y descomenta el de Aiven, con los
   datos que les pase el equipo.
3. Levanta con el override de Aiven (no arranca el MySQL local, no hace falta):

   ```bash
   docker compose -f docker-compose.yml -f docker-compose.aiven.yml up
   ```

   Si te cansa escribirlo, agrega esto a tu `.env` y te basta `docker compose up`:

   ```
   COMPOSE_FILE=docker-compose.yml:docker-compose.aiven.yml
   COMPOSE_PATH_SEPARATOR=:
   ```

> **Nunca subas el archivo `.env`.** Lleva la contraseña real de la BD y está en
> `.gitignore` por eso. Si necesitas compartirla, pásala por privado.

⚠️ Con la BD compartida, lo que borres lo borras **para todos**. Para el día a
día, quédate en local.

---

## Desarrollo sin Docker

Si prefieres correr las cosas a mano necesitas Java 17+, Node 22+ y un MySQL.

```bash
# Backend  → http://localhost:8080
cd apps/back
./mvnw spring-boot:run

# Frontend → http://localhost:5173  (en otra terminal)
cd apps/front
npm install
npm run dev
```

El backend lee su configuración de variables de entorno (`DB_HOST`, `DB_PORT`,
`DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_SSL_MODE`); los valores por defecto
están en [`apps/back/src/main/resources/application.properties`](apps/back/src/main/resources/application.properties).

---

## Cómo colaborar

No se trabaja directo sobre `main`. El flujo es:

```bash
git checkout main
git pull                          # traer lo último antes de empezar
git checkout -b feat/mi-cambio    # rama nueva por cada tarea

# ... trabajas, commiteas ...

git push -u origin feat/mi-cambio # y abres un Pull Request en GitHub
```

**Nombres de rama:** `feat/` para funcionalidad nueva, `fix/` para arreglos,
`docs/` para documentación. Ejemplo: `feat/filtro-por-categoria`.

**Antes de abrir el PR**, comprueba que compila — es lo que CI va a verificar:

```bash
cd apps/front && npm run build
cd apps/back  && ./mvnw test
```

Cada PR necesita la aprobación de un compañero antes de mergear. El CI corre
solo en cada push.

### Estructura

```
farmasol/
├── docker-compose.yml       # levanta todo
├── .env.example             # plantilla de configuración
├── apps/
│   ├── front/
│   │   └── src/
│   │       ├── api/         # llamadas HTTP al backend (axios)
│   │       ├── auth/        # login, contexto de sesión, rutas protegidas
│   │       ├── Cliente/     # pantallas del cliente
│   │       ├── Gerente/     # pantallas del panel de gestión
│   │       ├── layout/      # cabecera, pie, estructura común
│   │       └── shared/      # componentes reutilizables
│   └── back/
│       └── src/main/java/com/farmasol/backend/
│           ├── controller/  # endpoints REST
│           ├── service/     # lógica de negocio
│           ├── repository/  # acceso a datos (JPA)
│           ├── model/       # entidades
│           ├── dto/         # objetos de entrada/salida de la API
│           ├── security/    # JWT y filtros
│           └── config/      # seguridad, CORS, datos de prueba
└── .github/workflows/ci.yml # build automático en cada PR
```

El frontend llama siempre a rutas relativas `/api/...`; el proxy de Vite las
redirige al backend, así que no hay URLs quemadas en el código.
