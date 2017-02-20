from django.http import HttpResponse, Http404
from django.conf import settings
from django.shortcuts import render
from django.views.decorators.http import require_GET, require_POST
from django.views.decorators.gzip import gzip_page

import os


@require_GET
def index(request):
	context = {
		'DEBUG': settings.DEBUG,
	}

	return render(request, 'index.html', context=context)


@require_POST
@gzip_page
def mds(request):
	try:
		pathname = os.path.join(settings.STATICFILES_DIRS[0], 'data/sim_matrix.json')
		sim_matrix_file = open(pathname, 'rb')
		response = HttpResponse(content=sim_matrix_file)
		response['Content-Type'] = 'application/json'
		return response
	except IOError:
		raise Http404('File does not exist')
