"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
import os
import string
import random
from dotenv import load_dotenv
from datetime import timedelta
from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    get_jwt_identity,
    jwt_required,
    decode_token
)

# --- 🚀 NUEVAS IMPORTACIONES PARA GOOGLE Y EMAILS ---
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from api.utils import APIException, send_email_notification
# ----------------------------------------------------

# --- 🚀 NUEVAS IMPORTACIONES PARA CLOUDINARY ---
import cloudinary
import cloudinary.uploader
from cloudinary.utils import cloudinary_url
# ----------------------------------------------------


import enum
from sqlalchemy import func
from collections import defaultdict
from api.models import db, User, Trip, Traveler, Itinerary, Expense, Debt, Document, Chat, Message, StateTypes, CategoryTypes, Notification

api = Blueprint("api", __name__)

load_dotenv()

# Configuracion de Cloudinary
cloudinary.config(
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME"), 
    api_key = os.getenv("CLOUDINARY_API_KEY"), 
    api_secret = os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

# ==========================================================
# 🎨 PLANTILLA MAESTRA PARA CORREOS (DISEÑO PREMIUM)
# ==========================================================
def get_email_template(body_content):
    return f"""
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; padding: 40px 20px; color: #334155;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
            
            <div style="background-color: #1E3A5F; padding: 35px 20px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 2px; text-transform: uppercase;">
                    🌍 EXPEDITION
                </h1>
            </div>
            
            <div style="padding: 40px 30px; font-size: 16px; line-height: 1.6;">
                {body_content}
            </div>
            
            <div style="background-color: #f1f5f9; padding: 25px 20px; text-align: center; font-size: 13px; color: #64748b; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0 0 10px 0;">Has recibido este mensaje porque eres parte de una aventura en Expedition.</p>
                <p style="margin: 0; font-weight: bold;">© 2026 Expedition Team</p>
            </div>
            
        </div>
    </div>
    """
# ==========================================================

# Funcion que recupera el body de una peticion
def get_json_payload():
    return request.get_json(silent=True) or {}

# Funcion que crea el token JWT
def build_auth_response(user, status_code, message):
    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        "message": message,
        "access_token": access_token,
        "user": user.serialize()
    }), status_code

# Funcion que comprueba y devuelve el usuario según su token
def get_current_user():
    identity = get_jwt_identity()
    if identity is None:
        raise APIException("Missing user identity in token", status_code=401)

    try:
        user_id = int(identity)
    except (TypeError, ValueError) as error:
        raise APIException("Invalid token identity",
                           status_code=401) from error

    user = db.session.get(User, user_id)
    if user is None:
        raise APIException("Authenticated user was not found", status_code=404)

    return user

# 🛡️ HELPER: BLOQUEA A USUARIOS NO VERIFICADOS
def ensure_verified(user):
    if not getattr(user, 'is_verified', False):
        raise APIException("Debes verificar tu correo electrónico para realizar esta acción.", status_code=403)

# Funcion que valida las credenciales al registrarse
def validate_credentials(payload, require_name=False):
    name = payload.get("name", "").strip()
    email = payload.get("email", "").strip().lower()
    password = payload.get("password", "")

    if require_name and len(name) < 2:
        raise APIException(
            "Name must contain at least 2 characters", status_code=400)

    if "@" not in email:
        raise APIException(
            "Please provide a valid email address", status_code=400)

    if len(password) < 6:
        raise APIException(
            "Password must contain at least 6 characters", status_code=400)

    return name, email, password

# Funcion que valida los datos de un nuevo viaje
def validate_new_trip(payload):

    title = payload.get("title").strip()
    destination = payload.get("destination").strip()
    state = payload.get("state").strip()
    starting_date = payload.get("starting_date").strip()
    ending_date = payload.get("ending_date").strip()
    budget = payload.get("budget").strip()
    notes = payload.get("notes").strip()
    
    # 📸 NUEVO: Capturamos la URL (puede venir vacía)
    image_url = payload.get("image_url", "").strip() 

    if title is None:
        raise APIException(
            "El viaje debe contener titulo", status_code=400)

    if destination is None:
        raise APIException(
            "El viaje debe contener destino", status_code=400)

    if state is None:
        raise APIException(
            "El viaje debe contener estado", status_code=400)

    if starting_date is None:
        raise APIException(
            "El viaje debe contener fecha de inicio", status_code=400)

    if ending_date is None:
        raise APIException(
            "El viaje debe contener fecha de fin", status_code=400)

    if budget is None:
        raise APIException(
            "El viaje debe contener un presupuesto", status_code=400)

    trip = Trip(
        title=title,
        destination=destination,
        state=state,
        starting_date=starting_date,
        ending_date=ending_date,
        budget=budget,
        notes=notes,
        image_url=image_url if image_url else None # 📸 Guardamos la URL o None
    )

    return trip

# Funcion que valida los datos de una nueva actividad
def validate_new_itinerary(payload):

    title = payload.get("title").strip()
    destination = payload.get("destination").strip()
    hour = payload.get("hour").strip()
    starting_date = payload.get("starting_date").strip()
    notes = payload.get("notes","").strip()

    if title is None:
        raise APIException(
            "La actividad debe contener titulo", status_code=400)

    if destination is None:
        raise APIException(
            "La actividad debe contener destino", status_code=400)

    if hour is None:
        raise APIException(
            "La actividad debe contener hora", status_code=400)

    if starting_date is None:
        raise APIException(
            "La actividad debe contener fecha", status_code=400)

    itinerary = Itinerary(
        title=title,
        destination=destination,
        hour=hour,
        starting_date=starting_date,
        notes=notes
    )

    return itinerary

# Funcion que valida los datos de un nuevo gasto
def validate_new_expense(payload):
    amount = payload.get("amount")
    description = payload.get("description")
    payer_id = payload.get("payer_id")

    if amount is None:
        raise APIException(
            "El gasto debe contener una cantidad", status_code=400)
    
    if description is None or str(description).strip() == "":
        raise APIException(
            "El gasto debe contener descripcion", status_code=400)
    
    if payer_id is None:
        raise APIException(
            "El gasto debe contener un pagador", status_code=400)

    expense = Expense(
        amount = float(amount),
        description = str(description).strip(),
        payer_id = int(payer_id)
    )

    return expense

