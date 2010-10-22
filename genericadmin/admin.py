from django.contrib import admin
from django.conf.urls.defaults import patterns, url
from genericadmin.views import generic_lookup, get_generic_rel_list
from django.conf import settings

JS_PATH = settings.MEDIA_URL + getattr(settings, 'GENERICADMIN_JS', '/genericadmin/js/genericadmin.js') 

class GenericAdminModelAdmin(admin.ModelAdmin):
    class Media:
        js = (JS_PATH,)

    def get_urls(self):
        base_urls = super(GenericAdminModelAdmin, self).get_urls()
        custom_urls = patterns('',
            url(r'^obj/$', self.admin_site.admin_view(generic_lookup), name='admin_genericadmin_obj_lookup'),
            url(r'^get-generic-rel-list/$', self.admin_site.admin_view(get_generic_rel_list), name='admin_genericadmin_rel_list'),
        )
        return custom_urls + base_urls
