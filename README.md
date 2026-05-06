# Expedition - Viajes Colaborativos

Una aplicación web para planificar, organizar y disfrutar de viajes en grupo con tus amigos.

## Características

- **Gestión de Viajes**: Crea y administra viajes colaborativos
- **Itinerario**: Planifica actividades día a día
- **Gastos Compartidos**: Registra y divide gastos entre viajeros
- **Chat en Grupo**: Comunicación en tiempo real
- **Documentos**: Comparte archivos importantes
- **Notificaciones**: Recibe alertas in-app y por email
- **Autenticación**: Login con email/password o Google OAuth

## Tech Stack

| Capa | Tecnología |
|------|------------|
| Frontend | React + Vite |
| Backend | Flask (Python) |
| Database | SQLite / PostgreSQL |
| Auth | JWT + Google OAuth |
| Storage | Cloudinary |
| Email | SMTP Gmail |

## Estructura del Proyecto

```
├── src/
│   ├── app.py              # main.py
│   ├── wsgi.py            # WSGI entry point
│   ├── api/
│   │   ├── routes.py      # Endpoints de API
│   │   ├── models.py     # Modelos de DB
│   │   ├── utils.py      # Utilidades
│   │   ├── admin.py      # Admin panel
│   │   └── commands.py   # Comandos CLI
│   └── front/
│       ├── pages/        # 13 páginas React
│       ├── components/   # 10 componentes
│       └── styles/       # 12 archivos CSS
├── migrations/           # Alembic migrations
├── package.json          # Dependencias npm
└── requirements.txt     # Dependencias Python
```

## Configuración

### 1. Clonar y configurar

```bash
# Instalar dependencias Python
pip install -r requirements.txt

# Instalar dependencias npm
npm install
```

### 2. Variables de entorno

Crea un archivo `.env` basado en `.env.example`:

```env
# Base de datos
DATABASE_URL=sqlite:///expedition.db

# Flask
FLASK_APP=src/app.py
FLASK_DEBUG=1

# Frontend
VITE_BACKEND_URL=http://localhost:3001
VITE_GOOGLE_CLIENT_ID=tu_google_client_id

# Email
MAIL_USERNAME=tu@email.com
MAIL_PASSWORD=app_password

# Cloudinary
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
CLOUDINARY_CLOUD_NAME=tu_cloud_name
```

### 3. Iniciar la aplicación

**Backend** (puerto 3001):
```bash
export PYTHONPATH=src
flask run --port 3001
```

**Frontend** (puerto 3000):
```bash
npm run dev
```

## API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/signup` | Registro de usuario |
| POST | `/api/login` | Login tradicional |
| POST | `/api/google-login` | Login con Google |
| GET | `/api/profile` | Obtener perfil |
| PUT | `/api/profile` | Actualizar perfil |
| GET | `/api/trips` | Lista de viajes |
| POST | `/api/new_trip` | Crear viaje |
| GET | `/api/trip-detail/<id>` | Detalles del viaje |
| POST | `/api/new-activity/<id>` | Agregar actividad |
| POST | `/api/new-expense/<id>` | Registrar gasto |
| POST | `/api/new-message/<id>` | Enviar mensaje |
| POST | `/api/add-document/<id>` | Subir documento |

## Base de Datos

### Modelos

- **User**: Usuarios registrados
- **Trip**: Viajes
- **Traveler**: Relación usuario-viaje
- **Itinerary**: Actividades del itinerario
- **Expense**: Gastos
- **Debt**: Deudas entre usuarios
- **Document**: Archivos compartidos
- **Chat**: Chats por viaje
- **Message**: Mensajes
- **Notification**: Notificaciones in-app

### Migraciones

```bash
# Crear migración
flask db migrate -m "mensaje"

# Aplicar migraciones
flask db upgrade
```

## Despliegue

### Render.com

1. Conecta tu repositorio a Render
2. Configura las variables de entorno
3. El build command:
   ```bash
   pip install -r requirements.txt
   ```
4. El start command:
   ```bash
   gunicorn src.app:app --worker 1
   ```

## Desarrollo

### Credenciales de prueba

- **Email**: test@example.com
- **Password**: 123456

## Contribuidores

- Grupo 1 - Viajes Colaborativos

## Licencia

ISC