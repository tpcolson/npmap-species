from django.conf import settings
from django.shortcuts import render
from django.views.decorators.http import require_GET


@require_GET
def index(request):
	context = {
		'DEBUG': settings.DEBUG,
	}

	return render(request, 'index.html', context=context)
