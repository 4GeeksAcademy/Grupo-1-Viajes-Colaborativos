import enum
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import String, Boolean, Enum, Date, Integer, ForeignKey, Float, Time, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import date, time, datetime

db = SQLAlchemy()

# --- ENUMS ---
class StateTypes(enum.Enum):
    FINISHED = "finished"
    ONGOING = "ongoing"
    PLANNING = "planning"

# --- MODELOS ---

class User(db.Model):
    __tablename__ = 'user'
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(20), nullable=False)
    last_name: Mapped[str] = mapped_column(String(50), nullable=False)
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(nullable=False)
    
    # Relaciones
    viajeros = relationship("Viajero", back_populates="users")
    gastos_pagados = relationship("Gasto", back_populates="pagador")
    mensajes = relationship("Mensaje", back_populates="autor")
    deudas_pendientes = relationship("Deuda", foreign_keys="[Deuda.id_deudor]", back_populates="deudor")
    deudas_a_cobrar = relationship("Deuda", foreign_keys="[Deuda.id_acreedor]", back_populates="acreedor")

    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "last_name": self.last_name,
            "email": self.email
        }

class Viaje(db.Model):
    __tablename__ = 'viaje'
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(30), nullable=False)
    destination: Mapped[str] = mapped_column(String(50), nullable=False)
    state: Mapped[StateTypes] = mapped_column(Enum(StateTypes), nullable=False)
    starting_date: Mapped[date] = mapped_column(Date(), nullable=False)
    ending_date: Mapped[date] = mapped_column(Date(), nullable=False)
    budget: Mapped[float] = mapped_column(Float, nullable=False)
    notes: Mapped[str] = mapped_column(String(150), nullable=False)

    # Relaciones
    viajeros = relationship("Viajero", back_populates="viajes")
    itinerarios = relationship("Itinerario", back_populates="viajes")
    gastos = relationship("Gasto", back_populates="viajes")
    documentos = relationship("Documento", back_populates="viajes")
    chat = relationship("Chat", back_populates="viajes", uselist=False)

    def serialize(self):
        return {
            "id": self.id,
            "title": self.title,
            "destination": self.destination,
            "state": self.state.value,
            "starting_date": str(self.starting_date),
            "ending_date": str(self.ending_date),
            "budget": self.budget,
            "notes": self.notes
        }

class Viajero(db.Model):
    __tablename__ = 'viajero'
    id_user: Mapped[int] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"), primary_key=True)
    id_viaje: Mapped[int] = mapped_column(ForeignKey("viaje.id", ondelete="CASCADE"), primary_key=True)

    users = relationship("User", back_populates="viajeros")
    viajes = relationship("Viaje", back_populates="viajeros")

    def serialize(self):
        return {
            "id_user": self.id_user,
            "id_viaje": self.id_viaje
        }

class Itinerario(db.Model):
    __tablename__ = 'itinerario'
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(30), nullable=False)
    destination: Mapped[str] = mapped_column(String(50), nullable=False)
    hour: Mapped[time] = mapped_column(Time, nullable=False)
    starting_date: Mapped[date] = mapped_column(Date(), nullable=False)
    notes: Mapped[str] = mapped_column(String(150), nullable=False)
    id_viaje: Mapped[int] = mapped_column(ForeignKey("viaje.id", ondelete="CASCADE"))

    viajes = relationship("Viaje", back_populates="itinerarios")

    def serialize(self):
        return {
            "id": self.id,
            "title": self.title,
            "hour": str(self.hour),
            "id_viaje": self.id_viaje
        }

class Gasto(db.Model):
    __tablename__ = 'gasto'
    id: Mapped[int] = mapped_column(primary_key=True)
    monto: Mapped[float] = mapped_column(Float, nullable=False)
    descripcion: Mapped[str] = mapped_column(String(100), nullable=False)
    id_viaje: Mapped[int] = mapped_column(ForeignKey("viaje.id", ondelete="CASCADE"))
    id_pagador: Mapped[int] = mapped_column(ForeignKey("user.id"))
    
    viajes = relationship("Viaje", back_populates="gastos")
    pagador = relationship("User", back_populates="gastos_pagados")
    deudas = relationship("Deuda", back_populates="gastos")

    def serialize(self):
        return {"id": self.id, "monto": self.monto, "descripcion": self.descripcion}

class Deuda(db.Model):
    __tablename__ = 'deuda'
    id: Mapped[int] = mapped_column(primary_key=True)
    importe: Mapped[float] = mapped_column(Float, nullable=False)
    id_deudor: Mapped[int] = mapped_column(ForeignKey("user.id"))
    id_acreedor: Mapped[int] = mapped_column(ForeignKey("user.id"))
    id_gasto: Mapped[int] = mapped_column(ForeignKey("gasto.id"))

    gastos = relationship("Gasto", back_populates="deudas")
    deudor = relationship("User", foreign_keys=[id_deudor], back_populates="deudas_pendientes")
    acreedor = relationship("User", foreign_keys=[id_acreedor], back_populates="deudas_a_cobrar")

class Documento(db.Model):
    __tablename__ = 'documento'
    id: Mapped[int] = mapped_column(primary_key=True)
    titulo: Mapped[str] = mapped_column(String(50), nullable=False)
    url: Mapped[str] = mapped_column(String(250), nullable=False)
    id_viaje: Mapped[int] = mapped_column(ForeignKey("viaje.id", ondelete="CASCADE"))

    viajes = relationship("Viaje", back_populates="documentos")

class Chat(db.Model):
    __tablename__ = 'chat'
    id: Mapped[int] = mapped_column(primary_key=True)
    id_viaje: Mapped[int] = mapped_column(ForeignKey("viaje.id", ondelete="CASCADE"))

    viajes = relationship("Viaje", back_populates="chat")
    mensajes = relationship("Mensaje", back_populates="chat")

class Mensaje(db.Model):
    __tablename__ = 'mensaje'
    id: Mapped[int] = mapped_column(primary_key=True)
    contenido: Mapped[str] = mapped_column(String(500), nullable=False)
    fecha_hora: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    id_chat: Mapped[int] = mapped_column(ForeignKey("chat.id", ondelete="CASCADE"))
    id_usuario: Mapped[int] = mapped_column(ForeignKey("user.id"))

    chat = relationship("Chat", back_populates="mensajes")
    autor = relationship("User", back_populates="mensajes")