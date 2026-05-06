"""
Endpoints de viajes: creación, listado, detalles, agregar viajeros, abandonar.
"""
import os
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from api.utils import APIException, send_email_notification
from api.helpers import get_json_payload, get_current_user, ensure_verified, validate_user_trip, validate_new_trip, get_trip_emails
from api.templates import get_email_template
from datetime import datetime
from api.models import db, User, Trip, Traveler, Chat, Notification, StateTypes

trips = Blueprint("trips", __name__)


@trips.route("/travels", methods=["GET"])
@trips.route("/trips", methods=["GET"])
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


@trips.route("/new_trip", methods=["POST"])
@trips.route("/newtrip", methods=["POST"])
@jwt_required()
def new_trip():
    user = get_current_user()
    ensure_verified(user)

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


@trips.route("/trip-detail/<int:trip_id>", methods=["GET"])
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


@trips.route("/add-traveler/<int:trip_id>", methods=["POST"])
@jwt_required()
def add_traveler(trip_id):
    user = get_current_user()
    ensure_verified(user)
    validate_user_trip(user, trip_id)

    data = get_json_payload()
    email = data.get("email", "").strip().lower()

    if not email:
        raise APIException("Debes proporcionar el correo electrónico del viajero", status_code=400)

    new_traveler_user = User.query.filter_by(email=email).one_or_none()
    if not new_traveler_user:
        raise APIException("No existe ningún usuario registrado con este correo", status_code=404)

    existing_link = Traveler.query.filter_by(user_id=new_traveler_user.id, trip_id=trip_id).one_or_none()
    if existing_link:
        raise APIException("Este usuario ya forma parte del viaje", status_code=400)

    new_traveler = Traveler(
        user_id=new_traveler_user.id,
        trip_id=trip_id
    )
    db.session.add(new_traveler)

    trip = db.session.get(Trip, trip_id)
    noti = Notification(
        user_id=new_traveler_user.id,
        message=f"¡{user.name} te ha invitado al viaje: {trip.title}!"
    )
    db.session.add(noti)

    db.session.commit()

    trip_emails = get_trip_emails(trip_id)
    body = f"""
    <h2 style="color: #1E3A5F; margin-top: 0;">¡La familia grows! 👯‍♂️</h2>
    <p>El usuario <strong>{new_traveler_user.name}</strong> acaba de unirse al viaje a {trip.destination}.</p>
    <p>¡Pasa por el chat del viaje para darle la bienvenida!</p>
    """
    send_email_notification(f"Nuevo integrante en {trip.title} 🎉", trip_emails, get_email_template(body))

    return jsonify({
        "message": "Viajero añadido correctamente al itinerario",
        "traveler": new_traveler_user.serialize()
    }), 200


@trips.route("/update-trip-image/<int:trip_id>", methods=["PUT"])
@jwt_required()
def update_trip_image(trip_id):
    user = get_current_user()
    ensure_verified(user)
    validate_user_trip(user, trip_id)

    data = get_json_payload()
    image_data = data.get("image_url", "").strip()

    trip = db.session.get(Trip, trip_id)
    if not trip:
        raise APIException("Viaje no encontrado", status_code=404)

    if image_data.startswith("data:image"):
        upload_result = cloudinary.uploader.upload(image_data, folder="trip_backgrounds")
        trip.image_url = upload_result["secure_url"]
    else:
        trip.image_url = image_data

    db.session.commit()

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


@trips.route("/trip/<int:trip_id>", methods=["PUT"])
@jwt_required()
def update_trip(trip_id):
    user = get_current_user()
    ensure_verified(user)
    validate_user_trip(user, trip_id)
    data = get_json_payload()
    print(f"[DEBUG] PUT /trip/{trip_id} - Data received: {data}")

    trip = db.session.get(Trip, trip_id)
    if not trip:
        raise APIException("Viaje no encontrado", status_code=404)

    if data.get("title"):
        trip.title = data.get("title").strip()
    if data.get("destination"):
        trip.destination = data.get("destination").strip()
    if data.get("budget"):
        try:
            trip.budget = float(data.get("budget"))
        except (ValueError, TypeError):
            pass
    if data.get("notes"):
        trip.notes = data.get("notes").strip()
    if data.get("starting_date"):
        trip.starting_date = datetime.strptime(data.get("starting_date"), "%Y-%m-%d").date()
    if data.get("ending_date"):
        trip.ending_date = datetime.strptime(data.get("ending_date"), "%Y-%m-%d").date()

    new_state = data.get("state")
    if new_state:
        state_normalized = new_state.lower()
        try:
            trip.state = StateTypes(state_normalized)
        except ValueError:
            raise APIException(f"Estado inválido. Los estados válidos son: planning, ongoing, finished", status_code=400)

    db.session.commit()

    trip_emails = get_trip_emails(trip_id)
    body = f"""
    <h2 style="color: #1E3A5F; margin-top: 0;">¡Actualización importante! ⚙️</h2>
    <p>El usuario <strong>{user.name}</strong> acaba de modificar los datos generales de vuestro viaje a {trip.destination}.</p>
    <p>Se pueden haber ajustado las fechas, el presupuesto, el destino o el estado de la aventura. ¡Entra a revisarlo!</p>
    """
    send_email_notification(f"Cambios en el viaje: {trip.title}", trip_emails, get_email_template(body))

    return jsonify({"message": "Viaje actualizado correctamente", "trip": trip.serialize()}), 200


