from tornado.websocket import WebSocketHandler
from tornado.web import Application
from tornado.ioloop import IOLoop

class Server(WebSocketHandler):
    def open(self):
        pass

    def on_message(self, message):
        print message

    def on_close(self):
        pass

    def check_origin(self, origin):
        return True

app = Application([
    (r'/ws', Server)
])

if __name__ == '__main__':
    app.listen(7777)
    IOLoop.instance().start()
