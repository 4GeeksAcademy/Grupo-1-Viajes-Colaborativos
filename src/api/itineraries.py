"""
Endpoints de actividades del itinerario.
"""
import os
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from api.utils import APIException, send_email_notification
from api.helpers import get_json_payload, get_current_user, ensure_verified, validate_user_trip, validate_new_itinerary, get_trip_emails
from api.templates import get_email_template
from api.models import db, Itinerary, Trip

itineraries = Blueprint("itineraries", __name__)

# =============================================================================
# CREAR ACTIVIDAD
# =============================================================================

@itineraries.route("/new-activity/<int:trip_id>", methods=["POST"])
@jwt_required()
def new_activity(trip_id):
    """Añade una nueva actividad al itinerario"""
    user = get_current_user()
    ensure_verified(user)
    data = get_json_payload()

    validate_user_trip(user, trip_id)

    itinerary = validate_new_itinerary(data)
    itinerary.trip_id = trip_id

    db.session.add(itinerary)
    db.session.commit()
    db.session.refresh(itinerary)

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


@itineraries.route("/activity/<int:activity_id>", methods=["DELETE"])
@jwt_required()
def delete_activity(activity_id):
    user = get_current_user()
    ensure_verified(user)

    activity = db.session.get(Itinerary, activity_id)
    if not activity:
        raise APIException("Actividad no encontrada", status_code=404)

    validate_user_trip(user, activity.trip_id)

    trip_id_to_notify = activity.trip_id
    activity_title = activity.title
    trip = db.session.get(Trip, trip_id_to_notify)

    db.session.delete(activity)
    db.session.commit()

    trip_emails = get_trip_emails(trip_id_to_notify)
    body = f"""
    <h2 style="color: #1E3A5F; margin-top: 0;">Cambio de planes 🔄</h2>
    <p>La actividad <strong>{activity_title}</strong> ha sido eliminada del itinerario del viaje a {trip.destination}.</p>
    """
    send_email_notification(f"Actividad cancelada en {trip.title}", trip_emails, get_email_template(body))

    return jsonify({
        "message": "Actividad eliminada correctamente"
    }), 200


@itineraries.route("/activity/<int:activity_id>", methods=["PUT"])
@jwt_required()
def update_activity(activity_id):
    user = get_current_user()
    ensure_verified(user)
    data = get_json_payload()

    activity = db.session.get(Itinerary, activity_id)
    if not activity:
        raise APIException("Actividad no encontrada", status_code=404)

    validate_user_trip(user, activity.trip_id)

    activity.title = data.get("title", activity.title).strip()
    activity.destination = data.get("destination", activity.destination).strip()
    activity.hour = data.get("hour", activity.hour).strip()
    activity.starting_date = data.get("starting_date", activity.starting_date).strip()
    activity.notes = data.get("notes", activity.notes).strip()

    db.session.commit()

    return jsonify({
        "message": "Actividad actualizada correctamente",
        "itinerary": activity.serialize()
    }), 200


@itineraries.route("/all-activity/<int:trip_id>", methods=["GET"])
@jwt_required()
def all_activity(trip_id):
    user = get_current_user()

    validate_user_trip(user, trip_id)

    itineraries = Itinerary.query.filter_by(Itinerary.trip_id == trip_id).order_by(Itinerary.starting_date.asc()).all()

    return jsonify({
        "itinerary": [itinerary.serialize() for itinerary in itineraries]
    }), 200