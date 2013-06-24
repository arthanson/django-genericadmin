from django.contrib import admin
from django.conf.urls import patterns, url
from django.conf import settings
from django.contrib.contenttypes import generic

from genericadmin.views import generic_lookup, get_generic_rel_list

JS_PATH = getattr(settings, 'GENERICADMIN_JS', 'genericadmin/js/') 

class BaseGenericModelAdmin(object):
    class Media:
        js = ()

    content_type_lookups = {}
    
    def __init__(self, model, admin_site):
        self.grappelli = False
        try:
            media = list(self.Media.js)
        except:
            media = []
        #if 'grappelli' in settings.INSTALLED_APPS:
        #    media.append(JS_PATH + 'genericadmin-grappelli.js')
        #    self.grappelli = True
        #if not self.grappelli:
        media.append(JS_PATH + 'genericadmin.js')
        self.Media.js = tuple(media)
        super(BaseGenericModelAdmin, self).__init__(model, admin_site)

    def get_urls(self):
        base_urls = super(BaseGenericModelAdmin, self).get_urls()
        opts = self.get_generic_relation_options()
        custom_urls = patterns('',
            url(r'^obj/$', self.admin_site.admin_view(generic_lookup), name='admin_genericadmin_obj_lookup'),
            url(r'^get-generic-rel-list/$', self.admin_site.admin_view(get_generic_rel_list), kwargs=opts, 
                name='admin_genericadmin_rel_list'),
        )
        return custom_urls + base_urls

    def get_generic_relation_options(self):
        """ Return a dictionary of keywords that are fed to the get_generic_rel_list view """
        return {'url_params': self.content_type_lookups,
                'blacklist': self.get_blacklisted_relations(),
                'whitelist': self.get_whitelisted_relations()}

    def get_blacklisted_relations(self):
        try:
            return self.content_type_blacklist
        except (AttributeError, ):
            return ()

    def get_whitelisted_relations(self):
        try:
            return self.content_type_whitelist
        except (AttributeError, ):
            return ()


class GenericAdminModelAdmin(BaseGenericModelAdmin, admin.ModelAdmin):
    """Model admin for generic relations. """


class GenericTabularInline(BaseGenericModelAdmin, generic.GenericTabularInline):
    """Model admin for generic tabular inlines. """ 


class GenericStackedInline(BaseGenericModelAdmin, generic.GenericStackedInline):
    """Model admin for generic stacked inlines. """

