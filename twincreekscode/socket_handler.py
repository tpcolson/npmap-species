import tornado.websocket
import tornado.web
import sys
import os
import time
import smtplib

class IndexHandler(tornado.web.RequestHandler):
	def get(self):
		self.render('twincreeks.html')

class WebSocketHandler(tornado.websocket.WebSocketHandler):
	def open(self):
		print 'connection to client established'

	def on_message(self, request):
		now = time.strftime('%c')
		file = open('maxent_config/config.txt', 'w')

		contents = request
		file.write(contents)
		file.close()

		os.system('git pull')
		os.system('git add maxent_config/config.txt')
		os.system('git commit -m "Updated config file: ' + now + '"')
		os.system('git push')

		try:
			smtp_obj = smtplib.SMTP('localhost')
			smtp_obj.sendmail('jduggan1@vols.utk.edu', ['lyu6@vols.utk.edu'], '''
				From: TwinCreeks WebServer
				To: Lonnie Yu <lyu6.vols.utk.edu>
				Subject: Updated maxent configuration file

				The maxent configuration file has been updated.  Please do yo thang.
			''')
			print 'email sent'
		except SMTPException:
			print 'email failed'

	def on_close(self):
		print 'connection to client closed'
