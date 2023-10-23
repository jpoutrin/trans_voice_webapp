import webview
from app import app

if __name__ == '__main__':
    webview.create_window('Trans Voice', app)
    webview.start(http_server=True, gui='qt', private_mode=False, debug=True)


# if __name__ == "__main__":
#     app.run(host="127.0.0.1", port=5001, debug=True)

