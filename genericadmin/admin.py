from django.contrib import admin
from django.conf.urls import patterns, url
from django.conf import settings
from django.contrib.contenttypes import generic

from genericadmin.views import generic_lookup, genericadmin_js_init

JS_PATH = getattr(settings, 'GENERICADMIN_JS', 'genericadmin/js/') 

class BaseGenericModelAdmin(object):
    class Media:
        js = ()

    content_type_lookups = {}
    generic_fk_fields = []
    
    def __init__(self, model, admin_site):
        try:
            media = list(self.Media.js)
        except:
            media = []
        media.append(JS_PATH + 'genericadmin.js')
        self.Media.js = tuple(media)
        
        if len(self.generic_fk_fields) == 0:
            self.generic_fk_fields = self.find_generic_fields(model)
            
        super(BaseGenericModelAdmin, self).__init__(model, admin_site)

    def find_generic_fields(self, model):
        field_list = []
        for field in model._meta.virtual_fields:
            if isinstance(field, generic.GenericForeignKey):
                field_list.append({
                    'ct_field': field.ct_field, 
                    'fk_field': field.fk_field,
                })
        return field_list

    def get_urls(self):
        base_urls = super(BaseGenericModelAdmin, self).get_urls()
        opts = self.get_generic_relation_options()
        custom_urls = patterns('',
            url(r'^obj-data/$', self.admin_site.admin_view(generic_lookup), name='admin_genericadmin_obj_lookup'),
            url(r'^genericadmin-init/$', self.admin_site.admin_view(genericadmin_js_init), kwargs=opts, 
                name='admin_genericadmin_init'),
        )
        return custom_urls + base_urls

    def get_generic_relation_options(self):
        """ Return a dictionary of keywords that are fed to the get_generic_rel_list view """
        return {
            'url_params': self.content_type_lookups,
            'blacklist': self.get_blacklisted_relations(),
            'whitelist': self.get_whitelisted_relations(),
            'generic_fields': self.generic_fk_fields,
        }

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