@trips.route("/leave-trip/<int:trip_id>", methods=["DELETE"])
@jwt_required()
def leave_trip(trip_id):
    user = get_current_user()
    trip = db.session.get(Trip, trip_id)

    traveler_link = Traveler.query.filter_by(user_id=user.id, trip_id=trip_id).one_or_none()

    if not traveler_link:
        raise APIException("No formas parte de este viaje", status_code=404)

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


@trips.route("/trip-balances/<int:trip_id>", methods=["GET"])
@jwt_required()
def get_trip_balances(trip_id):
    user = get_current_user()
    validate_user_trip(user, trip_id)

    trip = db.session.get(Trip, trip_id)
    if not trip:
        raise APIException("Viaje no encontrado", status_code=404)

    travelers = Traveler.query.filter_by(trip_id=trip_id).all()
    traveler_ids = [t.user_id for t in travelers]

    users = User.query.filter(User.id.in_(traveler_ids)).all()
    user_map = {u.id: u for u in users}

    balances = {}
    for traveler_id in traveler_ids:
        balances[traveler_id] = {
            "user": user_map[traveler_id].serialize(),
            "total_paid": 0.0,
            "total_owes": 0.0,
            "net_balance": 0.0
        }

    expenses = Expense.query.filter_by(trip_id=trip_id).all()
    for expense in expenses:
        if expense.payer_id in balances:
            balances[expense.payer_id]["total_paid"] += expense.amount

    debts = Debt.query.filter(
        Debt.expense_id.in_([e.id for e in expenses])
    ).all()

    for debt in debts:
        if debt.debtor_id in balances:
            balances[debt.debtor_id]["total_owes"] += debt.amount
        if debt.creditor_id in balances:
            balances[debt.creditor_id]["total_paid"] += debt.amount

    for traveler_id in balances:
        balances[traveler_id]["net_balance"] = balances[traveler_id]["total_paid"] - balances[traveler_id]["total_owes"]

    settlements = []
    debtors = [(uid, data["total_owes"] - data["total_paid"]) for uid, data in balances.items() if data["total_owes"] > data["total_paid"]]
    creditors = [(uid, data["total_paid"] - data["total_owes"]) for uid, data in balances.items() if data["total_paid"] > data["total_owes"]]

    debtors_sorted = sorted(debtors, key=lambda x: x[1], reverse=True)
    creditors_sorted = sorted(creditors, key=lambda x: x[1], reverse=True)

    i = j = 0
    while i < len(debtors_sorted) and j < len(creditors_sorted):
        debtor_id, debtor_amount = debtors_sorted[i]
        creditor_id, creditor_amount = creditors_sorted[j]

        transfer_amount = min(debtor_amount, creditor_amount)

        if transfer_amount > 0:
            settlements.append({
                "from": user_map[debtor_id].serialize(),
                "to": user_map[creditor_id].serialize(),
                "amount": round(transfer_amount, 2)
            })

        debtors_sorted[i] = (debtor_id, debtor_amount - transfer_amount)
        creditors_sorted[j] = (creditor_id, creditor_amount - transfer_amount)

        if debtors_sorted[i][1] <= 0:
            i += 1
        if creditors_sorted[j][1] <= 0:
            j += 1

    return jsonify({
        "balances": list(balances.values()),
        "settlements": settlements
    }), 200


import cloudinary
import cloudinary.uploader
from api.models import Itinerary, Expense, Debt, Document, Message