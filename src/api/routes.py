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
from sqlalchemy import func
from collections import defaultdict
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
        title=title,
        destination=destination,
        state=state,
        starting_date=starting_date,
        ending_date=ending_date,
        budget=budget,
        notes=notes
    )

    return trip


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

def validate_new_expense(payload):
    amount = payload.get("amount").strip()
    description = payload.get("description").strip()
    payer_id = payload.get("payer_id").strip()

    if amount is None:
        raise APIException(
            "El gasto debe contener una cantidad", status_code=400)
    
    if description is None:
        raise APIException(
            "El gasto debe contener descripcion", status_code=400)
    
    if payer_id is None:
        raise APIException(
            "El gasto debe contener un pagador", status_code=400)

    expense = Expense(
        amount = amount,
        description = description,
        payer_id = payer_id
    )

    return expense

def validate_user_trip(user, trip_id):
        
    applicant = Traveler.query.filter(
        Traveler.user_id == user.id, Traveler.trip_id == trip_id).one_or_none()
    if applicant is None:
        raise APIException(
            "No estás incluido en este viaje", status_code=401)
    
    return True

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


@api.route("/new_trip", methods=["POST"])
@api.route("/newtrip", methods=["POST"])
@jwt_required()
def new_trip():

    user = get_current_user()
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

    # CORREO INFORMATIVO PENDIENTE

    return jsonify({
        "message": "Viaje creado correctamente",
        "trip": trip.serialize()
    }), 201


@api.route("/trip-detail/<int:trip_id>", methods=["GET"])
@jwt_required()
def trip_detail(trip_id):

    user = get_current_user()

    validate_user_trip(user, trip_id)

    travelers = Traveler.query.filter_by(Traveler.trip_id == trip_id).all
    travelers = [traveler.serialize_user() for traveler in travelers]

    travelers_confirmed = User.query.filter_by(User.id.in_(travelers))
    travelers_confirmed.append(user)
    users_confirmed = [users.serialize_name() for users in travelers_confirmed]

    trip = Trip.query.filter_by(Trip.id == trip_id)
    itinerary = Itinerary.query.filter_by(
        Itinerary.trip_id == trip_id).limit(5).all()
    expense = Expense.query.filter_by(
        Expense.trip_id == trip_id).limit(5).all()
    document = Document.query.filter_by(Document.trip_id == trip_id).all()
    chat = Chat.query.filter_by(Chat.trip_id == trip_id)
    messages = Message.query.filter_by(
        Message.chat_id == chat.id).limit(20).all()

    return jsonify({
        "travelers": users_confirmed,
        "trip": trip.serialize(),
        "itinerary": itinerary.serialize(),
        "expense": expense.serialize(),
        "document": document.serialize(),
        "messages": messages.serialize(),
    }), 200


@api.route("/new-activity/<int:trip_id>", methods=["POST"])
@jwt_required()
def new_activity(trip_id):

    user = get_current_user()
    data = get_json_payload()

    validate_user_trip(user, trip_id)
    
    itinerary = validate_new_itinerary(data)
    itinerary.trip_id = trip_id

    db.session.add(itinerary)
    db.session.commit()
    db.session.refresh(itinerary)

    # CORREO INFORMATIVO PENDIENTE

    return jsonify({
        "message": "Actividad añadida correctamente",
        "itinerary": itinerary.serialize()
    }), 201


@api.route("/new-expense/<int:trip_id>", methods=["POST"])
@jwt_required()
def new_expense(trip_id):

    user = get_current_user()
    data = get_json_payload()

    validate_user_trip(user, trip_id)
    
    expense = validate_new_expense(data)
    expense.trip_id = trip_id

    db.session.add(expense)
    db.session.commit()
    db.session.refresh(expense)

    # añadir una nueva deuda por cada usuario no pagador
    debtors = data.get("debtors", [])
    debtors = [debtor.id for debtor in debtors]
    amount = expense.amount / len(debtors)
    debtors.remove(expense.payer_id)

    for debtor in debtors:
        debt = Debt(
            amount = amount,
            debtor_id = debtor,
            creditor_id = expense.payer_id,
            expense_id = expense.id
        )

        db.session.add(debt)
        db.session.commit()

    # CORREO INFORMATIVO PENDIENTE

    return jsonify({
        "message": "Gasto añadida correctamente",
        "expense": expense.serialize()
    }), 201


@api.route("/all-activity/<int:trip_id>", methods=["GET"])
@jwt_required()
def all_activity(trip_id):

    user = get_current_user()

    validate_user_trip(user, trip_id)

    itineraries = Itinerary.query.filter_by(Itinerary.trip_id == trip_id).order_by(Itinerary.starting_date.asc()).all()

    return jsonify({
        "itinerary": [itinerary.serialize() for itinerary in itineraries]
    }), 200


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


# ENDPOINT QUE MODIFICA LOS DATOS DEL USUARIO
# 1º: recibe el JWT y saca el usuario

# 2º: debe recibir el tipo de modificacion (perfil o contraseña) y los datos a modificar

# 3º: modifica los datos necesarios

# 4º: devuelve los datos actualizados del usuario


# ENDPOINT QUE CREA EL PDF DEL ITIENERARIO COMPLETO


# ENDPOINT QUE CREA EL PDF DE LOS GASTOS COMPLETOS
