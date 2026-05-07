"""
Endpoints de autenticación: login, signup, google login, verificación, recuperación de contraseña.
"""
import os
import string
import random
from datetime import timedelta
from flask import Blueprint, jsonify
from flask_jwt_extended import (
    create_access_token,
    jwt_required,
    decode_token
)
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests


def split_name(full_name):
    """Separa el nombre completo en nombre y apellido"""
    parts = full_name.strip().split()
    if len(parts) == 0:
        return "", ""
    elif len(parts) == 1:
        return parts[0], ""
    else:
        return parts[0], " ".join(parts[1:])

from api.utils import APIException, send_email_notification
from api.helpers import get_json_payload, validate_credentials, build_auth_response, get_current_user, ensure_verified
from api.templates import get_email_template
from api.models import db, User

auth = Blueprint("auth", __name__)

# =============================================================================
# LOGIN
# =============================================================================

@auth.route("/login", methods=["POST"])
@auth.route("/signin", methods=["POST"])
def sign_in():
    """Login con email y contraseña"""
    data = get_json_payload()
    _, email, password = validate_credentials(data)

    user = User.query.filter_by(email=email).one_or_none()
    if user is None or not user.check_password(password):
        raise APIException("Email o contraseña incorrecta", status_code=401)

    return build_auth_response(user, 200, "Login correcto")

# =============================================================================
# LOGIN CON GOOGLE
# =============================================================================

@auth.route("/google-login", methods=["POST"])
def google_login():
    """Login o registro con cuenta Google"""
    data = get_json_payload()
    token = data.get("credential")

    try:
        client_id = os.getenv("GOOGLE_CLIENT_ID")
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), client_id)

        email = idinfo['email']
        name = idinfo.get('name', 'Usuario de Google')

        user = User.query.filter_by(email=email).one_or_none()

        if not user:
            first_name, last_name = split_name(name)
            user = User(email=email, name=first_name, last_name=last_name)
            user.set_password("google_oauth_random_password_xyz123")
            user.is_verified = True
            db.session.add(user)
            db.session.commit()

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

# =============================================================================
# REGISTRO
# =============================================================================

@auth.route("/sign-up", methods=["POST"])
@auth.route("/signup", methods=["POST"])
@auth.route("/register", methods=["POST"])
def sign_up():
    """Registro de nuevo usuario"""
    data = get_json_payload()
    name, email, password = validate_credentials(data, require_name=True)

    existing_user = User.query.filter_by(email=email).one_or_none()
    if existing_user is not None:
        raise APIException("Ya existe un usuario con registrado con este correo", status_code=409)

    first_name, last_name = split_name(name)

    new_user = User(
        email=email,
        name=first_name,
        last_name=last_name,
        is_verified=False
    )
    new_user.set_password(password)

    db.session.add(new_user)
    db.session.commit()

    verify_token = create_access_token(identity=str(new_user.id), expires_delta=timedelta(days=1))
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    verify_url = f"{frontend_url}/verify?token={verify_token}"

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

# =============================================================================
# VERIFICACIÓN DE EMAIL
# =============================================================================

@auth.route("/verify-email", methods=["POST"])
def verify_email():
    """Verifica el correo electrónico"""
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


@auth.route("/resend-verification", methods=["POST"])
@jwt_required()
def resend_verification():
    """Reenvía el correo de verificación"""
    user = get_current_user()

    if user.is_verified:
        raise APIException("Tu cuenta ya está verificada.", status_code=400)

    verify_token = create_access_token(identity=str(user.id), expires_delta=timedelta(days=1))
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    verify_url = f"{frontend_url}/verify?token={verify_token}"

    body = f"""
    <h2 style="color: #1E3A5F; margin-top: 0;">Falta poco, {user.name}... ⏳</h2>
    <p>Nos has pedido que te reenviados el enlace de verificación. Haz clic en el botón de abajo para activar tu cuenta al 100%.</p>
    <div style="text-align: center; margin: 35px 0;">
        <a href="{verify_url}" style="background-color: #2EC4B6; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verificar mi cuenta</a>
    </div>
    """
    send_email_notification("Reenvío de verificación - Expedition", [user.email], get_email_template(body))

    return jsonify({"message": "Correo de verificación reenviado."}), 200

# =============================================================================
# RECUPERACIÓN DE CONTRASEÑA
# =============================================================================

@auth.route("/forgot-password", methods=["POST"])
def forgot_password():
    """Envía contraseña temporal por email"""
    data = get_json_payload()
    email = data.get("email", "").strip().lower()

    if not email:
        raise APIException("Debes proporcionar un correo electrónico", status_code=400)

    user = User.query.filter_by(email=email).one_or_none()
    if not user:
        raise APIException("No existe ningún usuario con este correo", status_code=404)

    temp_password = ''.join(random.choices(string.ascii_letters + string.digits, k=8))

    user.set_password(temp_password)
    db.session.commit()

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