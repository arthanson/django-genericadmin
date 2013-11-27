import json
from functools import update_wrapper

from django.contrib import admin
from django.conf.urls import patterns, url
from django.conf import settings
from django.contrib.contenttypes import generic
from django.contrib.contenttypes.models import ContentType
try:
    from django.utils.encoding import force_text 
except ImportError:
    from django.utils.encoding import force_unicode as force_text
from django.utils.text import capfirst
from django.contrib.admin.widgets import url_params_from_lookup_dict
from django.http import HttpResponse, HttpResponseNotAllowed, Http404
try:
    from django.contrib.admin.views.main import IS_POPUP_VAR
except ImportError:
    from django.contrib.admin.options import IS_POPUP_VAR
from  django.core.exceptions import ObjectDoesNotExist

JS_PATH = getattr(settings, 'GENERICADMIN_JS', 'genericadmin/js/') 

class BaseGenericModelAdmin(object):
    class Media:
        js = ()

    content_type_lookups = {}
    generic_fk_fields = []
    content_type_blacklist = []
    content_type_whitelist = []
    
    def __init__(self, model, admin_site):
        try:
            media = list(self.Media.js)
        except:
            media = []
        media.append(JS_PATH + 'genericadmin.js')
        self.Media.js = tuple(media)
            
        super(BaseGenericModelAdmin, self).__init__(model, admin_site)

    def get_generic_field_list(self, request, prefix=''):
        if hasattr(self, 'ct_field') and hasattr(self, 'ct_fk_field'):
            exclude = [self.ct_field, self.ct_fk_field]
        else:
            exclude = []
        
        field_list = []
        if hasattr(self, 'generic_fk_fields') and self.generic_fk_fields:
            for fields in self.generic_fk_fields:
                if fields['ct_field'] not in exclude and \
                        fields['fk_field'] not in exclude:
                    fields['inline'] = prefix != ''
                    fields['prefix'] = prefix
                    field_list.append(fields)
        else:    
            for field in self.model._meta.virtual_fields:
                if isinstance(field, generic.GenericForeignKey) and \
                        field.ct_field not in exclude and field.fk_field not in exclude:
                    field_list.append({
                        'ct_field': field.ct_field, 
                        'fk_field': field.fk_field,
                        'inline': prefix != '',
                        'prefix': prefix,
                    })
                    
        if hasattr(self, 'inlines') and len(self.inlines) > 0:
            for FormSet, inline in zip(self.get_formsets(request), self.get_inline_instances(request)):
                prefix = FormSet.get_default_prefix()
                field_list = field_list + inline.get_generic_field_list(request, prefix)
        
        return field_list

    def get_urls(self):
        def wrap(view):
            def wrapper(*args, **kwargs):
                return self.admin_site.admin_view(view)(*args, **kwargs)
            return update_wrapper(wrapper, view)
        
        custom_urls = patterns('',
            url(r'^obj-data/$', wrap(self.generic_lookup), name='admin_genericadmin_obj_lookup'),
            url(r'^genericadmin-init/$', wrap(self.genericadmin_js_init), name='admin_genericadmin_init'),
        )
        return custom_urls + super(BaseGenericModelAdmin, self).get_urls()
            
    def genericadmin_js_init(self, request):
        if request.method == 'GET':
            obj_dict = {}
            for c in ContentType.objects.all():
                val = force_text('%s/%s' % (c.app_label, c.model))
                params = self.content_type_lookups.get('%s.%s' % (c.app_label, c.model), {})
                params = url_params_from_lookup_dict(params)
                if self.content_type_whitelist:
                    if val in self.content_type_whitelist:
                        obj_dict[c.id] = (val, params)
                elif val not in self.content_type_blacklist:
                    obj_dict[c.id] = (val, params)
        
            data = {
                'url_array': obj_dict,
                'fields': self.get_generic_field_list(request),
                'popup_var': IS_POPUP_VAR,
            }
            resp = json.dumps(data, ensure_ascii=False)
            return HttpResponse(resp, mimetype='application/json')
        return HttpResponseNotAllowed(['GET'])
    
    def generic_lookup(self, request):
        if request.method != 'GET':
            return HttpResponseNotAllowed(['GET'])
        
        if 'content_type' in request.GET and 'object_id' in request.GET:
            content_type_id = request.GET['content_type']
            object_id = request.GET['object_id']
            
            obj_dict = {
                'content_type_id': content_type_id,
                'object_id': object_id,
            }

            content_type = ContentType.objects.get(pk=content_type_id)
            obj_dict["content_type_text"] = capfirst(force_text(content_type))

            try:
                obj = content_type.get_object_for_this_type(pk=object_id)
                obj_dict["object_text"] = capfirst(force_text(obj))
            except ObjectDoesNotExist:
                raise Http404
            
            resp = json.dumps(obj_dict, ensure_ascii=False)
        else:
            resp = ''
        return HttpResponse(resp, mimetype='application/json')
        


class GenericAdminModelAdmin(BaseGenericModelAdmin, admin.ModelAdmin):
    """Model admin for generic relations. """


class GenericTabularInline(BaseGenericModelAdmin, generic.GenericTabularInline):
    """Model admin for generic tabular inlines. """ 


class GenericStackedInline(BaseGenericModelAdmin, generic.GenericStackedInline):
    """Model admin for generic stacked inlines. """


class TabularInlineWithGeneric(BaseGenericModelAdmin, admin.TabularInline):
    """"Normal tabular inline with a generic relation"""


class StackedInlineWithGeneric(BaseGenericModelAdmin, admin.StackedInline):
    """"Normal stacked inline with a generic relation"""