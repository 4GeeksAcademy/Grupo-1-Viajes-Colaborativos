"""
Endpoints de gastos y deudas.
"""
import os
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from api.utils import APIException, send_email_notification
from api.helpers import get_json_payload, get_current_user, ensure_verified, validate_user_trip, validate_new_expense, get_trip_emails
from api.templates import get_email_template
from api.models import db, Expense, Debt, Trip, User

expenses = Blueprint("expenses", __name__)

# =============================================================================
# REGISTRAR GASTO
# =============================================================================

@expenses.route("/new-expense/<int:trip_id>", methods=["POST"])
@jwt_required()
def new_expense(trip_id):
    """Registra un nuevo gasto en el viaje"""
    user = get_current_user()
    ensure_verified(user)
    data = get_json_payload()

    validate_user_trip(user, trip_id)

    expense = validate_new_expense(data)
    expense.trip_id = trip_id

    db.session.add(expense)
    db.session.commit()
    db.session.refresh(expense)

    debtors = data.get("debtors", [])
    debtors_ids = [int(debtor.get("id")) for debtor in debtors]
    payer_id_int = int(expense.payer_id)

    if len(debtors_ids) > 0:
        amount = float(expense.amount) / len(debtors_ids)
    else:
        amount = float(expense.amount)

    if payer_id_int in debtors_ids:
        debtors_ids.remove(payer_id_int)

    for debtor_id in debtors_ids:
        debt = Debt(
            amount=amount,
            debtor_id=debtor_id,
            creditor_id=payer_id_int,
            expense_id=expense.id
        )
        db.session.add(debt)

    db.session.commit()

    trip_emails = get_trip_emails(trip_id)
    trip = db.session.get(Trip, trip_id)
    body = f"""
    <h2 style="color: #1E3A5F; margin-top: 0;">¡Gasto anotado! 💸</h2>
    <p>Se ha registrado un nuevo gasto en el viaje a {trip.destination}.</p>
    <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <strong>Concepto:</strong> {expense.description}<br>
        <strong>Importe:</strong> {expense.amount} €
    </div>
    <p>Revisa la pestaña de "Gastos" en la app para ver cómo quedan los balances.</p>
    """
    send_email_notification(f"Nuevo gasto en {trip.title}", trip_emails, get_email_template(body))

    return jsonify({
        "message": "Gasto añadido correctamente",
        "expense": expense.serialize()
    }), 201


@expenses.route("/all-expense/<int:trip_id>", methods=["GET"])
@jwt_required()
def all_expense(trip_id):
    """Lista todos los gastos del viaje"""
    user = get_current_user()

    validate_user_trip(user, trip_id)

    expenses = Expense.query.filter_by(Expense.trip_id == trip_id).order_by(Expense.id.desc()).all()
    expenses_ids = [expense.id for expense in expenses]

    debts = Debt.query.filter(Debt.expense_id.in_(expenses_ids)).order_by(Debt.expense_id.desc()).all()

    return jsonify({
        "expenses": [expense.serialize() for expense in expenses],
        "debts": [debt.serialize() for debt in debts]
    }), 200


@expenses.route("/update-expense/<int:expense_id>", methods=["PUT"])
@jwt_required()
def update_expense(expense_id):
    user = get_current_user()
    ensure_verified(user)
    data = get_json_payload()

    expense = db.session.get(Expense, expense_id)
    if not expense:
        raise APIException("Gasto no encontrado", status_code=404)

    validate_user_trip(user, expense.trip_id)

    amount = data.get("amount")
    if amount is None:
        raise APIException("El gasto debe contener una cantidad", status_code=400)

    amount = float(amount)
    description = data.get("description")
    if not description or str(description).strip() == "":
        raise APIException("El gasto debe contener descripción", status_code=400)

    debtors = data.get("debtors", [])
    debtors_ids = [int(debtor.get("id")) for debtor in debtors]
    payer_id_int = int(expense.payer_id)

    old_expense = expense

    if payer_id_int in debtors_ids:
        debtors_ids.remove(payer_id_int)

    existing_debts = Debt.query.filter_by(expense_id=expense_id).all()
    existing_debtor_ids = {debt.debtor_id for debt in existing_debts}
    new_debtor_ids = set(debtors_ids)

    if len(debtors_ids) > 0:
        debtors_amount = amount / len(debtors_ids)
    else:
        debtors_amount = amount

    debts_to_delete = existing_debtor_ids - new_debtor_ids
    for debt in existing_debts:
        if debt.debtor_id in debts_to_delete:
            db.session.delete(debt)

    debts_to_add = new_debtor_ids - existing_debtor_ids
    for debtor_id in debts_to_add:
        new_debt = Debt(
            amount=debtors_amount,
            debtor_id=debtor_id,
            creditor_id=payer_id_int,
            expense_id=expense_id
        )
        db.session.add(new_debt)

    for debt in existing_debts:
        if debt.debtor_id not in debts_to_delete:
            if expense.amount != amount or len(debtors_ids) != len(existing_debts):
                debt.amount = debtors_amount

    expense.amount = amount
    expense.description = str(description).strip()

    db.session.commit()

    trip_emails = get_trip_emails(expense.trip_id)
    trip = db.session.get(Trip, expense.trip_id)
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    body = f"""
    <h2 style="color: #1E3A5F; margin-top: 0;">¡Papeles en regla! 📄</h2>
    <p>El usuario <strong>{user.name}</strong> acaba de modificar un gasto importante de la carpeta compartida del viaje a {trip.destination}.</p>
    <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2EC4B6;">
        <strong>Gasto:</strong> {old_expense.description} -> {expense.description}<br>
        <strong>Cantidad:</strong> {old_expense.amount} -> {expense.amount}
    </div>
    <div style="text-align: center; margin-top: 30px;">
        <a href="{frontend_url}/trip-details/{trip.id}" style="background-color: #2EC4B6; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Ver gasto</a>
    </div>
    """
    send_email_notification(f"Gasto modificado en {trip.title}", trip_emails, get_email_template(body))

    return jsonify({"message": "Se ha modificado el gasto"}), 200


