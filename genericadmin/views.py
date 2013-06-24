try: 
    import json
except ImportError: 
    import simplejson as json
    
from django.http import HttpResponse, HttpResponseNotAllowed
from django.contrib.contenttypes.models import ContentType
from django.contrib.admin.widgets import url_params_from_lookup_dict
try:
    from django.utils.encoding import force_text as force_unicode
except ImportError:
    from django.utils.encoding import force_unicode

def get_obj(content_type_id, object_id):
    obj_dict = {
        'content_type_id': content_type_id,
        'object_id': object_id,
    }
    
    content_type = ContentType.objects.get(pk=content_type_id)
    
    obj_dict["content_type_text"] = force_unicode(content_type)
    
    try:
        obj = content_type.get_object_for_this_type(pk=object_id)
        obj_dict["object_text"] = force_unicode(obj)
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
        if 'content_type' in request.GET and 'object_id' in request.GET:
            obj = get_obj(request.GET['content_type'], request.GET['object_id'])
            objects.append(obj)
        
        response = HttpResponse(mimetype='application/json')
        json.dump(objects, response, ensure_ascii=False)
        return response
    return HttpResponseNotAllowed(['GET'])

def get_generic_rel_list(request, blacklist=(), whitelist=(), url_params={}):
    if request.method == 'GET':
        obj_dict = {}
        for c in ContentType.objects.all().order_by('id'):
            val = force_unicode('%s/%s' % (c.app_label, c.model))
            params = url_params.get('%s.%s' % (c.app_label, c.model), {})
            params = url_params_from_lookup_dict(params)
            if whitelist:
                if val in whitelist:
                    obj_dict[c.id] = (val, params)
            else:
                if val not in blacklist:
                    obj_dict[c.id] = (val, params)

        response = HttpResponse(mimetype='application/json')
        json.dump(obj_dict, response, ensure_ascii=False)
        return response
    return HttpResponseNotAllowed(['GET'])