# Funcion que comprueba si el usuario está registrado en el viaje
def validate_user_trip(user, trip_id):
        
    applicant = Traveler.query.filter(
        Traveler.user_id == user.id, Traveler.trip_id == trip_id).one_or_none()
    if applicant is None:
        raise APIException(
            "No estás incluido en este viaje", status_code=401)
    
    return True

# --- 📧 HELPER: OBTENER TODOS LOS CORREOS DE UN VIAJE ---
def get_trip_emails(trip_id):
    travelers = Traveler.query.filter_by(trip_id=trip_id).all()
    return [t.users.email for t in travelers]
# --------------------------------------------------------


#------------------------------
#        ENDPOINTS
#------------------------------


# Enpoint que realiza el login del usuario
@api.route("/login", methods=["POST"])
@api.route("/signin", methods=["POST"])
def sign_in():
    data = get_json_payload()
    _, email, password = validate_credentials(data)

    user = User.query.filter_by(email=email).one_or_none()
    if user is None or not user.check_password(password):
        raise APIException("Email o contraseña incorrecta", status_code=401)

    return build_auth_response(user, 200, "Login correcto")


# Enpoint que realiza el login del usuario con google
@api.route("/google-login", methods=["POST"])
def google_login():
    data = get_json_payload()
    token = data.get("credential")

    try:
        client_id = os.getenv("GOOGLE_CLIENT_ID")
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), client_id)
        
        email = idinfo['email']
        name = idinfo.get('name', 'Usuario de Google')

        user = User.query.filter_by(email=email).one_or_none()
        
        if not user:
            user = User(email=email, name=name)
            user.set_password("google_oauth_random_password_xyz123")
            user.is_verified = True # 🛡️ Los correos de Google ya están verificados
            db.session.add(user)
            db.session.commit()
            
            # 📧 NOTIFICACIÓN: Registro (Google)
            frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
            body = f"""
            <h2 style="color: #1E3A5F; margin-top: 0;">¡Hola {name}! 👋</h2>
            <p>Qué alegría tenerte a bordo. Tu cuenta ha sido enlazada con Google correctamente y ya está lista para usarse.</p>
            <p>Empieza ahora mismo a planificar tu próxima gran aventura, invita a tus amigos y lleva el control de los gastos sin estrés.</p>
            <div style="text-align: center; margin-top: 35px;">
                <a href="{frontend_url}/my-trips" style="background-color: #2EC4B6; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Ir a Mis Viajes</a>
            </div>
            """
            send_email_notification("¡Bienvenido a Expedition! ✈️", [email], get_email_template(body))

        return build_auth_response(user, 200, "Login con Google exitoso")
    except ValueError:
        raise APIException("Token de Google inválido", status_code=401)


# Endpoint que registra un nuevo usuario
@api.route("/sign-up", methods=["POST"])
@api.route("/signup", methods=["POST"])
@api.route("/register", methods=["POST"])
def sign_up():
    data = get_json_payload()
    name, email, password = validate_credentials(data, require_name=True)

    existing_user = User.query.filter_by(email=email).one_or_none()
    if existing_user is not None:
        raise APIException(
            "Ya existe un usuario con registrado con este correo", status_code=409)

    new_user = User(
        email=email,
        name=name,
        is_verified=False # 🛡️ Empieza sin verificar
    )
    new_user.set_password(password)

    db.session.add(new_user)
    db.session.commit()

    # 🛡️ Generamos enlace de verificación (Caduca en 1 día)
    verify_token = create_access_token(identity=str(new_user.id), expires_delta=timedelta(days=1))
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    verify_url = f"{frontend_url}/verify?token={verify_token}"

    # 📧 NOTIFICACIÓN: Registro Normal con enlace
    body = f"""
    <h2 style="color: #1E3A5F; margin-top: 0;">¡Prepárate para despegar, {name}! 🚀</h2>
    <p>Tu cuenta ha sido creada exitosamente. Para que puedas empezar a invitar a tus amigos y crear itinerarios increíbles, necesitamos confirmar que este es tu correo.</p>
    <div style="text-align: center; margin: 35px 0;">
        <a href="{verify_url}" style="background-color: #2EC4B6; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Verificar mi cuenta
        </a>
    </div>
    <p style="font-size: 14px; color: #64748b;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
    <p style="font-size: 12px; color: #94a3b8; word-break: break-all;">{verify_url}</p>
    """
    send_email_notification("Confirma tu correo para empezar la aventura ✈️", [email], get_email_template(body))

    return build_auth_response(new_user, 201, "Usuario creado. Revisa tu correo para verificar tu cuenta.")


# 🛡️ NUEVO: Endpoint para procesar la verificación
@api.route("/verify-email", methods=["POST"])
def verify_email():
    data = get_json_payload()
    token = data.get("token")

    if not token:
        raise APIException("Falta el token de verificación", status_code=400)

    try:
        decoded = decode_token(token)
        user_id = decoded["sub"]
        
        user = db.session.get(User, int(user_id))
        if not user:
            raise APIException("Usuario no encontrado", status_code=404)

        user.is_verified = True
        db.session.commit()

        return jsonify({"message": "¡Cuenta verificada con éxito! Ya puedes usar todas las funciones."}), 200
    except Exception as e:
        raise APIException("El enlace de verificación es inválido o ha expirado.", status_code=400)


