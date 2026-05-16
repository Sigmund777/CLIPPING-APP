"""ClipForge AI backend API tests"""
import os
import uuid
import requests
import pytest

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://clipforge-ai-33.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

TEST_EMAIL = "creator@clipforge.ai"
TEST_PASSWORD = "Creator2026!"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def auth_session(session):
    r = session.post(f"{API}/auth/login", json={"email": TEST_EMAIL, "password": TEST_PASSWORD})
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    return session


def test_root():
    r = requests.get(f"{API}/")
    assert r.status_code == 200
    assert r.json().get("ok") is True


def test_login_seeded(session):
    r = session.post(f"{API}/auth/login", json={"email": TEST_EMAIL, "password": TEST_PASSWORD})
    assert r.status_code == 200
    data = r.json()
    assert data["email"] == TEST_EMAIL
    assert "access_token" in r.cookies


def test_me(auth_session):
    r = auth_session.get(f"{API}/auth/me")
    assert r.status_code == 200
    assert r.json()["email"] == TEST_EMAIL


def test_login_invalid():
    r = requests.post(f"{API}/auth/login", json={"email": TEST_EMAIL, "password": "wrong"})
    assert r.status_code == 401


def test_register_and_logout():
    s = requests.Session()
    email = f"test_{uuid.uuid4().hex[:8]}@clipforge.ai"
    r = s.post(f"{API}/auth/register", json={"email": email, "password": "TestPass123!", "name": "Test User"})
    assert r.status_code == 200, r.text
    assert r.json()["email"] == email
    assert "access_token" in s.cookies

    r2 = s.get(f"{API}/auth/me")
    assert r2.status_code == 200

    r3 = s.post(f"{API}/auth/logout")
    assert r3.status_code == 200

    r4 = s.get(f"{API}/auth/me")
    assert r4.status_code == 401


def test_register_duplicate():
    r = requests.post(f"{API}/auth/register", json={"email": TEST_EMAIL, "password": "x12345", "name": "Dup"})
    assert r.status_code == 400


def test_google_auth():
    s = requests.Session()
    email = f"goog_{uuid.uuid4().hex[:8]}@clipforge.ai"
    r = s.post(f"{API}/auth/google", json={"email": email, "name": "Google User", "avatar": None})
    assert r.status_code == 200
    assert r.json()["email"] == email
    # idempotent
    r2 = s.post(f"{API}/auth/google", json={"email": email, "name": "Google User"})
    assert r2.status_code == 200


def test_list_seeded_clips(auth_session):
    r = auth_session.get(f"{API}/clips")
    assert r.status_code == 200
    clips = r.json()
    assert isinstance(clips, list)
    assert len(clips) >= 3
    assert all("_id" not in c for c in clips)


def test_clip_crud_flow(auth_session):
    # CREATE
    r = auth_session.post(f"{API}/clips", json={"title": "TEST_New clip", "duration_seconds": 45})
    assert r.status_code == 200, r.text
    clip = r.json()
    cid = clip["id"]
    assert clip["title"] == "TEST_New clip"
    assert clip["caption_style"] == "Bold-Yellow"

    # GET
    r2 = auth_session.get(f"{API}/clips/{cid}")
    assert r2.status_code == 200
    assert r2.json()["id"] == cid

    # PATCH
    r3 = auth_session.patch(f"{API}/clips/{cid}", json={"title": "TEST_Updated", "caption_style": "Neon-Pop"})
    assert r3.status_code == 200
    assert r3.json()["title"] == "TEST_Updated"
    assert r3.json()["caption_style"] == "Neon-Pop"

    # EXPORT
    r4 = auth_session.post(f"{API}/clips/{cid}/export")
    assert r4.status_code == 200
    assert r4.json()["ok"] is True

    # Verify exported
    r5 = auth_session.get(f"{API}/clips/{cid}")
    assert r5.json()["is_exported"] is True

    # DELETE
    r6 = auth_session.delete(f"{API}/clips/{cid}")
    assert r6.status_code == 200

    # Confirm deleted
    r7 = auth_session.get(f"{API}/clips/{cid}")
    assert r7.status_code == 404


def test_ai_transcript(auth_session):
    r = auth_session.post(f"{API}/ai/transcript", json={"video_id": "x"})
    assert r.status_code == 200
    data = r.json()
    assert "segments" in data
    assert len(data["segments"]) >= 4


def test_ai_suggestions(auth_session):
    r = auth_session.post(f"{API}/ai/suggestions", json={"video_id": "x"})
    assert r.status_code == 200
    data = r.json()
    assert "clips" in data and "viral_titles" in data
    assert len(data["clips"]) >= 3


def test_unauthenticated_clips():
    r = requests.get(f"{API}/clips")
    assert r.status_code == 401
