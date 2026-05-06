import os
import sys
sys.path.insert(0, 'src')

from app import app, db
from sqlalchemy import inspect

with app.app_context():
    db.create_all()
    print('Tablas creadas correctamente')
    
    inspector = inspect(db.engine)
    tables = inspector.get_table_names()
    print('Tablas en DB:', tables)