# 🛡️ NUEVO: Endpoint para reenviar el correo de verificación
@api.route("/resend-verification", methods=["POST"])
@jwt_required()
def resend_verification():
    user = get_current_user()

    if user.is_verified:
        raise APIException("Tu cuenta ya está verificada.", status_code=400)

    verify_token = create_access_token(identity=str(user.id), expires_delta=timedelta(days=1))
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    verify_url = f"{frontend_url}/verify?token={verify_token}"

    body = f"""
    <h2 style="color: #1E3A5F; margin-top: 0;">Falta poco, {user.name}... ⏳</h2>
    <p>Nos has pedido que te reenviemos el enlace de verificación. Haz clic en el botón de abajo para activar tu cuenta al 100%.</p>
    <div style="text-align: center; margin: 35px 0;">
        <a href="{verify_url}" style="background-color: #2EC4B6; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verificar mi cuenta</a>
    </div>
    """
    send_email_notification("Reenvío de verificación - Expedition", [user.email], get_email_template(body))

    return jsonify({"message": "Correo de verificación reenviado."}), 200


# 🔔 NUEVOS ENDPOINTS PARA NOTIFICACIONES IN-APP 🔔

@api.route("/notifications", methods=["GET"])
@jwt_required()
def get_notifications():
    user = get_current_user()
    # Traemos las notificaciones del usuario, las más recientes primero
    notis = Notification.query.filter_by(user_id=user.id).order_by(Notification.date_time.desc()).all()
    return jsonify([n.serialize() for n in notis]), 200

@api.route("/notifications/read", methods=["PUT"])
@jwt_required()
def mark_notifications_read():
    user = get_current_user()
    notis = Notification.query.filter_by(user_id=user.id, is_read=False).all()
    
    for n in notis:
        n.is_read = True
        
    db.session.commit()
    return jsonify({"message": "Notificaciones marcadas como leídas"}), 200

# --------------------------------------------------


# 🔐 Endpoint que devuelve todos los viajes del usuario logueado con filtro opcional 
@api.route("/travels", methods=["GET"])
@api.route("/trips", methods=["GET"])
@jwt_required()
def travels():
    data = get_json_payload()
    state_param = data.get("state")

    user = get_current_user()
    trips_by_traveler = Traveler.query.filter_by(user_id=user.id).all()
    trip_ids = [t.trip_id for t in trips_by_traveler]

    filters = [Trip.id.in_(trip_ids)]

    if state_param:
        try:
            state_enum = StateTypes(state_param)
            filters.append(Trip.state == state_enum)
        except ValueError:
            raise ValueError(f"Invalid state: {state_param}", status_code=400)

    trips = Trip.query.filter(*filters)

    return jsonify({
        "viajes": [trip.serialize_common_trips() for trip in trips]
    }), 200


# 🔐 Endpoint que devuelve todos los datos del usuario logueado
@api.route("/profile", methods=["GET"])
@api.route("/me", methods=["GET"])
@jwt_required()
def me():
    user = get_current_user()
    return jsonify({"user": user.serialize()}), 200


# 🔐 Endpoint que registra un nuevo viaje y todos los viajeros
@api.route("/new_trip", methods=["POST"])
@api.route("/newtrip", methods=["POST"])
@jwt_required()
def new_trip():

    user = get_current_user()
    ensure_verified(user) # 🛡️ BLOQUEO

    data = get_json_payload()

    payload_users = data.get("users", [])
    users = User.query.filter(User.email.in_(payload_users)).all()
    travelers_ids = [u.id for u in users]
    travelers_ids.append(user.id)

    trip = validate_new_trip(data)

    db.session.add(trip)
    db.session.commit()
    db.session.refresh(trip)

    for traveler_id in travelers_ids:
        traveler = Traveler(
            user_id=traveler_id,
            trip_id=trip.id
        )

        db.session.add(traveler)
        db.session.commit()

    chat = Chat(
        title=trip.title,
        trip_id=trip.id
    )

    db.session.add(chat)
    db.session.commit()

    # 📧 NOTIFICACIÓN: Crear nuevo viaje
    trip_emails = get_trip_emails(trip.id)
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    body = f"""
    <h2 style="color: #1E3A5F; margin-top: 0;">¡Huele a vacaciones! 🧳</h2>
    <p>Se acaba de crear un nuevo viaje con destino a <strong>{trip.destination}</strong> y tú estás en la lista de invitados.</p>
    <p>Entra a Expedition para empezar a planificar el itinerario, hablar por el chat del grupo y organizar el presupuesto.</p>
    <div style="text-align: center; margin-top: 30px;">
        <a href="{frontend_url}/trip-details/{trip.id}" style="background-color: #2EC4B6; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Ver el viaje</a>
    </div>
    """
    send_email_notification(f"Nuevo viaje a {trip.destination} 🌴", trip_emails, get_email_template(body))

    return jsonify({
        "message": "Viaje creado correctamente",
        "trip": trip.serialize()
    }), 201


# 🔐 Endpoint que devuelve todos los detalles del viaje, itinerarios, gastos, documentos y mensajes
@api.route("/trip-detail/<int:trip_id>", methods=["GET"])
@jwt_required()
def trip_detail(trip_id):

    user = get_current_user()

    validate_user_trip(user, trip_id)

    trip = db.session.get(Trip, trip_id)
    if not trip:
        raise APIException("Viaje no encontrado", status_code=404)

    travelers_links = Traveler.query.filter_by(trip_id=trip_id).all()
    users_confirmed = [t.users.serialize() for t in travelers_links]

    itineraries = Itinerary.query.filter_by(trip_id=trip_id).order_by(Itinerary.starting_date.asc(), Itinerary.hour.asc()).all()
    expenses = Expense.query.filter_by(trip_id=trip_id).all()
    documents = Document.query.filter_by(trip_id=trip_id).all()
    
    chat = Chat.query.filter_by(trip_id=trip_id).first()
    messages_list = []
    
    if chat:
        messages = Message.query.filter_by(chat_id=chat.id).order_by(Message.date_time.asc()).all()
        for msg in messages:
            messages_list.append({
                "id": msg.id,
                "content": msg.content,
                "date_time": msg.date_time.isoformat(),
                "user_id": msg.user_id,
                "user_name": msg.authors.name 
            })

    return jsonify({
        "travelers": users_confirmed,
        "trip": trip.serialize(),
        "itinerary": [i.serialize() for i in itineraries],
        "expense": [e.serialize() for e in expenses],
        "document": [d.serialize() for d in documents],
        "messages": messages_list,
    }), 200


