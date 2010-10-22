try: 
    import json
except ImportError: 
    import simplejson as json
    
from django.http import HttpResponse
from django.core import serializers
from django.contrib.contenttypes.models import ContentType


def get_obj(content_type_id, object_id):
    obj_dict = {
        'content_type_id': content_type_id,
        'object_id': object_id,
    }
    
    content_type = ContentType.objects.get(pk=content_type_id)
    
    obj_dict["content_type_text"] = unicode(content_type)
    
    try:
        obj = content_type.get_object_for_this_type(pk=object_id)
        obj_dict["object_text"] = unicode(obj)
        try:
            obj_dict["object_url"] = obj.get_absolute_url()
        except AttributeError:
            obj_dict["object_url"] = ""
    except:
        obj_dict["object_text"] = ""

    return obj_dict

def generic_lookup(request):
    if request.method == 'GET':
        objects = []
        if request.GET.has_key('content_type') and request.GET.has_key('object_id'):
            obj = get_obj(request.GET['content_type'], request.GET['object_id'])
            objects.append(obj)

        print objects
        
        response = HttpResponse(mimetype='application/json')
        json.dump(objects, response, ensure_ascii=False)
        return response

def get_generic_rel_list(request):
    obj_dict = {}
    for c in ContentType.objects.all().order_by('id'):
        obj_dict[c.id] = u'%s/%s' % (c.app_label, c.model)
    
    response = HttpResponse(mimetype='application/json')
    json.dump(obj_dict, response, ensure_ascii=False)
    return response