@expenses.route("/delete-expense/<int:expense_id>", methods=['DELETE'])
@jwt_required()
def delete_expense(expense_id):
    user = get_current_user()
    ensure_verified(user)

    expense = db.session.get(Expense, expense_id)
    if not expense:
        raise APIException("Gasto no encontrado", status_code=404)

    validate_user_trip(user, expense.trip_id)

    trip_id_to_notify = expense.trip_id
    trip = db.session.get(Trip, trip_id_to_notify)

    debts = Debt.query.filter_by(expense_id=expense_id).all()

    for debt in debts:
        db.session.delete(debt)

    db.session.delete(expense)
    db.session.commit()

    trip_emails = get_trip_emails(trip_id_to_notify)
    body = f"""
    <h2 style="color: #1E3A5F; margin-top: 0;">Ajuste de cuentas 📉</h2>
    <p>Se ha eliminado un gasto del viaje a {trip.destination}.</p>
    <p>Los balances y deudas de cada viajero se han recalculado automáticamente. Revisa la app para ver el nuevo estado de cuentas.</p>
    """
    send_email_notification(f"Gasto eliminado en {trip.title}", trip_emails, get_email_template(body))

    return jsonify({
        "message": "Gasto eliminado correctamente"
    }), 200


@expenses.route("/update-debt/<int:debt_id>", methods=["PUT"])
@jwt_required()
def update_debt(debt_id):
    user = get_current_user()
    ensure_verified(user)
    data = get_json_payload()

    debt = db.session.get(Debt, debt_id)
    if not debt:
        raise APIException("Deuda no encontrada", status_code=404)

    expense = db.session.get(Expense, debt.expense_id)

    validate_user_trip(user, expense.trip_id)

    old_debt_amount = debt.amount

    debt.amount = float(data.get("amount", 0.0))

    db.session.commit()

    trip_emails = get_trip_emails(expense.trip_id)
    trip = db.session.get(Trip, expense.trip_id)
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    body = f"""
    <h2 style="color: #1E3A5F; margin-top: 0;">¡Papeles en regla! 📄</h2>
    <p>El usuario <strong>{user.name}</strong> acaba de modificar una deuda importante de la carpeta compartida del viaje a {trip.destination}.</p>
    <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2EC4B6;">
        <strong>Gasto:</strong> {expense.description}<br>
        <strong>Deuda:</strong> {old_debt_amount} -> {debt.amount}
    </div>
    <div style="text-align: center; margin-top: 30px;">
        <a href="{frontend_url}/trip-details/{trip.id}" style="background-color: #2EC4B6; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Ver deuda</a>
    </div>
    """
    send_email_notification(f"Documento modificado en {trip.title}", trip_emails, get_email_template(body))

    return jsonify({"message": "Se ha modificado la deuda"}), 200


@expenses.route("/pay-debt/<int:debt_id>", methods=["PUT"])
@jwt_required()
def pay_debt(debt_id):
    user = get_current_user()
    ensure_verified(user)

    debt = db.session.get(Debt, debt_id)
    if not debt:
        raise APIException("Deuda no encontrada", status_code=404)

    expense = db.session.get(Expense, debt.expense_id)
    if not expense:
        raise APIException("Gasto asociado no encontrado", status_code=404)

    validate_user_trip(user, expense.trip_id)

    if debt.debtor_id != user.id:
        raise APIException("No tienes permiso para pagar esta deuda", status_code=403)

    old_amount = debt.amount

    debt.amount = 0.0

    db.session.commit()

    trip = db.session.get(Trip, expense.trip_id)
    creditor = db.session.get(User, debt.creditor_id)

    if creditor:
        trip_emails = get_trip_emails(trip.id)
        body = f"""
        <h2 style="color: #1E3A5F; margin-top: 0;">¡Deuda saldada! 💰</h2>
        <p>El usuario <strong>{user.name}</strong> ha pagado su deuda del gasto "<strong>{expense.description}</strong>" en el viaje a {trip.destination}.</p>
        <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <strong>Monto:</strong> {old_amount} €
        </div>
        """
        send_email_notification(f"Pago recibido en {trip.title}", trip_emails, get_email_template(body))

    return jsonify({"message": "Deuda pagada correctamente"}), 200