# 🔐 Endpoint que registra un nuevo viajero a un viaje ya creado
@api.route("/add-traveler/<int:trip_id>", methods=["POST"])
@jwt_required()
def add_traveler(trip_id):
    user = get_current_user()
    ensure_verified(user) # 🛡️ BLOQUEO
    
    # Verificamos que quien invita ya sea parte del viaje
    validate_user_trip(user, trip_id)

    data = get_json_payload()
    email = data.get("email", "").strip().lower()

    if not email:
        raise APIException("Debes proporcionar el correo electrónico del viajero", status_code=400)

    # 1. Buscamos si el usuario existe en la base de datos
    new_traveler_user = User.query.filter_by(email=email).one_or_none()
    if not new_traveler_user:
        raise APIException("No existe ningún usuario registrado con este correo", status_code=404)

    # 2. Verificamos que no esté ya en el viaje
    existing_link = Traveler.query.filter_by(user_id=new_traveler_user.id, trip_id=trip_id).one_or_none()
    if existing_link:
        raise APIException("Este usuario ya forma parte del viaje", status_code=400)

    # 3. Lo añadimos al viaje
    new_traveler = Traveler(
        user_id=new_traveler_user.id,
        trip_id=trip_id
    )
    db.session.add(new_traveler)
    
    # 🔔 CREAR LA NOTIFICACIÓN IN-APP PARA EL INVITADO
    trip = db.session.get(Trip, trip_id)
    noti = Notification(
        user_id=new_traveler_user.id,
        message=f"¡{user.name} te ha invitado al viaje: {trip.title}!"
    )
    db.session.add(noti)
    
    db.session.commit()

    # 📧 NOTIFICACIÓN: Añadir nuevos integrantes
    trip_emails = get_trip_emails(trip_id)
    body = f"""
    <h2 style="color: #1E3A5F; margin-top: 0;">¡La familia crece! 👯‍♂️</h2>
    <p>El usuario <strong>{new_traveler_user.name}</strong> acaba de unirse al viaje a {trip.destination}.</p>
    <p>¡Pasa por el chat del viaje para darle la bienvenida!</p>
    """
    send_email_notification(f"Nuevo integrante en {trip.title} 🎉", trip_emails, get_email_template(body))

    return jsonify({
        "message": "Viajero añadido correctamente al itinerario",
        "traveler": new_traveler_user.serialize()
    }), 200


# 🔐 Endpoint que registra una nueva actividad
@api.route("/new-activity/<int:trip_id>", methods=["POST"])
@jwt_required()
def new_activity(trip_id):

    user = get_current_user()
    ensure_verified(user) # 🛡️ BLOQUEO
    data = get_json_payload()

    validate_user_trip(user, trip_id)
    
    itinerary = validate_new_itinerary(data)
    itinerary.trip_id = trip_id

    db.session.add(itinerary)
    db.session.commit()
    db.session.refresh(itinerary)

    # 📧 NOTIFICACIÓN: Añadir actividad
    trip_emails = get_trip_emails(trip_id)
    trip = db.session.get(Trip, trip_id)
    body = f"""
    <h2 style="color: #1E3A5F; margin-top: 0;">¡Nuevos planes a la vista! 🗺️</h2>
    <p>Se ha añadido la actividad <strong>{itinerary.title}</strong> a vuestro itinerario en el viaje a {trip.destination}.</p>
    <p>Abre la app para ver los detalles, fechas y horarios.</p>
    """
    send_email_notification(f"Nueva actividad en {trip.title}", trip_emails, get_email_template(body))

    return jsonify({
        "message": "Actividad añadida correctamente",
        "itinerary": itinerary.serialize()
    }), 201


# 🔐 Endpoint que elimina una actividad
@api.route("/activity/<int:activity_id>", methods=["DELETE"])
@jwt_required()
def delete_activity(activity_id):
    user = get_current_user()
    ensure_verified(user) # 🛡️ BLOQUEO

    # Buscamos la actividad por su ID
    activity = db.session.get(Itinerary, activity_id)
    if not activity:
        raise APIException("Actividad no encontrada", status_code=404)

    # Verificamos que el usuario tiene permisos en el viaje asociado a esta actividad
    validate_user_trip(user, activity.trip_id)
    
    trip_id_to_notify = activity.trip_id
    activity_title = activity.title
    trip = db.session.get(Trip, trip_id_to_notify)

    # Eliminamos la actividad y guardamos los cambios
    db.session.delete(activity)
    db.session.commit()

    # 📧 NOTIFICACIÓN: Eliminar actividad
    trip_emails = get_trip_emails(trip_id_to_notify)
    body = f"""
    <h2 style="color: #1E3A5F; margin-top: 0;">Cambio de planes 🔄</h2>
    <p>La actividad <strong>{activity_title}</strong> ha sido eliminada del itinerario del viaje a {trip.destination}.</p>
    """
    send_email_notification(f"Actividad cancelada en {trip.title}", trip_emails, get_email_template(body))

    return jsonify({
        "message": "Actividad eliminada correctamente"
    }), 200


# 🔐 Endpoint que actualiza una actividad
@api.route("/activity/<int:activity_id>", methods=["PUT"])
@jwt_required()
def update_activity(activity_id):
    user = get_current_user()
    ensure_verified(user) # 🛡️ BLOQUEO
    data = get_json_payload()

    # Buscamos la actividad en la base de datos
    activity = db.session.get(Itinerary, activity_id)
    if not activity:
        raise APIException("Actividad no encontrada", status_code=404)

    # Verificamos que el usuario pertenezca al viaje de esta actividad
    validate_user_trip(user, activity.trip_id)

    # Actualizamos los campos
    activity.title = data.get("title", activity.title).strip()
    activity.destination = data.get("destination", activity.destination).strip()
    activity.hour = data.get("hour", activity.hour).strip()
    activity.starting_date = data.get("starting_date", activity.starting_date).strip()
    activity.notes = data.get("notes", activity.notes).strip()

    # Guardamos los cambios
    db.session.commit()

    return jsonify({
        "message": "Actividad actualizada correctamente",
        "itinerary": activity.serialize()
    }), 200


