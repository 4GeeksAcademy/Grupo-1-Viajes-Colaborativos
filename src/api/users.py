"""
Endpoints de usuario: perfil, contraseña, notificaciones.
"""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from api.utils import APIException
from api.helpers import get_json_payload, get_current_user, ensure_verified, get_trip_emails
from api.templates import get_email_template
from api.utils import send_email_notification
import os
from api.models import db, User, Notification, Traveler

users = Blueprint("users", __name__)

# =============================================================================
# PERFIL
# =============================================================================

@users.route("/profile", methods=["GET"])
@users.route("/profile", methods=["PUT"])
@users.route("/me", methods=["GET"])
@jwt_required()
def profile():
    """Obtiene o actualiza el perfil del usuario"""
    user = get_current_user()
    data = get_json_payload()
    
    if request.method == "PUT":
        ensure_verified(user)
        
        first_name = data.get("firstName", "").strip()
        last_name = data.get("lastName", "").strip()
        email = data.get("email", "").strip().lower()

        if first_name and len(first_name) < 2:
            raise APIException("El nombre debe tener al menos 2 caracteres", status_code=400)

        if email:
            if "@" not in email:
                raise APIException("El correo electrónico no es válido", status_code=400)

            existing_user = User.query.filter(User.email == email, User.id != user.id).first()
            if existing_user:
                raise APIException("Ya existe otro usuario con este correo electrónico", status_code=409)

            user.email = email

        if first_name:
            user.name = first_name

        if last_name:
            user.last_name = last_name

        db.session.commit()

        return jsonify({
            "message": "Perfil actualizado correctamente",
            "user": user.serialize()
        }), 200
    
    return jsonify({"user": user.serialize()}), 200


@users.route("/update-profile", methods=["PUT"])
@jwt_required()
def update_profile():
    """Actualiza el perfil del usuario"""
    user = get_current_user()
    ensure_verified(user)
    data = get_json_payload()

    first_name = data.get("firstName", "").strip()
    last_name = data.get("lastName", "").strip()
    email = data.get("email", "").strip().lower()

    if first_name and len(first_name) < 2:
        raise APIException("El nombre debe tener al menos 2 caracteres", status_code=400)

    if email:
        if "@" not in email:
            raise APIException("El correo electrónico no es válido", status_code=400)

        existing_user = User.query.filter(User.email == email, User.id != user.id).first()
        if existing_user:
            raise APIException("Ya existe otro usuario con este correo electrónico", status_code=409)

        user.email = email

    if first_name:
        user.name = first_name

    if last_name:
        user.last_name = last_name

    db.session.commit()

    return jsonify({
        "message": "Perfil actualizado correctamente",
        "user": user.serialize()
    }), 200

# =============================================================================
# CONTRASEÑA
# =============================================================================

@users.route("/update-password", methods=["PUT"])
@jwt_required()
def update_password():
    """Cambia la contraseña del usuario"""
    user = get_current_user()
    data = get_json_payload()

    current_password = data.get("current")
    new_password = data.get("new")

    if not current_password or not new_password:
        raise APIException("Faltan datos", status_code=400)

    if not user.check_password(current_password):
        raise APIException("La contraseña actual es incorrecta", status_code=401)

    user.set_password(new_password)
    db.session.commit()

    return jsonify({"message": "Contraseña actualizada correctamente"}), 200


@users.route("/delete-account", methods=["DELETE"])
@jwt_required()
def delete_account():
    """Elimina la cuenta del usuario"""
    user = get_current_user()

    travelers = Traveler.query.filter_by(user_id=user.id).all()

    for traveler in travelers:
        db.session.delete(traveler)

    db.session.delete(user)
    db.session.commit()

    return jsonify({"message": "Cuenta eliminada correctamente"}), 200

# =============================================================================
# NOTIFICACIONES
# =============================================================================

@users.route("/notifications", methods=["GET"])
@jwt_required()
def get_notifications():
    """Obtiene las notificaciones del usuario"""
    user = get_current_user()
    notis = Notification.query.filter_by(user_id=user.id).order_by(Notification.date_time.desc()).all()
    return jsonify([n.serialize() for n in notis]), 200


@users.route("/notifications/read", methods=["PUT"])
@jwt_required()
def mark_notifications_read():
    """Marca todas las notificaciones como leídas"""
    user = get_current_user()
    notis = Notification.query.filter_by(user_id=user.id, is_read=False).all()

    for n in notis:
        n.is_read = True

    db.session.commit()
    return jsonify({"message": "Notificaciones marcadas como leídas"}), 200


@users.route("/debug-token", methods=["GET"])
@jwt_required()
def debug_token():
    """Endpoint de debug para verificar el token"""
    user = get_current_user()
    return jsonify({
        "user_id": user.id,
        "user_email": user.email,
        "user_name": user.name,
        "is_verified": user.is_verified
    }), 200