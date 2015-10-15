from tornado.websocket import WebSocketHandler
from tornado.web import Application
from tornado.ioloop import IOLoop
from os.path import getsize

class Server(WebSocketHandler):
    def open(self):
        pass

    def on_message(self, message):
        i = 0
        while True:
            try:
                if getsize('logs/' + str(i) + '.log', 'r') < 50000000:
                    break
                else:
                    i += 1
            except:
                break
        f = open('logs/' + str(i) + '.log', 'a')
        f.write(message + '\n')
        f.close()

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