# 🔐 Endpoint que registra un nuevo gasto
@api.route("/new-expense/<int:trip_id>", methods=["POST"])
@jwt_required()
def new_expense(trip_id):

    user = get_current_user()
    ensure_verified(user) # 🛡️ BLOQUEO
    data = get_json_payload()

    validate_user_trip(user, trip_id)
    
    expense = validate_new_expense(data)
    expense.trip_id = trip_id

    db.session.add(expense)
    db.session.commit()
    db.session.refresh(expense)

    # Añadir una nueva deuda por cada usuario no pagador
    debtors = data.get("debtors", [])
    
    # 1. Extraemos los IDs convirtiéndolos a números
    debtors_ids = [int(debtor.get("id")) for debtor in debtors]
    
    # 2. Aseguramos que el payer_id también sea un número
    payer_id_int = int(expense.payer_id)
    
    # 3. Calculamos la cantidad (protección por si acaso la lista de deudores viene vacía)
    if len(debtors_ids) > 0:
        amount = float(expense.amount) / len(debtors_ids)
    else:
        amount = float(expense.amount)
    
    # 4. Quitamos al pagador de la lista de deudores (solo si está en la lista)
    if payer_id_int in debtors_ids:
        debtors_ids.remove(payer_id_int)

    for debtor_id in debtors_ids:
        debt = Debt(
            amount = amount,
            debtor_id = debtor_id, 
            creditor_id = payer_id_int, 
            expense_id = expense.id
        )
        db.session.add(debt)
        
    db.session.commit()

    # 📧 NOTIFICACIÓN: Añadir gasto
    trip_emails = get_trip_emails(trip_id)
    trip = db.session.get(Trip, trip_id)
    body = f"""
    <h2 style="color: #1E3A5F; margin-top: 0;">¡Gasto anotado! 💸</h2>
    <p>Se ha registrado un nuevo gasto en el bote del viaje a {trip.destination}.</p>
    <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <strong>Concepto:</strong> {expense.description}<br>
        <strong>Importe:</strong> {expense.amount} €
    </div>
    <p>Revisa la pestaña de "Gastos" en la app para ver cómo quedan los balances.</p>
    """
    send_email_notification(f"Nuevo gasto en {trip.title}", trip_emails, get_email_template(body))

    return jsonify({
        "message": "Gasto añadida correctamente",
        "expense": expense.serialize()
    }), 201


# 🔐 Endpoint que devuelve todas las actividades del viaje
@api.route("/all-activity/<int:trip_id>", methods=["GET"])
@jwt_required()
def all_activity(trip_id):

    user = get_current_user()

    validate_user_trip(user, trip_id)

    itineraries = Itinerary.query.filter_by(Itinerary.trip_id == trip_id).order_by(Itinerary.starting_date.asc()).all()

    return jsonify({
        "itinerary": [itinerary.serialize() for itinerary in itineraries]
    }), 200


# 🔐 Endpoint que registra un nuevo mensaje
@api.route("/new-message/<int:trip_id>", methods=["POST"])
@jwt_required()
def new_message(trip_id):
    user = get_current_user()
    ensure_verified(user) # 🛡️ BLOQUEO
    validate_user_trip(user, trip_id)
    
    data = get_json_payload()
    content = data.get("content", "").strip()
    
    if not content:
        raise APIException("El mensaje no puede estar vacío", status_code=400)
        
    chat = Chat.query.filter_by(trip_id=trip_id).first()
    if not chat:
        chat = Chat(title="Chat del Viaje", trip_id=trip_id)
        db.session.add(chat)
        db.session.commit()
        
    new_msg = Message(
        content=content,
        chat_id=chat.id,
        user_id=user.id
    )
    
    db.session.add(new_msg)
    db.session.commit()
    
    return jsonify({
        "message": "Mensaje enviado",
        "data": {
            "id": new_msg.id,
            "content": new_msg.content,
            "date_time": new_msg.date_time.isoformat(),
            "user_id": new_msg.user_id,
            "user_name": user.name
        }
    }), 201


# 🔐 Endpoint que devuelve todos los gastos de un viaje
@api.route("/all-expense/<int:trip_id>", methods=["GET"])
@jwt_required()
def all_expense(trip_id):

    user = get_current_user()

    validate_user_trip(user, trip_id)

    expenses = Expense.query.filter_by(Expense.trip_id == trip_id).order_by(Expense.id.desc()).all()
    expenses_ids = [expense.id for expense in expenses]

    debts = Debt.query.filter(Debt.expense_id.in_(expenses_ids)).order_by(Debt.expense_id.desc()).all()

    #DEUDAS SIMPLIFICADAS PARA EL FUTURO

    return jsonify({
        "expenses": [expense.serialize() for expense in expenses],
        "debts": [debt.serialize() for debt in debts]
    }), 200


# 🔐 Endpoint que actualiza la imagen del viaje
@api.route("/update-trip-image/<int:trip_id>", methods=["PUT"])
@jwt_required()
def update_trip_image(trip_id):
    user = get_current_user()
    ensure_verified(user) # 🛡️ BLOQUEO
    
    # Verificamos que el usuario pertenezca a este viaje
    validate_user_trip(user, trip_id)

    data = get_json_payload()
    image_data = data.get("image_url", "").strip()

    trip = db.session.get(Trip, trip_id)
    if not trip:
        raise APIException("Viaje no encontrado", status_code=404)

    # ☁️ LÓGICA CLOUDINARY INTELIGENTE
    if image_data.startswith("data:image"):
        # Si es un Base64 (archivo subido), lo manda a Cloudinary
        upload_result = cloudinary.uploader.upload(image_data, folder="trip_backgrounds")
        trip.image_url = upload_result["secure_url"]
    else:
        # Si es un texto normal, lo guarda como URL directamente
        trip.image_url = image_data

    db.session.commit()

    # 📧 NOTIFICACIÓN: Actualizar imagen
    trip_emails = get_trip_emails(trip_id)
    body = f"""
    <h2 style="color: #1E3A5F; margin-top: 0;">¡Cambio de look! 🖼️</h2>
    <p>El usuario <strong>{user.name}</strong> ha actualizado la foto de portada del viaje a {trip.destination}.</p>
    <p>Entra a la aplicación para ver lo bien que ha quedado.</p>
    """
    send_email_notification(f"Nueva portada para {trip.title} 📸", trip_emails, get_email_template(body))

    return jsonify({
        "message": "Imagen de portada actualizada correctamente",
        "image_url": trip.image_url
    }), 200


