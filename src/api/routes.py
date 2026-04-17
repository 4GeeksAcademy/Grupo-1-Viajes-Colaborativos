"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    get_jwt_identity,
    jwt_required
)

import enum

from api.models import db, User, Trip, Traveler, Itinerary, Expense, Debt, Document, Chat, Message, StateTypes, CategoryTypes
from api.utils import APIException


api = Blueprint("api", __name__)


def get_json_payload():
    return request.get_json(silent=True) or {}


def build_auth_response(user, status_code, message):
    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        "message": message,
        "access_token": access_token,
        "user": user.serialize()
    }), status_code


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

def validate_new_trip(payload):

    title = payload.get("title").strip()
    destination = payload.get("destination").strip()
    state = payload.get("state").strip()
    starting_date = payload.get("starting_date").strip()
    ending_date = payload.get("ending_date").strip()
    budget = payload.get("budget").strip()
    notes = payload.get("notes").strip()    

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
        title = title,
        destination = destination,
        state = state,
        starting_date = starting_date,
        ending_date = ending_date,
        budget = budget,
        notes = notes
    )

    return trip


@api.route("/login", methods=["POST"])
@api.route("/signin", methods=["POST"])
def sign_in():
    data = get_json_payload()
    _, email, password = validate_credentials(data)

    user = User.query.filter_by(email=email).one_or_none()
    if user is None or not user.check_password(password):
        raise APIException("Email o contraseña incorrecta", status_code=401)

    return build_auth_response(user, 200, "Login correcto")


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
        name=name
    )
    new_user.set_password(password)

    db.session.add(new_user)
    db.session.commit()

    return build_auth_response(new_user, 201, "Usuario creado correctamente")



@api.route("/travels", methods=["GET"])
@api.route("/trips", methods=["GET"])
@jwt_required
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

@api.route("/profile", methods=["GET"])
@api.route("/me", methods=["GET"])
@jwt_required()
def me():
    user = get_current_user()
    return jsonify({"user": user.serialize()}), 200


# ENDPOINT QUE REGISTRA UN NUEVO VIAJE
# 1º: recibe el JWT y saca el usuario

# 2º: debe recibir el titulo, el destino, el estado (por defecto será planning), la fecha de inicio, 
# la fecha de fin, el presupuesto, notas (opcional), los usuarios extra del viaje

# 3º: debe registrar un nuevo Trip, un nuevo Traveler por cada usuario extra y un nuevo Chat

# 4º: debe enviar un correo informativo a los usuarios del viaje

# 5º: HACER MIGRATE Y UPDATE
@api.route("/new_trip", methods=["POST"])
@api.route("/newtrip", methods=["POST"])
@jwt_required()
def new_trip():
    
    user = get_current_user()
    data = get_json_payload()

    payload_users = data.get("users", [])
    users = User.query.filter(User.email.in_(payload_users))
    travelers_ids = [u.id for u in users]
    travelers_ids.append(user.id)

    trip = validate_new_trip(data)

    db.session.add(trip)
    db.session.commit()
    db.session.refresh(trip)

    for traveler_id in travelers_ids:
        traveler = Traveler(
            user_id = traveler_id,
            trip_id = trip.id
        )

        db.session.add(traveler)
        db.session.commit()

    chat = Chat(
        title = trip.title,
        trip_id = trip.id
    )

    db.session.add(chat)
    db.session.commit()

    # CORREO INFORMATIVO PENDIENTE

    return jsonify({
        "message": "Viaje creado correctamente",
        "trip": trip.serialize()
    }), 201


# ENDPOINT QUE DEVUELVE TODA LA INFORMACION DEL VIAJE
# 1º: recibe el id del viaje, el JWT y saca el usuario

# 2º: comprueba que el usuario está registrado en el viaje desde la tabla Traveler

# 3º: debe devolver todos los datos del viaje, todos los itinerarios, todos los gastos, todos los documentos y todos los mensajes del chat



# ENDPOINT QUE REGISTRA UNA NUEVA ACTIVIDAD DEL VIAJE
# 1º: recibe el id del viaje, el JWT y saca el usuario

# 2º: comprueba que el usuario está registrado en el viaje desde la tabla Traveler

# 3º: debe recibir el titulo, el destino, la hora, la fecha, y las notas (opcional)

# 4º: debe enviar un correo informativo a los usuarios del viaje



# ENDPOINT QUE REGISTRA UN NUEVO GASTO
# 1º: recibe el id del viaje, el JWT y saca el usuario

# 2º: comprueba que el usuario está registrado en el viaje desde la tabla Traveler

# 3º: debe recibir la cantidad, la descripcion, el id del pagador y los usuarios a pagar

# 4º: debe registrar el pago en la cantidad en la tabla Expense y regresar el id

# 5º: debe registrar una deuda en la tabla Debt por cada usuario a pagar


# ENDPOINT QUE DEVUELVE TODOS LOS ITINERARIOS DEL VIAJE
# 1º: recibe el id del viaje, el JWT y saca el usuario

# 2º: comprueba que el usuario está registrado en el viaje desde la tabla Traveler

# 3º: devuelve todos los itinerarios del viaje desde la tabla Itinerary


# ENDPOINT QUE DEVUELVE TODOS LOS GASTOS DEL VIAJE
# 1º: recibe el id del viaje, el JWT y saca el usuario

# 2º: comprueba que el usuario está registrado en el viaje desde la tabla Traveler

# 3º: comprueba todas las deudas del viaje

# 4º: hacer cuentas de la division de deudas

# 5º: devuelve todos los gastos del viaje desde la tabla Expense y todas las deudas


# ENDPOINT QUE MODIFICA LOS DATOS DEL USUARIO
# 1º: recibe el JWT y saca el usuario

# 2º: debe recibir el tipo de modificacion (perfil o contraseña) y los datos a modificar

# 3º: modifica los datos necesarios

# 4º: devuelve los datos actualizados del usuario


# ENDPOINT QUE CREA EL PDF DEL ITIENERARIO COMPLETO


# ENDPOINT QUE CREA EL PDF DE LOS GASTOS COMPLETOS