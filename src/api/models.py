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

# --- MODELS ---

class User(db.Model):
    __tablename__ = 'user'
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(20), nullable=False)
    last_name: Mapped[str] = mapped_column(String(50), nullable=False)
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(nullable=False)
    
    # Relationships
    travelers = relationship("Traveler", back_populates="user")
    expenses_paid = relationship("Expense", back_populates="payer")
    messages = relationship("Message", back_populates="author")
    debts_owed = relationship("Debt", foreign_keys="[Debt.debtor_id]", back_populates="debtor")
    debts_to_receive = relationship("Debt", foreign_keys="[Debt.creditor_id]", back_populates="creditor")

    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "last_name": self.last_name,
            "email": self.email
        }

class Trip(db.Model):
    __tablename__ = 'trip'
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(30), nullable=False)
    destination: Mapped[str] = mapped_column(String(50), nullable=False)
    state: Mapped[StateTypes] = mapped_column(Enum(StateTypes), nullable=False)
    starting_date: Mapped[date] = mapped_column(Date(), nullable=False)
    ending_date: Mapped[date] = mapped_column(Date(), nullable=False)
    budget: Mapped[float] = mapped_column(Float, nullable=False)
    notes: Mapped[str] = mapped_column(String(150), nullable=False)

    # Relationships
    travelers = relationship("Traveler", back_populates="trip")
    itineraries = relationship("Itinerary", back_populates="trip")
    expenses = relationship("Expense", back_populates="trip")
    documents = relationship("Document", back_populates="trip")
    chat = relationship("Chat", back_populates="trip", uselist=False)

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

class Traveler(db.Model):
    __tablename__ = 'traveler'
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"), primary_key=True)
    trip_id: Mapped[int] = mapped_column(ForeignKey("trip.id", ondelete="CASCADE"), primary_key=True)

    user = relationship("User", back_populates="travelers")
    trip = relationship("Trip", back_populates="travelers")

    def serialize(self):
        return {
            "user_id": self.user_id,
            "trip_id": self.trip_id
        }

class Itinerary(db.Model):
    __tablename__ = 'itinerary'
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(30), nullable=False)
    destination: Mapped[str] = mapped_column(String(50), nullable=False)
    hour: Mapped[time] = mapped_column(Time, nullable=False)
    starting_date: Mapped[date] = mapped_column(Date(), nullable=False)
    notes: Mapped[str] = mapped_column(String(150), nullable=False)
    trip_id: Mapped[int] = mapped_column(ForeignKey("trip.id", ondelete="CASCADE"))

    trip = relationship("Trip", back_populates="itineraries")

    def serialize(self):
        return {
            "id": self.id,
            "title": self.title,
            "hour": str(self.hour),
            "trip_id": self.trip_id
        }

class Expense(db.Model):
    __tablename__ = 'expense'
    id: Mapped[int] = mapped_column(primary_key=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    description: Mapped[str] = mapped_column(String(100), nullable=False)
    trip_id: Mapped[int] = mapped_column(ForeignKey("trip.id", ondelete="CASCADE"))
    payer_id: Mapped[int] = mapped_column(ForeignKey("user.id"))
    
    trip = relationship("Trip", back_populates="expenses")
    payer = relationship("User", back_populates="expenses_paid")
    debts = relationship("Debt", back_populates="expense")

    def serialize(self):
        return {"id": self.id, "amount": self.amount, "description": self.description}

class Debt(db.Model):
    __tablename__ = 'debt'
    id: Mapped[int] = mapped_column(primary_key=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    debtor_id: Mapped[int] = mapped_column(ForeignKey("user.id"))
    creditor_id: Mapped[int] = mapped_column(ForeignKey("user.id"))
    expense_id: Mapped[int] = mapped_column(ForeignKey("expense.id"))

    expense = relationship("Expense", back_populates="debts")
    debtor = relationship("User", foreign_keys=[debtor_id], back_populates="debts_owed")
    creditor = relationship("User", foreign_keys=[creditor_id], back_populates="debts_to_receive")

class Document(db.Model):
    __tablename__ = 'document'
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(50), nullable=False)
    url: Mapped[str] = mapped_column(String(250), nullable=False)
    trip_id: Mapped[int] = mapped_column(ForeignKey("trip.id", ondelete="CASCADE"))

    trip = relationship("Trip", back_populates="documents")

class Chat(db.Model):
    __tablename__ = 'chat'
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(50), nullable=True) # <-- Título añadido
    trip_id: Mapped[int] = mapped_column(ForeignKey("trip.id", ondelete="CASCADE"))

    trip = relationship("Trip", back_populates="chat")
    messages = relationship("Message", back_populates="chat")

class Message(db.Model):
    __tablename__ = 'message'
    id: Mapped[int] = mapped_column(primary_key=True)
    content: Mapped[str] = mapped_column(String(500), nullable=False)
    date_time: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    chat_id: Mapped[int] = mapped_column(ForeignKey("chat.id", ondelete="CASCADE"))
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"))

    chat = relationship("Chat", back_populates="messages")
    author = relationship("User", back_populates="messages")