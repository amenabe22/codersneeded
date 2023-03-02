import requests

TARGET_URL = "http://127.0.0.1:5000/"


class InternalServerException(Exception):
    pass


def get_cats():
    try:
        response = requests.get(f"{TARGET_URL}/cats")
    except Exception as e:
        raise InternalServerException()
    return response.json()


def get_posts(uid):
    try:
        response = requests.get(f"{TARGET_URL}/userposts/{uid}")
    except Exception as e:
        raise InternalServerException()
    return response.json()


def get_me(tid):
    try:
        response = requests.get(f"{TARGET_URL}/me/{tid}")
    except Exception as e:
        raise InternalServerException()
    return response.json()


def register_user(payload):
    try:
        response = requests.post(TARGET_URL+"register", json=payload)
    except Exception as e:
        raise InternalServerException()
    return response.json()


def post_job(payload):
    try:
        response = requests.post(TARGET_URL+"post", json=payload)
    except Exception as e:
        raise InternalServerException()
    return response.json()


def decline_applicant_req(payload):
    try:
        response = requests.post(TARGET_URL+"declineApplicant", json=payload)
    except Exception as e:
        raise InternalServerException()
    return response.json()


def send_app(payload):
    try:
        response = requests.post(TARGET_URL+"application", json=payload)
    except Exception as e:
        raise InternalServerException()
    return response.json()


def approve_jobpost_req(payload):
    try:
        response = requests.post(TARGET_URL+"approvePost", json=payload)
    except Exception as e:
        raise InternalServerException()
    return response.json()



def decline_jobpost_req(payload):
    try:
        response = requests.post(TARGET_URL+"declinePost", json=payload)
    except Exception as e:
        raise InternalServerException()
    return response.json()