# 🔐 Endpoint que actualiza el prefil del usuario
@api.route("/update-profile", methods=["PUT"])
@jwt_required()
def update_profile():
    user = get_current_user()
    data = get_json_payload()

    # Actualizamos solo los datos que existen en el modelo
    user.name = data.get("firstName", user.name)
    user.last_name = data.get("lastName", user.last_name)
    user.email = data.get("email", user.email)

    db.session.commit()

    return jsonify({
        "message": "Perfil actualizado correctamente", 
        "user": user.serialize()
    }), 200


# 🔐 Endpoint que actualiza la contraseña del usuario
@api.route("/update-password", methods=["PUT"])
@jwt_required()
def update_password():
    user = get_current_user()
    data = get_json_payload()

    current_password = data.get("current")
    new_password = data.get("new")

    if not current_password or not new_password:
        raise APIException("Faltan datos", status_code=400)

    # Verificamos que la contraseña antigua sea correcta
    if not user.check_password(current_password):
        raise APIException("La contraseña actual es incorrecta", status_code=401)

    # Hasheamos y guardamos la nueva contraseña
    user.set_password(new_password)
    db.session.commit()

    return jsonify({"message": "Contraseña actualizada correctamente"}), 200


# 🔐 Endpoint que elimina la cuenta del usuario
@api.route("/delete-account", methods=["DELETE"])
@jwt_required()
def delete_account():
    user = get_current_user()
    
    travelers = Traveler.query.filter_by(user_id=user.id).all()

    for traveler in travelers:
        db.session.delete(traveler)

    # Eliminamos al usuario de la base de datos de forma permanente
    db.session.delete(user)
    db.session.commit()

    return jsonify({"message": "Cuenta eliminada correctamente"}), 200


# 🔐 Endpoint que elimina un gasto
@api.route("/delete-expense/<int:expense_id>", methods=['DELETE'])
@jwt_required()
def delete_expense(expense_id):
    user = get_current_user()
    ensure_verified(user) # 🛡️ BLOQUEO

    # Buscamos el gasto por su ID
    expense = db.session.get(Expense, expense_id)
    if not expense:
        raise APIException("Gasto no encontrada", status_code=404)

    # Verificamos que el usuario tiene permisos en el viaje asociado a esta gasto
    validate_user_trip(user, expense.trip_id)
    
    trip_id_to_notify = expense.trip_id
    trip = db.session.get(Trip, trip_id_to_notify)

    # Buscamos todos todas las deudas por su expense_id
    debts = Debt.query.filter_by(expense_id=expense_id).all()

    # Elimina todas las deudas
    for debt in debts:
        db.session.delete(debt)

    # Eliminamos la deuda y guardamos los cambios
    db.session.delete(expense)
    db.session.commit()

    # 📧 NOTIFICACIÓN: Eliminar gasto
    trip_emails = get_trip_emails(trip_id_to_notify)
    body = f"""
    <h2 style="color: #1E3A5F; margin-top: 0;">Ajuste de cuentas 📉</h2>
    <p>Se ha eliminado un gasto del viaje a {trip.destination}.</p>
    <p>Los balances y deudas de cada viajero se han recalculado automáticamente. Revisa la app para ver el nuevo estado de cuentas.</p>
    """
    send_email_notification(f"Gasto eliminado en {trip.title}", trip_emails, get_email_template(body))

    return jsonify({
        "message": "Gasto eliminada correctamente"
    }), 200


# 🔐 RESTAURADO: Endpoint para editar la información general del viaje
@api.route("/trip/<int:trip_id>", methods=["PUT"])
@jwt_required()
def update_trip(trip_id):
    user = get_current_user()
    ensure_verified(user) # 🛡️ BLOQUEO
    validate_user_trip(user, trip_id)
    data = get_json_payload()

    trip = db.session.get(Trip, trip_id)
    if not trip:
        raise APIException("Viaje no encontrado", status_code=404)

    # Actualizamos los campos
    trip.title = data.get("title", trip.title).strip()
    trip.destination = data.get("destination", trip.destination).strip()
    trip.budget = float(data.get("budget", trip.budget))
    trip.notes = data.get("notes", trip.notes).strip()
    trip.starting_date = data.get("starting_date", trip.starting_date)
    trip.ending_date = data.get("ending_date", trip.ending_date)
    
    # Manejo del Enum de estado
    new_state = data.get("state")
    if new_state:
        try:
            trip.state = StateTypes(new_state)
        except ValueError:
            pass # Si el estado no es válido, ignoramos el cambio de estado

    db.session.commit()

    # 📧 NOTIFICACIÓN: Cambios en el viaje
    trip_emails = get_trip_emails(trip_id)
    body = f"""
    <h2 style="color: #1E3A5F; margin-top: 0;">¡Actualización importante! ⚙️</h2>
    <p>El usuario <strong>{user.name}</strong> acaba de modificar los datos generales de vuestro viaje a {trip.destination}.</p>
    <p>Se pueden haber ajustado las fechas, el presupuesto, el destino o el estado de la aventura. ¡Entra a revisarlo!</p>
    """
    send_email_notification(f"Cambios en el viaje: {trip.title}", trip_emails, get_email_template(body))

    return jsonify({"message": "Viaje actualizado correctamente", "trip": trip.serialize()}), 200


