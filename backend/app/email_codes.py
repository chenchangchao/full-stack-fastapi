import hashlib
import hmac
import secrets
from datetime import UTC, datetime, timedelta

from sqlmodel import Session, col, select

from app.core.config import settings
from app.models import EmailCodePurpose, EmailVerificationCode


class EmailCodeError(ValueError):
    pass


class EmailCodeCooldownError(EmailCodeError):
    def __init__(self, retry_after: int) -> None:
        self.retry_after = retry_after
        super().__init__(
            f"Please wait {retry_after} seconds before requesting a new code"
        )


def normalize_email(email: str) -> str:
    return email.strip().lower()


def _digest_code(*, email: str, purpose: EmailCodePurpose, code: str) -> str:
    payload = f"{purpose}:{normalize_email(email)}:{code}".encode()
    return hmac.new(settings.SECRET_KEY.encode(), payload, hashlib.sha256).hexdigest()


def issue_email_code(*, session: Session, email: str, purpose: EmailCodePurpose) -> str:
    now = datetime.now(UTC)
    normalized_email = normalize_email(email)
    statement = (
        select(EmailVerificationCode)
        .where(
            EmailVerificationCode.email == normalized_email,
            EmailVerificationCode.purpose == purpose,
            col(EmailVerificationCode.consumed_at).is_(None),
        )
        .order_by(col(EmailVerificationCode.created_at).desc())
    )
    previous = session.exec(statement).first()
    if previous:
        elapsed = (now - previous.created_at).total_seconds()
        if elapsed < settings.EMAIL_CODE_RESEND_SECONDS:
            retry_after = max(1, settings.EMAIL_CODE_RESEND_SECONDS - int(elapsed))
            raise EmailCodeCooldownError(retry_after)
        previous.consumed_at = now
        session.add(previous)

    code = f"{secrets.randbelow(1_000_000):06d}"
    record = EmailVerificationCode(
        email=normalized_email,
        purpose=purpose,
        code_digest=_digest_code(
            email=normalized_email,
            purpose=purpose,
            code=code,
        ),
        expires_at=now + timedelta(minutes=settings.EMAIL_CODE_EXPIRE_MINUTES),
    )
    session.add(record)
    session.commit()
    return code


def verify_email_code(
    *, session: Session, email: str, purpose: EmailCodePurpose, code: str
) -> None:
    now = datetime.now(UTC)
    normalized_email = normalize_email(email)
    statement = (
        select(EmailVerificationCode)
        .where(
            EmailVerificationCode.email == normalized_email,
            EmailVerificationCode.purpose == purpose,
            col(EmailVerificationCode.consumed_at).is_(None),
        )
        .order_by(col(EmailVerificationCode.created_at).desc())
    )
    record = session.exec(statement).first()
    if (
        not record
        or record.expires_at <= now
        or record.attempts >= settings.EMAIL_CODE_MAX_ATTEMPTS
    ):
        raise EmailCodeError("Invalid or expired verification code")

    expected_digest = _digest_code(
        email=normalized_email,
        purpose=purpose,
        code=code,
    )
    if not hmac.compare_digest(record.code_digest, expected_digest):
        record.attempts += 1
        if record.attempts >= settings.EMAIL_CODE_MAX_ATTEMPTS:
            record.consumed_at = now
        session.add(record)
        session.commit()
        raise EmailCodeError("Invalid or expired verification code")

    record.consumed_at = now
    session.add(record)
    session.commit()
