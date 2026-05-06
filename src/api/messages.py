"""
Endpoints de mensajes del chat.
"""
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from api.utils import APIException
from api.helpers import get_json_payload, get_current_user, ensure_verified, validate_user_trip
from api.models import db, Chat, Message

messages = Blueprint("messages", __name__)

# =============================================================================
# ENVIAR MENSAJE
# =============================================================================

@messages.route("/new-message/<int:trip_id>", methods=["POST"])
@jwt_required()
def new_message(trip_id):
    """Envía un mensaje al chat del viaje"""
    user = get_current_user()
    ensure_verified(user)
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