from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from jose import jwt, JWTError
import bcrypt
import hashlib
from app.core.config import settings


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


def get_password_hash(password: str) -> str:
    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt(),
    ).decode("utf-8")


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_access_token_expire_minutes)
    
    to_encode.update({
        "exp": expire,
        "type": "access",
        "iat": datetime.now(timezone.utc)
    })
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=settings.jwt_refresh_token_expire_days)
    
    to_encode.update({
        "exp": expire,
        "type": "refresh",
        "iat": datetime.now(timezone.utc)
    })
    encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    return encoded_jwt


def decode_token(token: str) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
        return payload
    except JWTError:
        return None


def verify_token_type(payload: Dict[str, Any], token_type: str) -> bool:
    return payload.get("type") == token_type


def get_token_subject(token: str) -> Optional[int]:
    payload = decode_token(token)
    if payload:
        sub = payload.get("sub")
        if isinstance(sub, int):
            return sub
        if isinstance(sub, str) and sub.isdigit():
            return int(sub)
    return None


def get_token_expiry(token: str) -> Optional[datetime]:
    payload = decode_token(token)
    if payload and "exp" in payload:
        return datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
    return None