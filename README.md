# FarmaSol

Farmacia online: tienda para clientes, panel de gestión y punto de venta para el
mostrador.

| Carpeta | Qué es | Hecho con |
|---|---|---|
| `apps/front` | Lo que se ve en el navegador | React + TypeScript (Vite) |
| `apps/back` | La API y la base de datos | Spring Boot + MySQL |

**En este README:**
[Arrancar el proyecto](#1-arrancar-el-proyecto) ·
[Usuarios de prueba](#2-usuarios-de-prueba) ·
[Editar el proyecto](#3-editar-el-proyecto) ·
[La base de datos](#4-la-base-de-datos) ·
[Trabajar en equipo](#5-trabajar-en-equipo) ·
[Si algo falla](#6-si-algo-falla)

---

## 1. Arrancar el proyecto

Hay dos formas. **Elige una**: las dos dejan el proyecto igual.

| | Sin Docker | Con Docker |
|---|---|---|
| Instalas | Java 17+, Node 22 y MySQL 8 | Solo Docker Desktop |
| Te conviene si | ya tienes MySQL (Workbench) y usas IntelliJ o VS Code | no quieres instalar nada más |

En las dos, **la base de datos se crea y se llena sola** con productos y usuarios de
prueba. No hay que importar ningún `.sql`.

### Opción A: sin Docker

**Necesitas tener instalado:**

- **Java 17 o más nuevo** (el JDK). Compruébalo con `java -version`
- **Node.js 22**. Compruébalo con `node -v`
- **MySQL 8** encendido: el de siempre, el que usas con Workbench

Maven no hace falta: el proyecto trae `mvnw`, que lo descarga solo.

**Paso 1. Clona el repo**

```
git clone https://github.com/roymix7u7/FarmaSol.git
cd FarmaSol
```

**Paso 2. Pon la contraseña de tu MySQL** (solo la primera vez)

En la carpeta `apps/back` hay un archivo `.env.example`. Cópialo **en esa misma
carpeta** con el nombre `.env`, ábrelo y escribe tu contraseña:

```
DB_PASSWORD=la_contraseña_de_tu_mysql
```

Ese archivo no se sube al repo: tu contraseña se queda en tu computadora.

**Paso 3. Arranca el backend** (en una terminal)

```
cd apps/back
.\mvnw spring-boot:run
```

Está listo cuando aparece `Started FarmaSolBackApplication`. La primera vez tarda
unos minutos porque descarga Maven y las dependencias.

> El comando cambia según tu terminal: `.\mvnw` en PowerShell, `mvnw` en CMD, y
> `./mvnw` en Git Bash, Mac o Linux.
>
> ¿Prefieres el IDE? En IntelliJ abre la carpeta `apps/back` y ejecuta
> `FarmaSolBackApplication` con el botón verde. Usa el mismo `.env`.

**Paso 4. Arranca el frontend** (en otra terminal, sin cerrar la del backend)

```
cd apps/front
npm install
npm run dev
```

`npm install` solo hace falta la primera vez, o cuando alguien cambie
`package.json`.

**Paso 5. Ábrelo:** **http://localhost:5173**

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
| Aplicar cambios del backend | `docker compose up -d --build back` |
| Empezar con la base vacía | `docker compose down -v` y luego `docker compose up` |

### ¿Funcionó?

Haz esta prueba de 30 segundos:

1. En **http://localhost:5173** ves productos con precio en la página principal
2. Entras con `cliente@demo.pe` / `Cliente123!` y agregas algo al carrito
3. En **http://localhost:5173/gerente/login** entras con `gerente` / `Gerente123!`
   y ves el resumen con gráficos

Si las tres funcionan, todo está bien conectado. Si no, mira
[Si algo falla](#6-si-algo-falla).

---

## 2. Usuarios de prueba

| Quién | Dónde entra | Usuario | Contraseña | Qué puede hacer |
|---|---|---|---|---|
| Cliente | `/login` | `cliente@demo.pe` | `Cliente123!` | Comprar, ver sus pedidos, subir recetas |
| Empleado | `/gerente/login` | `empleado` | `Empleado123!` | Vender en mostrador, gestionar pedidos, revisar recetas |
| Gerente | `/gerente/login` | `gerente` | `Gerente123!` | Todo: además catálogo, precios, promociones y personal |

El cliente entra con **correo** y el personal con **usuario** (sin `@`).

---

## 3. Editar el proyecto

### Lo más importante: qué se actualiza solo y qué no

| Si cambias algo en... | Para verlo |
|---|---|
| `apps/front` (pantallas, estilos) | **Nada.** Guarda el archivo y el navegador se actualiza solo |
| `apps/back` (Java) | **Reinicia el backend**: `Ctrl + C` en su terminal y vuelve a correr `.\mvnw spring-boot:run` |

Si cambiaste algo del backend y "no pasa nada", casi siempre es que no lo
reiniciaste. Con Docker, el equivalente es `docker compose up -d --build back`.

### Tu primer cambio (2 minutos)

Para comprobar que puedes editar:

1. Abre `apps/front/src/Cliente/HomeCliente.tsx`
2. Busca el texto `Tu farmacia de confianza, a un clic` y cámbialo por otro
3. Guarda. Mira **http://localhost:5173**: ya aparece tu texto, sin recargar nada

Cuando lo veas, deshaz el cambio (o no lo subas).

### Cómo viaja un dato de la pantalla a la base

Casi todo en el proyecto sigue el mismo camino. Ejemplo: **mostrar los productos**.

```
 FRONTEND (apps/front/src)                BACKEND (apps/back/.../backend)

 Cliente/CategoriaCliente.tsx             controller/ProductoController.java
   la pantalla                              recibe GET /api/productos
        │                                          │
        ▼                                          ▼
 api/catalogo.ts                          service/impl/ProductoServiceImpl.java
   catalogoApi.productos()  ── /api/ ──►    la lógica: precios, promociones
                                                   │
                                                   ▼
                                          repository/ProductoRepository.java
                                            consulta la tabla "productos"
```

Así que, para cualquier funcionalidad:

- **Algo que se ve** → la pantalla, en `Cliente/` o `Gerente/`
- **Qué datos pide al servidor** → el archivo de `api/` con el mismo tema
- **Qué hace el servidor con eso** → el `service/impl/` del mismo tema

### ¿Dónde cambio...?

| Quiero cambiar... | Archivo |
|---|---|
| Una pantalla de la tienda | `apps/front/src/Cliente/` (una por pantalla: `CarritoCliente.tsx`, `PagoCliente.tsx`…) |
| Una pantalla del panel | `apps/front/src/Gerente/` (`InventarioGerente.tsx`, `PedidosGerente.tsx`…) |
| El punto de venta | `apps/front/src/Gerente/puntoVenta/` |
| Los colores de toda la app | `apps/front/src/Css/global.css` (las variables `--verde`, `--rojo`…) |
| El estilo de una pantalla | `apps/front/src/Css/` (cada pantalla importa el suyo arriba) |
| Las direcciones (URLs) de las páginas | `apps/front/src/App.tsx` |
| La cabecera y el menú de la tienda | `apps/front/src/layout/PublicLayout.tsx` |
| El menú lateral del panel | `apps/front/src/Gerente/HomeGerente.tsx` |
| Una regla del negocio (stock, precios, pedidos) | `apps/back/.../service/impl/` |
| Qué rol puede hacer qué | `@PreAuthorize` en cada archivo de `apps/back/.../controller/` |
| Los productos y usuarios de prueba | `apps/back/.../config/DataSeeder.java` |
| Una tabla de la base | `apps/back/.../model/` (una clase por tabla) |
| Una validación (DNI, teléfono, contraseña) | **Los dos**: `apps/back/.../validation/Reglas.java` y `apps/front/src/shared/validaciones.ts` |

`apps/back/...` es la abreviatura de `apps/back/src/main/java/com/farmasol/backend`.

> **Ojo con las validaciones:** viven en los dos lados a propósito. El frontend
> avisa antes, pero quien manda es el backend. Si cambias una regla en un solo
> lado, el formulario aceptará algo que el servidor rechace, o al revés.

### Todas las carpetas

```
apps/front/src/
├── Cliente/     pantallas de la tienda
├── Gerente/     pantallas del panel de gestión
│   └── puntoVenta/   el punto de venta del mostrador
├── api/         las llamadas al backend, una por tema
├── auth/        inicio de sesión
├── layout/      cabecera y pie de la tienda
├── shared/      piezas reutilizables (tarjeta de producto, filtros, validaciones…)
├── Css/         los estilos
├── App.tsx      las rutas
└── types.ts     los tipos de datos compartidos

apps/back/src/main/java/com/farmasol/backend/
├── controller/   las direcciones de la API (/api/...) y quién puede usarlas
├── service/      la lógica del negocio
├── repository/   las consultas a la base de datos
├── model/        las tablas de la base, una clase por tabla
├── dto/          lo que entra y sale de la API
├── validation/   reglas de validación (DNI, teléfono, contraseña, pagos)
├── security/     sesión y tokens (JWT)
├── exception/    los mensajes de error que ve el usuario
└── config/       seguridad general y datos de prueba
```

---

## 4. La base de datos

**No hay que crearla a mano.** Al arrancar, el backend crea la base
`farmasol_db`, crea las tablas a partir de las clases de `model/` y, si están
vacías, las llena con los datos de prueba.

### Verla en Workbench

Crea una conexión con estos datos:

| | Sin Docker | Con Docker |
|---|---|---|
| Host | `localhost` | `localhost` |
| Puerto | `3306` | `3307` |
| Usuario | `root` | `root` |
| Contraseña | la de tu MySQL | `admin123` |
| Base | `farmasol_db` | `farmasol_db` |

### Si agregas o cambias un campo

Las columnas nuevas **se crean solas** al reiniciar el backend: agrega el campo a
la clase de `model/` y listo. Dos cosas que no hace sola:

- **No borra ni renombra columnas.** Si renombras un campo, la columna vieja se
  queda. No molesta, pero tampoco desaparece.
- **Cuidado con una columna obligatoria nueva** (`nullable = false`) en una tabla
  que ya tiene datos: según el tipo, falla al arrancar o rellena las filas viejas
  con valores vacíos sin avisar. Hazla opcional, o empieza con la base vacía.

### Empezar con la base vacía

Útil si algo quedó raro, o si cambiaste los datos de prueba y quieres verlos.

- **Sin Docker:** en Workbench ejecuta `DROP DATABASE farmasol_db;` y reinicia el
  backend
- **Con Docker:** `docker compose down -v` y luego `docker compose up`

Se vuelve a crear y a llenar sola. Los datos de prueba **solo se cargan cuando la
tabla está vacía**: si cambias `DataSeeder.java` y no ves el cambio, es por eso.

### Base compartida en la nube (opcional)

Por defecto cada uno tiene su propia base: lo que registras tú, los demás no lo
ven. **Eso es lo normal**: es más rápido y nadie te borra tu trabajo.

Si alguna vez necesitan ver **los mismos datos** (por ejemplo para la presentación),
se puede usar una base compartida. Pídele a Roy los datos y sigue
`.env.aiven.example`. Ahí lo que borras, lo borras para todos.

---

## 5. Trabajar en equipo

**Nunca trabajes directo en `main`.** Está protegida: GitHub no te dejará subir
nada ahí. Cada tarea va en su propia rama y entra a `main` con un Pull Request.

### El día a día

**1. Antes de empezar, trae lo último**

```
git checkout main
git pull
```

**2. Crea tu rama** (una por tarea)

```
git checkout -b feat/lo-que-vas-a-hacer
```

Usa `feat/` para algo nuevo y `fix/` para arreglar algo. Por ejemplo:
`feat/filtro-por-marca` o `fix/error-al-pagar`.

**3. Trabaja y guarda tus avances** (las veces que quieras)

```
git add .
git commit -m "Agrega el filtro por marca"
```

**4. Antes de subir, comprueba que compila.** Es lo mismo que revisará GitHub, y si
falla no se podrá mergear:

```
cd apps/front
npm run build
cd ../back
.\mvnw test
```

**5. Sube tu rama**

```
git push -u origin feat/lo-que-vas-a-hacer
```

**6. Abre el Pull Request.** En GitHub aparece un botón verde **«Compare & pull
request»**. Pulsa, escribe qué hiciste y créalo. Un compañero lo revisa, lo
aprueba, y entra a `main`.

### Si tu rama se quedó atrás

Si mientras trabajabas otros mergearon cosas, trae lo nuevo a tu rama antes de
seguir:

```
git checkout main
git pull
git checkout feat/lo-que-vas-a-hacer
git merge main
```

Si dos personas tocaron las mismas líneas, Git te avisará con un **conflicto**:
abre el archivo, quédate con la versión correcta, guarda, y haz `git add .` y
`git commit`. VS Code e IntelliJ marcan los conflictos con botones para elegir.

### Para no pisarse

- **Avisen en el grupo antes de tocar archivos que usan todos:** `App.tsx`,
  `api/client.ts`, `Css/global.css`, `HomeGerente.tsx` y `SecurityConfig.java`
- Ramas cortas: mejor un PR chico cada día que uno enorme a fin de semana
- Si vas a cambiar una tabla de la base, avisa: afecta al código de todos

---

## 6. Si algo falla

**Al arrancar sin Docker**

| Mensaje | Qué hacer |
|---|---|
| `Access denied for user 'root'` | La contraseña de `apps/back/.env` no es la de tu MySQL. Revísala. |
| `Communications link failure` | Tu MySQL está apagado. Enciéndelo desde Servicios de Windows (suele llamarse `MySQL80`). |
| `'java' no se reconoce` o `release version 17 not supported` | Instala el JDK 17 o 21. |
| `Port 8080 was already in use` | Ya tienes el backend abierto en otra terminal, o Docker corriendo. Ciérralo. |
| `npm run dev` falla con un error de versión | Actualiza Node a la versión 22. |

**Al arrancar con Docker**

| Mensaje | Qué hacer |
|---|---|
| `port is already allocated` | Algo usa el 5173, 8080 o 3307. Ciérralo, o apaga tu MySQL local desde Servicios de Windows. |
| La página no carga | El backend tarda en arrancar. Espera y mira `docker compose logs -f back`. |

**Mientras trabajas**

| Problema | Qué hacer |
|---|---|
| Cambié el backend y no pasa nada | Reinícialo (ver [qué se actualiza solo](#lo-más-importante-qué-se-actualiza-solo-y-qué-no)). |
| La página sale en blanco | Abre la consola del navegador (`F12` → pestaña *Console*): ahí aparece el error. |
| Sale «No se pudo conectar con el servidor» | El backend está apagado o se cayó. Mira su terminal. |
| Un error raro después de `git pull` | Alguien agregó una dependencia: corre `npm install` en `apps/front`. |
| Mis datos quedaron raros | [Empieza con la base vacía](#empezar-con-la-base-vacía). |
