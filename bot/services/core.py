import requests
from config import BACKEND_URL


class InternalServerException(Exception):
    pass


def get_cat(cat):
    try:
        response = requests.get(f"{BACKEND_URL}/cats/{cat}")
    except Exception as e:
        raise InternalServerException()
    return response.json()


def get_cats():
    try:
        response = requests.get(f"{BACKEND_URL}/cats")
    except Exception as e:
        raise InternalServerException()
    return response.json()


def get_post(id):
    try:
        response = requests.get(f"{BACKEND_URL}/getPost/{id}")
    except Exception as e:
        raise InternalServerException()
    return response.json()


def close_post_rq(id):
    try:
        response = requests.post(f"{BACKEND_URL}/closePost/{id}")
    except Exception as e:
        raise InternalServerException()
    return response.json()


def get_posts(uid):
    try:
        response = requests.get(f"{BACKEND_URL}/userposts/{uid}")
    except Exception as e:
        raise InternalServerException()
    return response.json()


def get_me(tid):
    try:
        response = requests.get(f"{BACKEND_URL}/me/{tid}")
    except Exception as e:
        raise InternalServerException()
    return response.json()


def register_user(payload):
    try:
        response = requests.post(BACKEND_URL+"register", json=payload)
    except Exception as e:
        raise InternalServerException()
    return response.json()


def post_job(payload):
    try:
        response = requests.post(BACKEND_URL+"post", json=payload)
    except Exception as e:
        raise InternalServerException()
    return response.json()


def decline_applicant_req(payload):
    try:
        response = requests.post(BACKEND_URL+"declineApplicant", json=payload)
    except Exception as e:
        raise InternalServerException()
    return response.json()


def send_app(payload):
    try:
        response = requests.post(BACKEND_URL+"application", json=payload)
    except Exception as e:
        raise InternalServerException()
    return response.json()


def approve_jobpost_req(payload):
    try:
        response = requests.post(BACKEND_URL+"approvePost", json=payload)
    except Exception as e:
        raise InternalServerException()
    return response.json()


def decline_jobpost_req(payload):
    try:
        response = requests.post(BACKEND_URL+"declinePost", json=payload)
    except Exception as e:
        raise InternalServerException()
    return response.json()
