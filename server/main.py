import os
import json
import requests
from prisma import Prisma
from flask import Flask, request
from config import BOT_TOKEN, CHANNEL_ID, CHANNEL_URL, MOD_CHAN_ID

app = Flask(__name__)
prisma = Prisma()
prisma.connect()


def format_post(post, cat):
    msg = f"""Job Title: {post.title}\n\nCompany: {post.company}\n\nJob Type: {post.jobType}\n\nDescription:  {post.description}\n\nLocation: {post.location}\n\n\n#{cat}"""
    return msg


@app.route('/me/<userid>', methods=['GET'])
def getMe(userid):
    user = prisma.user.find_first(where={'userid': userid})
    app.logger.debug('%s USERID', userid)
    return user.dict()


@app.route('/', methods=['GET'])
def getAllUser():
    users = prisma.user.find_many()
    return [user.dict() for user in users]


@app.route('/register', methods=['POST'])
def createUser():
    try:
        payload = json.loads(request.data)
        user = prisma.user.find_first(
            where={
                'userid': payload['userid'],
            },
        )
        if not user:
            user = prisma.user.create(payload)
    except Exception as e:
        return {"error": e}
    return user.dict()


@app.route('/cats/<cat>', methods=['GET'])
def getCat(cat):
    cat_obj = prisma.jobcategory.find_first(where={'category': cat})
    return {"cat": True} if cat_obj else {"cat": False}


@app.route('/cats', methods=['GET'])
def getCats():
    cats = prisma.jobcategory.find_many()
    return [cat.dict() for cat in cats]


@app.route('/addcat', methods=['POST'])
def addCategory():
    # {
    #     'category': 'Backend Developer',
    # }
    try:
        payload = json.loads(request.data)
        cat = prisma.jobcategory.create(payload)
    except Exception as e:
        raise Exception(e)
        # return "Error Handling register"

    return 'addCategory'


@app.route('/approvePost', methods=['POST'])
def approvePost():
    body = json.loads(request.data)
    post = prisma.jobpost.find_first(where={'id': body['post']})
    body = json.loads(request.data)
    cat = prisma.jobcategory.find_first(where={'id': post.catId})
    approval_message = f"Your Job post <b>{post.title}</b> is now Live 🚀"
    poster = prisma.user.find_first(where={'id': post.posterId})
    # publish on channel
    payload = {"chat_id": CHANNEL_ID,
               "text": format_post(post, cat.category), "disable_notification": False,
               "reply_markup": {"inline_keyboard": [[{"text": "Apply", "url": f"https://t.me/cneedtest_bot?start={post.id}"}]]}}
    res = requests.post(
        f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage", json=payload)

    messageId = res.json()["result"]["message_id"]
    # update post message id inside channel
    prisma.jobpost.update(
        where={
            'id': post.id,
        },
        data={
            'messageId': str(messageId)
        },
    )

    # notify user about approval
    payload = {"chat_id": poster.userid,
               "text": approval_message,
               "disable_notification": False, "parse_mode": "html",
               "reply_markup": {"inline_keyboard": [[{"text": "👀 Show", "url": f"{CHANNEL_URL}/{messageId}"}]]}}
    res = requests.post(
        f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage", json=payload)

    print("#"*50)
    print(res.json(), "RES")
    print("#"*50)
    return res.json()


@app.route('/declinePost', methods=['POST'])
def declinePost():
    body = json.loads(request.data)
    print(body, "BODY")
    post = prisma.jobpost.find_first(where={'id': body['post']})
    poster = prisma.user.find_first(where={'id': post.posterId})
    decline_message = f"Your Job post <b>{post.title}</b> was declined please make sure to follow correct formatting and fill enough data"
    payload = {"chat_id": poster.userid,
               "text": decline_message,
               "disable_notification": False, "parse_mode": "html"}

    res = requests.post(
        f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage", json=payload)
    return res.json()


@app.route('/closePost/<post>', methods=['POST'])
def closePost(post):
    prisma.jobpost.update(
        where={
            'id': int(post),
        },
        data={
            'status': 'CLOSED'
        },
    )
    return {"closed": True}


@app.route('/post', methods=['POST'])
def addJobPost():
    try:
        body = json.loads(request.data)
        print(body)
        cat = prisma.jobcategory.find_first(where={'category': body['catId']})
        post = prisma.jobpost.create(
            {
                'title':  body["title"],
                'description': body["description"],
                'company':  body["company"],
                'jobType':  body["jobType"].replace(" ", "").upper(),
                'pay':  body["pay"],
                'location': body["location"],
                'posterId': int(body["posterId"]),
                'catId': cat.id,
                'status': 'ACTIVE'
            }
        )

        payload = {"chat_id": MOD_CHAN_ID,
                   "text": format_post(post, body['catId']), "disable_notification": False,
                   "reply_markup": {"inline_keyboard": [[{"text": "✅ Approve", "callback_data": f"approve_post|{post.id}"},
                                                         {"text": "❌ Decline", "callback_data": f"decline_post|{post.id}"}]]}}
        res = requests.post(
            f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage", json=payload)
        print("RESPONSE", res.content)
    except Exception as e:
        raise Exception(e)

    return post.dict()


@app.route('/declineApplicant', methods=['POST'])
def declineApplicant():
    body = json.loads(request.data)
    app = prisma.application.find_first(where={'id': body['app']})
    initial_post = prisma.jobpost.find_first(where={'id': app.postId})
    applicant = prisma.user.find_first(
        where={'id': app.userId})
    decline_msg = f"your application for <b>{initial_post.title}</b> was declined"
    reply_markup = {"inline_keyboard": [
        [{"text": "🔎 Search More", "url": CHANNEL_URL}]]}
    payload = {"chat_id": applicant.userid,
               "text": decline_msg, "disable_notification": False,
               "parse_mode": "html",
               "reply_markup": reply_markup}
    res = requests.post(
        f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage", json=payload)
    return res.json()


@app.route('/application', methods=['POST'])
def addApplication():
    try:
        app = prisma.application.create(json.loads(request.data))
        initial_post = prisma.jobpost.find_first(where={'id': app.postId})
        applicant = prisma.user.find_first(
            where={'id': app.userId})

        initial_poster = prisma.user.find_first(
            where={'id': initial_post.posterId})
        newapp_msg = f"<b>{applicant.name}</b> Just applied to your post <b>{initial_post.title}</b>\n\n<b>Message from {applicant.name}:</b> {app.message}\n\n<b>Contact:</b> {app.contact}\n\nGood Luck !!"
        payload = {"chat_id": initial_poster.userid,
                   "text": newapp_msg, "disable_notification": False,
                   "parse_mode": "html",
                   "reply_markup": {"inline_keyboard": [[{"text": "🥱 Decline", "callback_data": f"decline_applicant|{app.id}"}]]}}
        res = requests.post(
            f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage", json=payload)
        print("RESPONSE", res.content)

        print(initial_post, "POST")

        # send notification to poster
    except Exception as e:
        raise Exception(e)

    return app.dict()


@app.route("/getPost/<id>", methods=['GET'])
def getPost(id):
    post = prisma.jobpost.find_first(
        where={
            'id': int(id)
        })
    return {"post": post.dict()} if post else {"post": None}


@app.route("/userposts/<user>", methods=['GET'])
def userPosts(user):
    try:
        posts = prisma.jobpost.find_many(
            take=10,
            where={
                'posterId': int(user),
                'status': 'ACTIVE'
            })
    except Exception as e:
        raise Exception(e)
    return [post.dict() for post in posts]


if __name__ == '__main__':
    app.run(debug=True)
