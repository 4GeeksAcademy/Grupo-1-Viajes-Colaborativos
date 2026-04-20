import enum
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import String, Boolean, Enum, Date, Integer, ForeignKey, Float, Time, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import date, time, datetime
from werkzeug.security import check_password_hash, generate_password_hash

db = SQLAlchemy()

# --- ENUMS ---


class StateTypes(enum.Enum):
    FINISHED = "finished"
    ONGOING = "ongoing"
    PLANNING = "planning"


class CategoryTypes(enum.Enum):
    TRANSPORT = "transport"
    LODGING = "lodging"
    FOOD = "food"
    ACTIVITIES = "activities"
    OTHERS = "others"

# --- MODELS ---


class User(db.Model):
    __tablename__ = 'user'
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(20), nullable=False)
    last_name: Mapped[str] = mapped_column(String(50), nullable=True)
    email: Mapped[str] = mapped_column(
        String(120), unique=True, nullable=False)
    password: Mapped[str] = mapped_column(nullable=False)

    # Relationships
    travelers = relationship("Traveler", back_populates="users")
    expenses_paid = relationship("Expense", back_populates="payers")
    messages = relationship("Message", back_populates="authors")
    debts_owed = relationship(
        "Debt", foreign_keys="[Debt.debtor_id]", back_populates="debtors")
    debts_to_receive = relationship(
        "Debt", foreign_keys="[Debt.creditor_id]", back_populates="creditors")

    def set_password(self, password: str) -> None:
        self.password = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password, password)

    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "last_name": self.last_name,
            "email": self.email
        }
    
    def serialize_name(self):
        return {
            "name": self.name
        }


class Trip(db.Model):
    __tablename__ = 'trip'
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(30), nullable=False)
    destination: Mapped[str] = mapped_column(String(50), nullable=False)
    state: Mapped[StateTypes] = mapped_column(
        Enum(StateTypes), nullable=False)
    starting_date: Mapped[date] = mapped_column(Date(), nullable=False)
    ending_date: Mapped[date] = mapped_column(Date(), nullable=False)
    budget: Mapped[float] = mapped_column(Float, nullable=False)
    notes: Mapped[str] = mapped_column(String(150), nullable=True)
    
    # 📸 NUEVO CAMPO: Para guardar la foto de portada
    image_url: Mapped[str] = mapped_column(String(500), nullable=True)

    # Relationships
    travelers = relationship("Traveler", back_populates="trips")
    itineraries = relationship("Itinerary", back_populates="trips")
    expenses = relationship("Expense", back_populates="trips")
    documents = relationship("Document", back_populates="trips")
    chats = relationship("Chat", back_populates="trips", uselist=False)

    def serialize(self):
        return {
            "id": self.id,
            "title": self.title,
            "destination": self.destination,
            "state": self.state.value,
            "starting_date": str(self.starting_date),
            "ending_date": str(self.ending_date),
            "budget": self.budget,
            "notes": self.notes,
            "image_url": self.image_url # 📸 Incluido en serialización
        }
    
    def serialize_common_trips(self):
        return {
            "id": self.id,
            "title": self.title,
            "destination": self.destination, # Añadido para ayudar con imágenes genéricas si hace falta
            "state": self.state.value,
            "starting_date": str(self.starting_date),
            "ending_date": str(self.ending_date),
            "image_url": self.image_url # 📸 Incluido en serialización reducida
        }


class Traveler(db.Model):
    __tablename__ = 'traveler'
    user_id: Mapped[int] = mapped_column(ForeignKey(
        "user.id", ondelete="CASCADE"), primary_key=True)
    trip_id: Mapped[int] = mapped_column(ForeignKey(
        "trip.id", ondelete="CASCADE"), primary_key=True)

    users = relationship("User", back_populates="travelers")
    trips = relationship("Trip", back_populates="travelers")

    def serialize(self):
        return {
            "user_id": self.user_id,
            "trip_id": self.trip_id
        }
    
    def serialize_trip(self):
        return {
            "trip_id": self.trip_id
        }
    
    def serialize_user(self):
        return {
            "user_id": self.user_id
        }


