from fastapi.testclient import TestClient
from src.app import app


client = TestClient(app)


def test_get_activities():
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    # basic sanity checks
    assert "Chess Club" in data
    assert isinstance(data["Chess Club"]["participants"], list)


def test_signup_success_and_reflection():
    activity = "Art Club"
    email = "teststudent@mergington.edu"

    # ensure not already present
    res = client.get("/activities")
    assert email not in res.json()[activity]["participants"]

    # sign up
    post = client.post(f"/activities/{activity}/signup?email={email}")
    assert post.status_code == 200
    body = post.json()
    assert email in body.get("message", "")

    # verify participant appears in activities
    res2 = client.get("/activities")
    assert email in res2.json()[activity]["participants"]


def test_signup_duplicate_returns_400():
    activity = "Art Club"
    email = "teststudent@mergington.edu"

    # signing up a second time should fail
    post = client.post(f"/activities/{activity}/signup?email={email}")
    assert post.status_code == 400


def test_signup_nonexistent_activity_returns_404():
    post = client.post("/activities/Nonexistent%20Activity/signup?email=a@b.com")
    assert post.status_code == 404
