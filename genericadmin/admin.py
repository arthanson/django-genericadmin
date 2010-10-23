from django.contrib import admin
from django.conf.urls.defaults import patterns, url
from genericadmin.views import generic_lookup, get_generic_rel_list
from django.conf import settings

JS_PATH = getattr(settings, 'GENERICADMIN_JS', 'genericadmin/js/') 

class GenericAdminModelAdmin(admin.ModelAdmin):
    class Media:
        js = ()

    def __init__(self, model, admin_site):
        self.grappelli = False
        media = list(self.Media.js)
        for app in settings.INSTALLED_APPS:
            if app == 'grappelli':
                media.append(JS_PATH + 'genericadmin-grappelli.js')
                self.grappelli = True
        if not self.grappelli:
            media.append(JS_PATH + 'genericadmin.js')
        self.Media.js = tuple(media)
        super(GenericAdminModelAdmin, self).__init__(model, admin_site)

    def get_urls(self):
        base_urls = super(GenericAdminModelAdmin, self).get_urls()
        custom_urls = patterns('',
            url(r'^obj/$', self.admin_site.admin_view(generic_lookup), name='admin_genericadmin_obj_lookup'),
            url(r'^get-generic-rel-list/$', self.admin_site.admin_view(get_generic_rel_list), name='admin_genericadmin_rel_list'),
        )
        return custom_urls + base_urls
