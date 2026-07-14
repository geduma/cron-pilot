# CronPilot
## Product Specification v1.0

---

# Descripción

CronPilot es una aplicación web para crear, ejecutar y monitorear Jobs programados.

Su objetivo es ofrecer una forma sencilla de automatizar llamadas HTTP y monitorear servicios propios sin necesidad de configurar cron jobs en servidores, GitHub Actions o herramientas externas.

El proyecto está diseñado para ser pequeño, fácil de mantener y completamente self-hosted.

---

# Objetivos del MVP

Permitir que un usuario pueda:

- iniciar sesión mediante un servicio OAuth externo
- crear Jobs HTTP
- configurar la frecuencia de ejecución
- ejecutar Jobs manualmente
- visualizar el historial
- revisar errores
- activar o pausar Jobs
- consultar estadísticas básicas

No forma parte del MVP:

- múltiples organizaciones
- workflows
- scripting
- SQL Jobs
- Redis
- colas distribuidas
- múltiples workers

---

# Stack Tecnológico

## Frontend

- React
- Vite
- TypeScript
- React Router
- React Query
- TailwindCSS
- Axios

---

## Backend

- NodeJS
- Fastify
- TypeScript

---

## Base de datos

SQLite (via better-sqlite3)

File: `./data/cronpilot.db`

Zero config, file-based, self-contained.

---

## Autenticación

No será responsabilidad de CronPilot.

El frontend recibirá un JWT generado por un servicio OAuth existente.

Cada request enviará:

Authorization: Bearer TOKEN

El backend únicamente validará el JWT.

---

# Arquitectura

```
React

      │

 REST API

      │

 Fastify

      │

 PostgreSQL (Supabase)

      │

 Scheduler interno

      │

 HTTP Jobs
```

El scheduler vive dentro de la API.

No existen procesos separados.

---

# Tipos de Job

Versión 1 únicamente soporta:

## HTTP Request

Métodos

- GET
- POST
- PUT
- PATCH
- DELETE

---

# Flujo

Usuario

↓

Crear Job

↓

Guardar configuración

↓

Scheduler detecta siguiente ejecución

↓

Ejecuta HTTP Request

↓

Guarda resultado

↓

Actualiza Dashboard

---

# Scheduler

El scheduler corre permanentemente.

Cada minuto:

```
SELECT jobs
WHERE

enabled=true

AND

next_execution <= now()
```

Por cada Job encontrado:

```
Ejecutar

Guardar resultado

Calcular siguiente ejecución
```

---

# Frecuencias soportadas

Cada:

- 1 minuto
- 5 minutos
- 10 minutos
- 15 minutos
- 30 minutos
- 1 hora
- 6 horas
- 12 horas
- 24 horas

No habrá Cron Expressions en el MVP.

---

# Modelo de Datos

## jobs

```sql
id

user_id

name

description

method

url

headers

body

expected_status

frequency

enabled

last_execution

next_execution

created_at

updated_at
```

---

## job_executions

```sql
id

job_id

status

http_status

duration_ms

response_body

error_message

executed_at
```

---

# Estados

Job

```
ACTIVE

PAUSED
```

Ejecución

```
SUCCESS

FAILED

TIMEOUT
```

---

# Dashboard

Al ingresar el usuario verá:

```
Jobs Activos

Jobs Pausados

Última ejecución

Próxima ejecución

Total ejecuciones

Errores últimas 24h
```

Debajo:

Tabla

```
Nombre

Estado

Frecuencia

Última ejecución

Próxima ejecución

Resultado

Acciones
```

---

# Pantallas

## Login

No existe.

El usuario llega autenticado.

---

## Dashboard

Listado de Jobs.

Botón

Nuevo Job

---

## Crear Job

Campos

Nombre

Descripción

Método HTTP

URL

Headers

Body

Status esperado

Frecuencia

Activo

Botón

Guardar

---

## Editar Job

Igual al formulario anterior.

---

## Historial

Tabla

```
Fecha

Resultado

Código HTTP

Tiempo

Error
```

Filtros

Últimas

- 24h
- 7 días
- 30 días

---

# Configuración del Job

Ejemplo

```
Nombre

Supabase Keep Alive

Método

GET

URL

https://mi-api.com/api/ping

Headers

Authorization

Bearer xxxx

Esperar Status

200

Frecuencia

6 horas
```

---

# Ejecución Manual

Cada Job tendrá

```
Run Now
```

Al presionar

↓

Ejecuta inmediatamente

↓

Guarda historial

↓

Actualiza Dashboard

---

# Validación

Se considera SUCCESS cuando:

- responde
- no supera timeout
- status HTTP coincide

Ejemplo

Esperado

```
200
```

Recibido

```
200
```

SUCCESS

---

Esperado

```
200
```

Recibido

```
500
```

FAILED

---

# Timeout

Por defecto

```
30 segundos
```

Configurable por Job.

---

# Historial

Se almacenará

```
fecha

duración

status

status HTTP

body

mensaje error
```

No se almacenarán headers de respuesta para simplificar el MVP.

---

# API

## GET

```
/jobs
```

Obtiene Jobs.

---

## POST

```
/jobs
```

Crear Job.

---

## GET

```
/jobs/:id
```

Detalle.

---

## PUT

```
/jobs/:id
```

Actualizar.

---

## DELETE

```
/jobs/:id
```

Eliminar.

---

## POST

```
/jobs/:id/run
```

Ejecutar manualmente.

---

## GET

```
/jobs/:id/history
```

Historial.

---

# Respuesta API

Formato único

```json
{
  "success": true,
  "data": {},
  "message": ""
}
```

Errores

```json
{
  "success": false,
  "message": "Job not found"
}
```

---

# Frontend

## Componentes

```
Navbar

Dashboard

JobTable

JobCard

JobForm

HistoryTable

StatusBadge

ConfirmDialog

LoadingSpinner
```

---

# UI

Estilo limpio.

Colores

```
Verde

Éxito

Rojo

Error

Azul

Información

Gris

Inactivo
```

No habrá modo oscuro inicialmente.

---

# Seguridad

El backend:

- valida JWT
- filtra Jobs por user_id
- nunca expone Jobs de otro usuario

---

# Validaciones

Nombre

Obligatorio

URL

Debe ser válida

Método

Obligatorio

Frecuencia

Obligatoria

Expected Status

100-599

---

# Logs

La API registrará

```
Inicio Job

Fin Job

Duración

Errores
```

En consola.

No habrá sistema de logging avanzado.

---

# Roadmap

## v1

- HTTP Jobs
- Scheduler
- Dashboard
- Historial
- Ejecución manual

---

## v1.1

- Variables globales
- Templates
- Duplicar Job

---

## v1.2

- Webhooks
- Notificaciones Email
- Notificaciones Discord

---

## v2

- Cron Expressions
- SQL Jobs
- Scripts
- Redis
- Workers independientes
- Métricas avanzadas

---

# Objetivo Final del MVP

Al finalizar la versión 1 el usuario podrá:

- administrar todos sus Jobs desde una sola interfaz
- mantener activos servicios mediante llamadas programadas
- monitorear APIs propias
- revisar historial de ejecuciones
- detectar fallos rápidamente
- ejecutar Jobs manualmente cuando sea necesario

El sistema deberá ser lo suficientemente simple para desplegarse en pocos minutos, pero con una arquitectura que permita incorporar nuevos tipos de Jobs en versiones futuras sin reescribir la base del proyecto.