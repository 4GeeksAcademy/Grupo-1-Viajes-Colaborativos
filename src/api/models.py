import enum
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import String, Boolean, Enum, Date, Integer, ForeignKey, Float, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import date, time

db = SQLAlchemy()

class StateTypes(enum.Enum):
    FINISHED = "finished"
    ONGOING = "ongoing"
    PLANNING = "planning"

class User(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(20), nullable=False)
    last_name: Mapped[str] = mapped_column(String(50), nullable=False)
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(nullable=False)
    
    viajeros = relationship("Viajero", back_populates="users")

    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "last_name": self.last_name,
            "email": self.email
        }
    

class Viaje(db.Model):
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(30), nullable=False)
    destination: Mapped[str] = mapped_column(String(50), nullable=False)
    state: Mapped[StateTypes] = mapped_column(Enum(StateTypes), nullable=False)
    starting_date: Mapped[date] = mapped_column(Date(), nullable=False)
    ending_date: Mapped[date] = mapped_column(Date(), nullable=False)
    budget: Mapped[float] = mapped_column(Float, nullable=False)
    notes: Mapped[str] = mapped_column(String(150), nullable=False)

    viajeros = relationship("Viajero", back_populates="viajes")
    itinerarios = relationship("Itinerario", back_populates="viajes")


    def serialize(self):
        return {
            "id": self.id,
            "title": self.title,
            "destination": self.destination,
            "state": self.state,
            "starting_date": self.starting_date,
            "ending_date": self.ending_date,
            "budget": self.budget,
            "notes": self.notes
        }


class Viajero(db.Model):
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
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(30), nullable=False)
    destination: Mapped[str] = mapped_column(String(50), nullable=False)
    hour: Mapped[time] = mapped_column(Time, nullable=False)
    starting_date: Mapped[date] = mapped_column(Date(), nullable=False)
    notes: Mapped[str] = mapped_column(String(150), nullable=False)
    id_viaje: Mapped[int] = mapped_column(ForeignKey("viaje.id", ondelete="CASCADE"), primary_key=True)


    viajes = relationship("Viaje", back_populates="itinerarios")


    def serialize(self):
        return {
            "id": self.id,
            "title": self.title,
            "destination": self.destination,
            "hour": self.hour,
            "starting_date": self.starting_date,
            "notes": self.notes,
            "id_viaje": self.id_viaje
        }
