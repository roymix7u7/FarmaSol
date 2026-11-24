# FarmaSol - Backend (Spring Boot + MySQL)

API RESTful para el sistema de farmacia **FarmaSol**, desarrollada con **Spring Boot 3.4**, **Java 21**, **Spring Data JPA**, **MySQL** y arquitectura por capas **MVC**.

---

## 🛠️ Tecnologías & Dependencias

* **Java 21**
* **Spring Boot 3.4.3**
* **Spring Web**: Controladores REST y servidor embebido Tomcat.
* **Spring Data JPA & Hibernate**: Persistencia y ORM.
* **MySQL Connector/J**: Driver de conexión con MySQL Workbench.
* **Spring Boot Starter Validation**: Validación declarativa de datos (`@NotBlank`, `@Min`, `@DecimalMin`).
* **Lombok**: Generación de getters, setters, constructores y builders.
* **Spring Boot DevTools**: Recarga automática en desarrollo.

---

## 📂 Estructura del Proyecto (MVC / Capas)

```text
src/main/java/com/farmasol/backend/
├── config/                  # Configuraciones globales (CORS habilitado para frontend)
│   └── CorsConfig.java
├── controller/              # Endpoints REST (Controladores)
│   └── ProductoController.java
├── dto/                     # Objetos de Transferencia de Datos y Respuestas de Error
│   ├── ProductoDTO.java
│   └── ErrorResponseDTO.java
├── exception/               # Manejo global y centralizado de excepciones
│   ├── GlobalExceptionHandler.java
│   └── ResourceNotFoundException.java
├── model/                   # Entidades JPA mapeadas a MySQL
│   └── Producto.java
├── repository/              # Acceso a base de datos (JpaRepository)
│   └── ProductoRepository.java
├── service/                 # Interfaces y lógica de negocio
│   ├── ProductoService.java
│   └── impl/
│       └── ProductoServiceImpl.java
└── FarmaSolBackApplication.java  # Clase principal
```

---

## ⚙️ Configuración de Base de Datos (MySQL Workbench)

1. Abre **MySQL Workbench** e inicia tu servidor local de MySQL (puerto `3306`).
2. Verifica o ajusta tus credenciales en [`src/main/resources/application.properties`](file:///d:/Proyectos/Integrador2/FarmaSol-Back/src/main/resources/application.properties):

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/farmasol_db?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=TU_CONTRASEÑA_DE_MYSQL
```

> **Nota:** La base de datos `farmasol_db` y las tablas se crearán automáticamente al iniciar la aplicación gracias a `createDatabaseIfNotExist=true` y `hibernate.ddl-auto=update`.

---

## 🚀 Endpoints Disponibles

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/productos` | Listar todos los productos (soporta filtros `?busqueda=` y `?categoria=`) |
| `GET` | `/api/productos/{id}` | Obtener producto por ID |
| `POST` | `/api/productos` | Crear nuevo producto (con validaciones) |
| `PUT` | `/api/productos/{id}` | Actualizar un producto existente |
| `DELETE` | `/api/productos/{id}` | Eliminar producto por ID |
