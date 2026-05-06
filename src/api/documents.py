"""
Endpoints de documentos compartidos.
"""
import os
import cloudinary
import cloudinary.uploader
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from api.utils import APIException, send_email_notification
from api.helpers import get_json_payload, get_current_user, ensure_verified, validate_user_trip, get_trip_emails
from api.templates import get_email_template
from api.models import db, Document, Trip

documents = Blueprint("documents", __name__)

# =============================================================================
# SUBIR DOCUMENTO
# =============================================================================

@documents.route("/add-document/<int:trip_id>", methods=["POST"])
@jwt_required()
def add_document(trip_id):
    """Sube un documento al viaje"""
    user = get_current_user()
    ensure_verified(user)
    data = get_json_payload()

    validate_user_trip(user, trip_id)

    file = data.get("document")

    upload_result = cloudinary.uploader.upload(file, folder="document")

    document = Document(
        title=str(data.get("title")),
        url=upload_result["secure_url"],
        trip_id=trip_id,
        public_id=upload_result["public_id"],
        resource_type=upload_result["resource_type"]
    )

    db.session.add(document)
    db.session.commit()

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

    return jsonify({"message": "Se ha subido un nuevo documento con éxito"}), 200


@documents.route("/update-document/<int:document_id>", methods=["PUT"])
@jwt_required()
def update_document(document_id):
    user = get_current_user()
    ensure_verified(user)
    data = get_json_payload()

    document = db.session.get(Document, document_id)
    if not document:
        raise APIException("Documento no encontrado", status_code=404)

    trip = db.session.get(Trip, document.trip_id)

    validate_user_trip(user, trip.id)

    old_document_title = document.title

    document.title = str(data.get("title").strip())

    db.session.commit()

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


@documents.route("/delete-document/<int:document_id>", methods=["DELETE"])
@jwt_required()
def delete_document(document_id):
    user = get_current_user()
    ensure_verified(user)

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