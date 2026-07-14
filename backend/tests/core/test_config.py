from app.core.config import Settings


def test_database_uri_escapes_credentials() -> None:
    settings = Settings(
        PROJECT_NAME="Test",
        POSTGRES_SERVER="localhost",
        POSTGRES_USER="user/name",
        POSTGRES_PASSWORD="password#with/slashes",
        POSTGRES_DB="app",
        FIRST_SUPERUSER="admin@example.com",
        FIRST_SUPERUSER_PASSWORD="not-a-default-password",
    )

    assert str(settings.SQLALCHEMY_DATABASE_URI) == (
        "postgresql+psycopg://user%2Fname:password%23with%2Fslashes@localhost:5432/app"
    )