# 🔐 RESTAURADO: Endpoint para abandonar un viaje
@api.route("/leave-trip/<int:trip_id>", methods=["DELETE"])
@jwt_required()
def leave_trip(trip_id):
    user = get_current_user()
    trip = db.session.get(Trip, trip_id)
    
    # Buscamos la relación en la tabla Traveler
    traveler_link = Traveler.query.filter_by(user_id=user.id, trip_id=trip_id).one_or_none()
    
    if not traveler_link:
        raise APIException("No formas parte de este viaje", status_code=404)

    # 📧 NOTIFICACIÓN: Alguien abandona (Opcional, antes de borrarlo)
    trip_emails = get_trip_emails(trip_id)
    body = f"""
    <h2 style="color: #1E3A5F; margin-top: 0;">Una baja en el equipo 🚶‍♂️</h2>
    <p>El usuario <strong>{user.name}</strong> ha decidido abandonar el viaje a {trip.destination}.</p>
    <p>Los balances y responsabilidades de gastos deberán reorganizarse entre los viajeros restantes.</p>
    """
    send_email_notification(f"Alguien abandonó {trip.title}", trip_emails, get_email_template(body))

    db.session.delete(traveler_link)
    db.session.commit()

    return jsonify({"message": "Has abandonado el viaje correctamente"}), 200


# 🔐 Endpoint para recuperar contraseña olvidada
@api.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = get_json_payload()
    email = data.get("email", "").strip().lower()

    if not email:
        raise APIException("Debes proporcionar un correo electrónico", status_code=400)

    user = User.query.filter_by(email=email).one_or_none()
    if not user:
        raise APIException("No existe ningún usuario con este correo", status_code=404)

    # 1. Generamos una contraseña temporal aleatoria de 8 caracteres
    temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=8))

    # 2. Actualizamos la contraseña del usuario en la base de datos
    user.set_password(temp_password)
    db.session.commit()

    # 3. Enviamos el correo
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    body = f"""
    <h2 style="color: #1E3A5F; margin-top: 0;">Recuperación de cuenta 🔑</h2>
    <p>Hola {user.name}, hemos recibido una solicitud para restablecer tu contraseña.</p>
    <p>Tu nueva clave temporal es:</p>
    <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
        <span style="font-size: 24px; font-weight: bold; color: #2EC4B6; letter-spacing: 3px;">{temp_password}</span>
    </div>
    <p>Inicia sesión con esta clave y cámbiala por una nueva desde tu perfil lo antes posible.</p>
    <div style="text-align: center; margin-top: 30px;">
        <a href="{frontend_url}/login" style="background-color: #1E3A5F; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Ir al Login</a>
    </div>
    """
    send_email_notification("Recuperación de contraseña - Expedition", [email], get_email_template(body))

    return jsonify({"message": "Te hemos enviado un correo con tu nueva contraseña temporal"}), 200


# 🔐 Endpoint para registrar y subir un documento
@api.route("/add-document/<int:trip_id>", methods=["POST"])
@jwt_required()
def add_document(trip_id):

    user = get_current_user()
    ensure_verified(user) # 🛡️ BLOQUEO
    data = get_json_payload()

    validate_user_trip(user,trip_id)

    #Sube el archivo a cloudinary
    file = data.get("document")

    upload_result = cloudinary.uploader.upload(file, folder="document")

    document = Document(
        title = str(data.get("title")),
        url = upload_result["secure_url"],
        trip_id = trip_id,
        public_id = upload_result["public_id"],
        resource_type = upload_result["resource_type"]
    )

    db.session.add(document)
    db.session.commit()

    # 📧 NUEVO: NOTIFICACIÓN DE DOCUMENTO SUBIDO
    trip_emails = get_trip_emails(trip_id)
    trip = db.session.get(Trip, trip_id)
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    body = f"""
    <h2 style="color: #1E3A5F; margin-top: 0;">¡Papeles en regla! 📄</h2>
    <p>El usuario <strong>{user.name}</strong> acaba de subir un nuevo documento importante a la carpeta compartida del viaje a {trip.destination}.</p>
    <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2EC4B6;">
        <strong>Archivo:</strong> {document.title}
    </div>
    <div style="text-align: center; margin-top: 30px;">
        <a href="{frontend_url}/trip-details/{trip.id}" style="background-color: #2EC4B6; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Ver documento</a>
    </div>
    """
    send_email_notification(f"Nuevo documento en {trip.title}", trip_emails, get_email_template(body))

    return jsonify({"message": "Se ha subido un nuevo documento con exito"}), 200


# 🔐 Endpoint para modificar un documento
@api.route("/update-document/<int:document_id>", methods=["PUT"])
@jwt_required()
def update_document(document_id):

    user = get_current_user()
    ensure_verified(user) # 🛡️ BLOQUEO
    data = get_json_payload()

    document = db.session.get(Document, document_id)
    if not document:
        raise APIException("Documento no encontrado", status_code=404)
    
    trip = db.session.get(Trip, document.trip_id)

    validate_user_trip(user, trip.id)

    old_document_title = document.title

    document.title = str(data.get("title").strip())

    db.session.commit()

    # 📧 NUEVO: NOTIFICACIÓN DE DOCUMENTO MODIFICADO
    trip_emails = get_trip_emails(document.trip_id)
    trip = db.session.get(Trip, document.trip_id)
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    body = f"""
    <h2 style="color: #1E3A5F; margin-top: 0;">¡Papeles en regla! 📄</h2>
    <p>El usuario <strong>{user.name}</strong> acaba de modificar un documento importante de la carpeta compartida del viaje a {trip.destination}.</p>
    <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2EC4B6;">
        <strong>Archivo:</strong> {old_document_title} -> {document.title}
    </div>
    <div style="text-align: center; margin-top: 30px;">
        <a href="{frontend_url}/trip-details/{trip.id}" style="background-color: #2EC4B6; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Ver documento</a>
    </div>
    """
    send_email_notification(f"Documento modificado en {trip.title}", trip_emails, get_email_template(body))

    return jsonify({"message": "Se ha modificado el documento"}), 200