class Itinerary(db.Model):
    __tablename__ = 'itinerary'
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(30), nullable=False)
    destination: Mapped[str] = mapped_column(String(50), nullable=False)
    hour: Mapped[time] = mapped_column(Time, nullable=False)
    starting_date: Mapped[date] = mapped_column(Date(), nullable=False)
    notes: Mapped[str] = mapped_column(String(150), nullable=True)
    trip_id: Mapped[int] = mapped_column(
        ForeignKey("trip.id", ondelete="CASCADE"))

    trips = relationship("Trip", back_populates="itineraries")

    def serialize(self):
        return {
            "id": self.id,
            "title": self.title,
            "hour": str(self.hour),
            "starting_date": str(self.starting_date),
            "trip_id": self.trip_id
        }


class Expense(db.Model):
    __tablename__ = 'expense'
    id: Mapped[int] = mapped_column(primary_key=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    description: Mapped[str] = mapped_column(String(100), nullable=False)
    trip_id: Mapped[int] = mapped_column(
        ForeignKey("trip.id", ondelete="CASCADE"))
    payer_id: Mapped[int] = mapped_column(ForeignKey("user.id"))

    trips = relationship("Trip", back_populates="expenses")
    payers = relationship("User", back_populates="expenses_paid")
    debts = relationship("Debt", back_populates="expenses")

    def serialize(self):
        return {"id": self.id, "amount": self.amount, "description": self.description, "payer_id": self.payer_id}


class Debt(db.Model):
    __tablename__ = 'debt'
    id: Mapped[int] = mapped_column(primary_key=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    debtor_id: Mapped[int] = mapped_column(ForeignKey("user.id"))
    creditor_id: Mapped[int] = mapped_column(ForeignKey("user.id"))
    expense_id: Mapped[int] = mapped_column(ForeignKey("expense.id"))

    expenses = relationship("Expense", back_populates="debts")
    debtors = relationship("User", foreign_keys=[
                           debtor_id], back_populates="debts_owed")
    creditors = relationship("User", foreign_keys=[
                             creditor_id], back_populates="debts_to_receive")
    
    def serialize(self):
        return {
            "id": self.id,
            "amount": self.amount,
            "debtor_id": self.debtor_id,
            "creditor_id": self.creditor_id,
            "expense_id": self.expense_id
        }


class Document(db.Model):
    __tablename__ = 'document'
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(50), nullable=False)
    url: Mapped[str] = mapped_column(String(250), nullable=False)
    trip_id: Mapped[int] = mapped_column(
        ForeignKey("trip.id", ondelete="CASCADE"))

    trips = relationship("Trip", back_populates="documents")

    def serialize(self):
        return {
            "id": self.id,
            "title": self.title,
            "url": self.url,
            "trip_id": self.trip_id
        }


class Chat(db.Model):
    __tablename__ = 'chat'
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(
        String(50), nullable=True)  # <-- Título añadido
    trip_id: Mapped[int] = mapped_column(
        ForeignKey("trip.id", ondelete="CASCADE"))

    trips = relationship("Trip", back_populates="chats")
    messages = relationship("Message", back_populates="chats")
    
    def serialize(self):
        return {
            "id": self.id,
            "title": self.amount,
            "trip_id": self.trip_id
        }


class Message(db.Model):
    __tablename__ = 'message'
    id: Mapped[int] = mapped_column(primary_key=True)
    content: Mapped[str] = mapped_column(String(500), nullable=False)
    date_time: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow)
    chat_id: Mapped[int] = mapped_column(
        ForeignKey("chat.id", ondelete="CASCADE"))
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"))

    chats = relationship("Chat", back_populates="messages")
    authors = relationship("User", back_populates="messages")

    def serialize(self):
        return {
            "id": self.id,
            "content": self.content,
            "date_time": str(self.date_time),
            "chat_id": self.chat_id,
            "user_id": self.user_id
        }
        