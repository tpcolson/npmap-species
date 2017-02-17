from django.conf.urls import include, url
from django.contrib import admin

from npmap.flexview.views import index, mds


urlpatterns = [
    url(r'^$', index, name='index'),
    url(r'^mds/', mds, name='mds'),

    url(r'^admin/', include(admin.site.urls)),
]