# 🔐 Endpoint para eliminar un documento
@api.route("/delete-document/<int:document_id>", methods=["DELETE"])
@jwt_required()
def delete_document(document_id):

    user = get_current_user()
    ensure_verified(user) # 🛡️ BLOQUEO

    file = db.session.get(Document, document_id)
    if not file:
        raise APIException("Documento no encontrado", status_code=404)

    trip = db.session.get(Trip, file.trip_id)

    validate_user_trip(user, trip.id)

    if file.public_id:
        if file.resource_type == "raw": 
            cloudinary.uploader.destroy(
                file.public_id,
                resource_type="raw"
            )
        if file.resource_type == "image": 
            cloudinary.uploader.destroy(file.public_id)  

    # 📧 NUEVO: NOTIFICACIÓN DE DOCUMENTO ELIMINADO
    trip_emails = get_trip_emails(file.trip_id)
    trip = db.session.get(Trip, file.trip_id)
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    body = f"""
    <h2 style="color: #1E3A5F; margin-top: 0;">¡Papeles en regla! 📄</h2>
    <p>El usuario <strong>{user.name}</strong> acaba de eliminar un documento de la carpeta compartida del viaje a {trip.destination}.</p>
    <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2EC4B6;">
        <strong>Archivo:</strong> {file.title}
    </div>
    <div style="text-align: center; margin-top: 30px;">
        <a href="{frontend_url}/trip-details/{trip.id}" style="background-color: #2EC4B6; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Ver documento</a>
    </div>
    """
    send_email_notification(f"Documento modificado en {trip.title}", trip_emails, get_email_template(body))

    db.session.delete(file)
    db.session.commit()

    return jsonify({"message": "Se ha eliminado el documento"}), 200

# 🔐 Endpoint para modificar una deuda
@api.route("/update-debt/<int:debt_id>", methods=["PUT"])
@jwt_required()
def update_debt(debt_id):

    user = get_current_user()
    ensure_verified(user) # BLOQUEO
    data = get_json_payload()

    debt = db.session.get(Debt, debt_id)
    if not debt:
        raise APIException("Deuda no encontrada", status_code=404)

    expense = db.session.get(Expense, debt.expense_id)

    validate_user_trip(user, expense.trip_id)

    old_debt_amount = debt.amount

    # 🔥 ARREGLO: Cambiado [] por ()
    debt.amount = float(data.get("amount", 0.0))

    db.session.commit()

    # 📧 NUEVO: NOTIFICACIÓN DE DEUDA MODIFICADO
    trip_emails = get_trip_emails(expense.trip_id)
    trip = db.session.get(Trip, expense.trip_id)
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    body = f"""
    <h2 style="color: #1E3A5F; margin-top: 0;">¡Papeles en regla! 📄</h2>
    <p>El usuario <strong>{user.name}</strong> acaba de modificar una deuda importante de la carpeta compartida del viaje a {trip.destination}.</p>
    <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2EC4B6;">
        <strong>Gasto:</strong> {expense.description}<br>
        <strong>Deuda:</strong> {old_debt_amount} -> {debt.amount}
    </div>
    <div style="text-align: center; margin-top: 30px;">
        <a href="{frontend_url}/trip-details/{trip.id}" style="background-color: #2EC4B6; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Ver deuda</a>
    </div>
    """
    send_email_notification(f"Documento modificado en {trip.title}", trip_emails, get_email_template(body))

    return jsonify({"message": "Se ha modificado la deuda"}), 200


# 🔐 Endpoint para modificar un gasto
@api.route("/update-expense/<int:expense_id>", methods=["PUT"])
@jwt_required()
def update_expense(expense_id):

    user = get_current_user()
    ensure_verified(user) # BLOQUEO
    data = get_json_payload()

    expense = db.session.get(Expense, expense_id)
    if not expense:
        raise APIException("Gasto no encontrada", status_code=404)

    validate_user_trip(user, expense.trip_id)

    # 🔥 ARREGLO: Cambiados [] por ()
    amount = float(data.get("amount"))
    description = data.get("description")
    debtors = data.get("debtors", [])

    debtors_ids = [int(debtor.get("id")) for debtor in debtors]

    payer_id_int = int(expense.payer_id)

    old_expense = expense

    if payer_id_int in debtors_ids:
        debtors_ids.remove(payer_id_int)        

    if expense.amount != amount:
        debts = Debt.query.filter_by(expense_id=expense_id).all()
        if len(debtors_ids) > 0:
            debtors_amount = float(amount) / len(debtors_ids)
        else:
            debtors_amount = float(amount)
            
        for debt in debts:
            if debt.amount > 0:
                debt.amount = debtors_amount

    expense.amount = amount
    expense.description = description

    db.session.commit()

    # 📧 NUEVO: NOTIFICACIÓN DE DEUDA MODIFICADO
    trip_emails = get_trip_emails(expense.trip_id)
    trip = db.session.get(Trip, expense.trip_id)
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    body = f"""
    <h2 style="color: #1E3A5F; margin-top: 0;">¡Papeles en regla! 📄</h2>
    <p>El usuario <strong>{user.name}</strong> acaba de modificar un gasto importante de la carpeta compartida del viaje a {trip.destination}.</p>
    <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2EC4B6;">
        <strong>Gasto:</strong> {old_expense.description} -> {expense.description}<br>
        <strong>Cantidad:</strong> {old_expense.amount} -> {expense.amount}
    </div>
    <div style="text-align: center; margin-top: 30px;">
        <a href="{frontend_url}/trip-details/{trip.id}" style="background-color: #2EC4B6; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Ver gasto</a>
    </div>
    """
    send_email_notification(f"Gasto modificado en {trip.title}", trip_emails, get_email_template(body))


    return jsonify({"message": "Se ha modificado el gasto"}), 200