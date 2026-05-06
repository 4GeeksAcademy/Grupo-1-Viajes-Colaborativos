"""
Aplicación principal.
Inicia el servidor, conecta la DB y registra los endpoints.
"""
import os
from flask import Flask, request, jsonify, url_for, send_from_directory, make_response
from flask_migrate import Migrate
from flask_swagger import swagger
from flask_jwt_extended import JWTManager
from api.utils import APIException, generate_sitemap
from api.models import db
from api.routes import register_routes
from api.admin import setup_admin
from api.commands import setup_commands
from flask_cors import CORS

# =============================================================================
# CONFIGURACIÓN
# =============================================================================

ENV = "development" if os.getenv("FLASK_DEBUG") == "1" else "production"
static_file_dir = os.path.join(os.path.dirname(
    os.path.realpath(__file__)), '../dist/')

app = Flask(__name__)
app.config['CORS_HEADERS'] = 'Content-Type'

# Enable CORS for all routes
CORS(app, 
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    origin="*"
)

@app.after_request
def after_request_func(response):
    origin = request.headers.get('Origin')
    if origin:
        response.headers['Access-Control-Allow-Origin'] = origin
    else:
        response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    response.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    return response

app.url_map.strict_slashes = False

# JWT para autenticación
app.config["JWT_SECRET_KEY"] = "super-secreta-cambiar-luego" 
jwt = JWTManager(app)

# =============================================================================
# BASE DE DATOS
# =============================================================================

db_url = os.getenv("DATABASE_URL")
if db_url is not None:
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://")
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///expedition.db"

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
MIGRATE = Migrate(app, db, compare_type=True)
db.init_app(app)

# Admin y comandos CLI
setup_admin(app)
setup_commands(app)

# =============================================================================
# ENDPOINTS
# =============================================================================

register_routes(app)

# =============================================================================
# ERROR HANDLER
# =============================================================================

@app.errorhandler(APIException)
def handle_invalid_usage(error):
    """Maneja errores personalizados"""
    return jsonify(error.to_dict()), error.status_code

# =============================================================================
# RUTAS
# =============================================================================

@app.route('/')
def sitemap():
    """Muestra los endpoints disponibles en desarrollo"""
    if ENV == "development":
        return generate_sitemap(app)
    return send_from_directory(static_file_dir, 'index.html')


@app.route('/<path:path>', methods=['GET'])
def serve_any_other_file(path):
    """Serve archivos estáticos en producción"""
    if not os.path.isfile(os.path.join(static_file_dir, path)):
        path = 'index.html'
    response = send_from_directory(static_file_dir, path)
    response.cache_control.max_age = 0
    return response


if __name__ == '__main__':
    PORT = int(os.environ.get('PORT', 3001))
    app.run(host='0.0.0.0', port=PORT, debug=False, use_reloader=False)