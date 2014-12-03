import tornado.websocket
import tornado.web
import sys
import os
import time

def push_and_email(contents):
	now = time.strftime('%c')
	file = open('/export/storage/seelab/npmap-species/twincreekscode/maxent_config/config.txt', 'w')

	file.write(contents)
	file.close()

	os.system('cd /export/storage/seelab/npmap-species/')
	os.system('git pull')
	os.system('git add twincreekscode/maxent_config/config.txt')
	os.system('git commit -m "Updated config file: ' + now + '"')
	os.system('git push')

	#TODO: replace js mail client here

def store(contents):
	#TODO: the whole thing
	pass

class WebSocketHandler(tornado.websocket.WebSocketHandler):
	def open(self):
		print 'connection to client established'

	def on_message(self, request):
		option, contents = request.split(':', 1)

		if option == 'push':
			push_and_email(contents)
		elif option == 'store':
			store(contents)

	def on_close(self):
		print 'connection to client closed'
