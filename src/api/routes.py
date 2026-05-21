
# API Routes - Archivo principal que registra todos los blueprints

from flask import Flask
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv

load_dotenv()

def register_routes(app: Flask):

    # Registra todos los blueprints de endpoints en la aplicación

    from api.auth import auth
    from api.users import users
    from api.trips import trips
    from api.itineraries import itineraries
    from api.expenses import expenses
    from api.documents import documents
    from api.messages import messages

    app.register_blueprint(auth, url_prefix="/api")
    app.register_blueprint(users, url_prefix="/api")
    app.register_blueprint(trips, url_prefix="/api")
    app.register_blueprint(itineraries, url_prefix="/api")
    app.register_blueprint(expenses, url_prefix="/api")
    app.register_blueprint(documents, url_prefix="/api")
    app.register_blueprint(messages, url_prefix="/api")

register_routes()