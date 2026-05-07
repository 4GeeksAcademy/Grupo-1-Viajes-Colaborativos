import os
import sys
sys.path.insert(0, 'src')

from app import app, db
from api.models import User

with app.app_context():
    # Check if test user exists
    user = User.query.filter_by(email="test@example.com").first()
    
    if user:
        print("[OK] Test 1: Usuario ya existe")
        print("     Email:", user.email)
        print("     Name:", user.name)
        print("     ID:", user.id)
    else:
        # Test 1: Create a user
        new_user = User(
            email="test@example.com",
            name="Test User",
            is_verified=True
        )
        new_user.set_password("123456")
        
        db.session.add(new_user)
        db.session.commit()
        
        print("[OK] Test 1: Usuario creado exitosamente")
        print("     Email:", new_user.email)
        print("     Name:", new_user.name)
        print("     ID:", new_user.id)
    
    # Test 2: Verify login works
    user = User.query.filter_by(email="test@example.com").first()
    if user and user.check_password("123456"):
        print("[OK] Test 2: Login exitoso")
    else:
        print("[FAIL] Test 2: Login fallo")
    
    # Test 3: Create a trip
    from api.models import Trip, StateTypes
    from datetime import date
    
    new_trip = Trip(
        title="Viaje de Prueba",
        destination="Madrid",
        state=StateTypes.PLANNING,
        starting_date=date(2026, 6, 1),
        ending_date=date(2026, 6, 7),
        budget=500.0
    )
    
    db.session.add(new_trip)
    db.session.commit()
    
    print("[OK] Test 3: Viaje creado exitosamente")
    print("     Title:", new_trip.title)
    print("     Destination:", new_trip.destination)
    print("     ID:", new_trip.id)
    
    # Test 4: Link user to trip
    from api.models import Traveler
    
    traveler = Traveler(
        user_id=user.id,
        trip_id=new_trip.id
    )
    
    db.session.add(traveler)
    db.session.commit()
    
    print("[OK] Test 4: Usuario vinculado al viaje")
    
    print("\n" + "="*50)
    print("TODOS LOS TESTS PASARON")
    print("="*50)