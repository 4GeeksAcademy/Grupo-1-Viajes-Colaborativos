import enum
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import String, Boolean, Enum, Date, Integer, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column
from datetime import date

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
    


    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "last_name": self.last_name,
            "email": self.email,
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


    def serialize(self):
        return {
            "id": self.id,
            "title": self.title,
            "destination": self.destination,
            "state": self.state,
            "starting_date": self.starting_date,
            "ending_date": self.ending_date,
            "budget": self.budget,
            "notes": self.notes,
        }
