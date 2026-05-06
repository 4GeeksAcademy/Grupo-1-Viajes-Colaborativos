
"""
Comandos CLI para Flask.
"""
import click
from api.models import db, User

def setup_commands(app):
    """Registra los comandos disponibles"""
    
    @app.cli.command("insert-test-users")
    @click.argument("count")
    def insert_test_users(count):
        """Crea usuarios de prueba"""
        print("Creating test users")
        for x in range(1, int(count) + 1):
            user = User()
            user.email = "test_user" + str(x) + "@test.com"
            user.password = "123456"
            user.is_active = True
            db.session.add(user)
            db.session.commit()
            print("User: ", user.email, " created.")

        print("All test users created")

    @app.cli.command("insert-test-data")
    def insert_test_data():
        pass