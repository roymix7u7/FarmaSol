# FarmaSol

Farmacia online: catálogo, carrito, pedidos y panel de gestión.

- `apps/front` — React + TypeScript (Vite)
- `apps/back` — Spring Boot + MySQL

---

## Cómo arrancarlo

**Solo necesitas [Docker Desktop](https://www.docker.com/products/docker-desktop/).**
No instales Java, Node, Maven ni MySQL: va todo dentro de Docker.

```bash
git clone https://github.com/roymix7u7/FarmaSol.git
cd FarmaSol
docker compose up
```

Cuando deje de mostrar texto nuevo, abre **http://localhost:5173**.

> La primera vez tarda 3-5 minutos porque descarga e instala todo.
> Las siguientes arranca en segundos.

La base de datos se crea y se llena sola con productos y usuarios de prueba.
No tienes que configurar nada ni importar ningún `.sql`.

### Entra con estos usuarios

| Quién | Dónde entra | Usuario | Contraseña |
|---|---|---|---|
| Cliente | `/login` | `cliente@demo.pe` | `Cliente123!` |
| Gerente | `/gerente/login` | `gerente` | `Gerente123!` |
| Empleado | `/gerente/login` | `empleado` | `Empleado123!` |

### Si algo falla

| Problema | Solución |
|---|---|
| `port is already allocated` | Tienes algo usando el 5173, 8080 o 3307. Ciérralo, o para tu MySQL local desde Servicios de Windows. |
| La página no carga | Espera un poco más: el backend tarda en arrancar. Mira `docker compose logs -f back`. |
| Cambiaste dependencias y no se reflejan | `docker compose up --build` |
| Quieres empezar de cero | `docker compose down -v` y luego `docker compose up` |

### Comandos del día a día

```bash
docker compose up          # arrancar
docker compose down        # parar
docker compose logs -f back   # ver qué hace el backend
```

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

```bash
cd apps/front && npm run build
cd apps/back  && ./mvnw test
```

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
