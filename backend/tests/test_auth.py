def register_payload(**overrides):
    payload = {
        "name": "Budi Santoso",
        "student_number": "2021999001",
        "email": "budi@mahasiswa.ac.id",
        "password": "Password123!",
        "study_program": "Teknik Informatika",
        "class_name": "TI-4A",
    }
    payload.update(overrides)
    return payload


def register_user(client, **overrides):
    return client.post("/api/v1/auth/register", json=register_payload(**overrides))


def test_register_success_hashes_password_and_returns_student_role(client, db_session):
    response = register_user(client)

    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "budi@mahasiswa.ac.id"
    assert data["role"] == "student"
    assert "password" not in data
    assert "password_hash" not in data


def test_duplicate_email_is_rejected(client):
    assert register_user(client).status_code == 201

    response = register_user(client, student_number="2021999002")

    assert response.status_code == 409
    assert response.json()["detail"] == "Email is already registered"


def test_duplicate_student_number_is_rejected(client):
    assert register_user(client).status_code == 201

    response = register_user(client, email="budi2@mahasiswa.ac.id")

    assert response.status_code == 409
    assert response.json()["detail"] == "Student number is already registered"


def test_login_success_returns_access_token(client):
    assert register_user(client).status_code == 201

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "budi@mahasiswa.ac.id", "password": "Password123!"},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["token_type"] == "bearer"
    assert data["access_token"]
    assert data["user"]["email"] == "budi@mahasiswa.ac.id"


def test_login_wrong_password_is_rejected(client):
    assert register_user(client).status_code == 201

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "budi@mahasiswa.ac.id", "password": "wrong-password"},
    )

    assert response.status_code == 401


def test_me_without_token_is_rejected(client):
    response = client.get("/api/v1/auth/me")

    assert response.status_code == 401


def test_me_with_valid_token_returns_profile(client):
    assert register_user(client).status_code == 201
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "budi@mahasiswa.ac.id", "password": "Password123!"},
    )
    token = login.json()["access_token"]

    response = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "budi@mahasiswa.ac.id"
    assert data["role"] == "student"


def test_public_registration_does_not_accept_role_override(client):
    payload = register_payload()
    payload["role"] = "admin"

    response = client.post("/api/v1/auth/register", json=payload)

    assert response.status_code == 201
    assert response.json()["role"] == "student"
