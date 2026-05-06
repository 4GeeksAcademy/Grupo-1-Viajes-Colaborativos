"""
Funciones helper compartidas por los diferentes módulos de endpoints.
"""
from flask import request
from flask_jwt_extended import get_jwt_identity
from api.utils import APIException
from api.models import db, User, Traveler, Trip


def get_json_payload():
    return request.get_json(silent=True) or {}


def get_current_user():
    identity = get_jwt_identity()
    if identity is None:
        raise APIException("Missing user identity in token", status_code=401)

    try:
        user_id = int(identity)
    except (TypeError, ValueError) as error:
        raise APIException("Invalid token identity", status_code=401) from error

    user = db.session.get(User, user_id)
    if user is None:
        raise APIException("Authenticated user was not found", status_code=404)

    return user


def ensure_verified(user):
    if not getattr(user, 'is_verified', False):
        raise APIException("Debes verificar tu correo electrónico para realizar esta acción.", status_code=403)


def validate_credentials(payload, require_name=False):
    name = payload.get("name", "").strip()
    email = payload.get("email", "").strip().lower()
    password = payload.get("password", "")

    if require_name and len(name) < 2:
        raise APIException("Name must contain at least 2 characters", status_code=400)

    if "@" not in email:
        raise APIException("Please provide a valid email address", status_code=400)

    if len(password) < 6:
        raise APIException("Password must contain at least 6 characters", status_code=400)

    return name, email, password


def validate_new_trip(payload):
    title = payload.get("title").strip()
    destination = payload.get("destination").strip()
    state = payload.get("state").strip()
    starting_date = payload.get("starting_date").strip()
    ending_date = payload.get("ending_date").strip()
    budget = payload.get("budget").strip()
    notes = payload.get("notes").strip()
    image_url = payload.get("image_url", "").strip()

    if title is None:
        raise APIException("El viaje debe contener titulo", status_code=400)

    if destination is None:
        raise APIException("El viaje debe contener destino", status_code=400)

    if state is None:
        raise APIException("El viaje debe contener estado", status_code=400)

    if starting_date is None:
        raise APIException("El viaje debe contener fecha de inicio", status_code=400)

    if ending_date is None:
        raise APIException("El viaje debe contener fecha de fin", status_code=400)

    if budget is None:
        raise APIException("El viaje debe contener un presupuesto", status_code=400)

    trip = Trip(
        title=title,
        destination=destination,
        state=state,
        starting_date=starting_date,
        ending_date=ending_date,
        budget=budget,
        notes=notes,
        image_url=image_url if image_url else None
    )

    return trip


def validate_new_itinerary(payload):
    title = payload.get("title").strip()
    destination = payload.get("destination").strip()
    hour = payload.get("hour").strip()
    starting_date = payload.get("starting_date").strip()
    notes = payload.get("notes", "").strip()

    if title is None:
        raise APIException("La actividad debe contener titulo", status_code=400)

    if destination is None:
        raise APIException("La actividad debe contener destino", status_code=400)

    if hour is None:
        raise APIException("La actividad debe contener hora", status_code=400)

    if starting_date is None:
        raise APIException("La actividad debe contener fecha", status_code=400)

    itinerary = Itinerary(
        title=title,
        destination=destination,
        hour=hour,
        starting_date=starting_date,
        notes=notes
    )

    return itinerary


def validate_new_expense(payload):
    amount = payload.get("amount")
    description = payload.get("description")
    payer_id = payload.get("payer_id")

    if amount is None:
        raise APIException("El gasto debe contener una cantidad", status_code=400)

    if description is None or str(description).strip() == "":
        raise APIException("El gasto debe contener descripcion", status_code=400)

    if payer_id is None:
        raise APIException("El gasto debe contener un pagador", status_code=400)

    expense = Expense(
        amount=float(amount),
        description=str(description).strip(),
        payer_id=int(payer_id)
    )

    return expense


def validate_user_trip(user, trip_id):
    applicant = Traveler.query.filter(
        Traveler.user_id == user.id, Traveler.trip_id == trip_id).one_or_none()
    if applicant is None:
        raise APIException("No estás incluido en este viaje", status_code=401)

    return True


def get_trip_emails(trip_id):
    travelers = Traveler.query.filter_by(trip_id=trip_id).all()
    return [t.users.email for t in travelers]


from flask_jwt_extended import create_access_token
from flask import jsonify


def build_auth_response(user, status_code, message):
    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        "message": message,
        "access_token": access_token,
        "user": user.serialize()
    }), status_code


from api.models import Itinerary, Expense


def validate_new_itinerary(payload):
    title = payload.get("title").strip()
    destination = payload.get("destination").strip()
    hour = payload.get("hour").strip()
    starting_date = payload.get("starting_date").strip()
    notes = payload.get("notes", "").strip()

    if title is None:
        raise APIException("La actividad debe contener titulo", status_code=400)

    if destination is None:
        raise APIException("La actividad debe contener destino", status_code=400)

    if hour is None:
        raise APIException("La actividad debe contener hora", status_code=400)

    if starting_date is None:
        raise APIException("La actividad debe contener fecha", status_code=400)

    itinerary = Itinerary(
        title=title,
        destination=destination,
        hour=hour,
        starting_date=starting_date,
        notes=notes
    )

    return itinerary


from api.models import Itinerary, Expense