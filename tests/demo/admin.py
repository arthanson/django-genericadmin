from django.contrib.admin import register
from genericadmin.admin import GenericAdminModelAdmin
from .models import TaggedItem

@register(TaggedItem)
class TaggedItemAdmin(GenericAdminModelAdmin):
    list_display = ['tag', 'content_object']
