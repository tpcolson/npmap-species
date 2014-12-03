import tornado.websocket
import tornado.web
import sys
import os
import time

class IndexHandler(tornado.web.RequestHandler):
	def get(self):
		self.render('twincreeks.html')

class WebSocketHandler(tornado.websocket.WebSocketHandler):
	def open(self):
		print 'connection to client established'

	def on_message(self, request):
		option, contents = request.split(':', 1)

		now = time.strftime('%c')
		file = open('maxent_config/config.txt', 'w')

		file.write(contents)
		file.close()

		os.system('git pull')
		os.system('git add maxent_config/config.txt')
		os.system('git commit -m "Updated config file: ' + now + '"')
		os.system('git push')

	def on_close(self):
		print 'connection to client closed'
