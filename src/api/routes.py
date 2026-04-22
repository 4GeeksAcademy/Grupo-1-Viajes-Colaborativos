"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
import os
import string
import random
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

import enum
from sqlalchemy import func
from collections import defaultdict
from api.models import db, User, Trip, Traveler, Itinerary, Expense, Debt, Document, Chat, Message, StateTypes, CategoryTypes

api = Blueprint("api", __name__)

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
#         ENDPOINTS
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
            send_email_notification(
                "¡Bienvenido a Expedition!", 
                [email], 
                f"<h1>Hola {name}</h1><p>Gracias por unirte a Expedition con Google.</p>"
            )

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
    send_email_notification(
        "Verifica tu cuenta - Expedition", 
        [email], 
        f"""
        <div style="font-family: sans-serif; color: #1E3A5F;">
            <h1>¡Bienvenido a Expedition, {name}!</h1>
            <p>Tu cuenta ha sido creada exitosamente. Para poder crear viajes y gestionar gastos, necesitamos verificar tu correo.</p>
            <br>
            <a href="{verify_url}" style="background-color: #2EC4B6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Verificar mi cuenta
            </a>
            <br><br>
            <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
            <p style="font-size: 0.8rem; color: #64748b;">{verify_url}</p>
        </div>
        """
    )

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

    send_email_notification(
        "Verifica tu cuenta - Expedition", 
        [user.email], 
        f"""
        <div style="font-family: sans-serif; color: #1E3A5F;">
            <h2>Verificación de correo</h2>
            <p>Haz clic en el botón de abajo para verificar tu cuenta de Expedition.</p>
            <a href="{verify_url}" style="background-color: #2EC4B6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verificar mi cuenta</a>
        </div>
        """
    )

    return jsonify({"message": "Correo de verificación reenviado."}), 200


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
    send_email_notification(
        f"Nuevo Viaje: {trip.title}", 
        trip_emails, 
        f"<h3>¡Prepara las maletas!</h3><p>Se ha creado un nuevo viaje a {trip.destination}. Entra a Expedition para ver los detalles.</p>"
    )

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
    db.session.commit()

    # 📧 NOTIFICACIÓN: Añadir nuevos integrantes
    trip_emails = get_trip_emails(trip_id)
    send_email_notification(
        "¡Nuevo viajero en el equipo!", 
        trip_emails, 
        f"<p>El usuario <b>{new_traveler_user.name}</b> se ha unido al viaje. ¡Salúdenlo en el chat!</p>"
    )

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
    send_email_notification(
        "Nueva Actividad Añadida", 
        trip_emails, 
        f"<p>Se ha añadido la actividad <b>{itinerary.title}</b> a tu itinerario.</p>"
    )

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

    # Eliminamos la actividad y guardamos los cambios
    db.session.delete(activity)
    db.session.commit()

    # 📧 NOTIFICACIÓN: Eliminar actividad
    trip_emails = get_trip_emails(trip_id_to_notify)
    send_email_notification(
        "Actividad Cancelada", 
        trip_emails, 
        "<p>Una actividad ha sido eliminada del itinerario.</p>"
    )

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
    send_email_notification(
        "Nuevo Gasto Añadido", 
        trip_emails, 
        f"<p>Se ha registrado un nuevo gasto: <b>{expense.description}</b> por {expense.amount}€.</p>"
    )

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
    new_image_url = data.get("image_url", "").strip()

    trip = db.session.get(Trip, trip_id)
    if not trip:
        raise APIException("Viaje no encontrado", status_code=404)

    # Actualizamos la URL y guardamos
    trip.image_url = new_image_url
    db.session.commit()

    # 📧 NOTIFICACIÓN: Actualizar imagen
    trip_emails = get_trip_emails(trip_id)
    send_email_notification(
        "Imagen de Viaje Actualizada", 
        trip_emails, 
        f"<p>¡La portada de tu viaje a {trip.destination} tiene un nuevo look!</p>"
    )

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
    send_email_notification(
        "Gasto Eliminado", 
        trip_emails, 
        "<p>Se ha eliminado un gasto y se han recalculado los balances.</p>"
    )

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
    send_email_notification(
        f"Actualización en el viaje: {trip.title}", 
        trip_emails, 
        f"<p>El usuario <b>{user.name}</b> ha actualizado los detalles generales del viaje (fechas, presupuesto o destino). Revisa los cambios en la app.</p>"
    )

    return jsonify({"message": "Viaje actualizado correctamente", "trip": trip.serialize()}), 200


# 🔐 RESTAURADO: Endpoint para abandonar un viaje
@api.route("/leave-trip/<int:trip_id>", methods=["DELETE"])
@jwt_required()
def leave_trip(trip_id):
    user = get_current_user()
    
    # Buscamos la relación en la tabla Traveler
    traveler_link = Traveler.query.filter_by(user_id=user.id, trip_id=trip_id).one_or_none()
    
    if not traveler_link:
        raise APIException("No formas parte de este viaje", status_code=404)

    # 📧 NOTIFICACIÓN: Alguien abandona (Opcional, antes de borrarlo)
    trip_emails = get_trip_emails(trip_id)
    send_email_notification(
        "Un viajero ha dejado el grupo", 
        trip_emails, 
        f"<p>El usuario <b>{user.name}</b> ha decidido abandonar el viaje.</p>"
    )

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
    send_email_notification(
        "Recuperación de contraseña - Expedition",
        [email],
        f"""
        <div style="font-family: sans-serif; color: #1E3A5F;">
            <h2>Recuperación de contraseña</h2>
            <p>Hola {user.name},</p>
            <p>Se ha solicitado un restablecimiento de contraseña para tu cuenta.</p>
            <p>Tu nueva contraseña temporal es: <strong style="color: #2EC4B6; font-size: 1.2rem;">{temp_password}</strong></p>
            <p>Por favor, inicia sesión con esta contraseña y cámbiala por una nueva desde tu perfil lo antes posible.</p>
        </div>
        """
    )

    return jsonify({"message": "Te hemos enviado un correo con tu nueva contraseña temporal"}), 200