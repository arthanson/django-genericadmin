from django.db import models
from django.contrib import admin
from django.conf.urls.defaults import patterns, url
from genericadmin.views import generic_lookup

class Lookup(models.Model):
  """
  A `fake` model that gets registered so that we can create a custom admin
  url without having to override the default AdminSite.
  """
  class Meta:
    abstract = True

class GenericAdminModelAdmin(admin.ModelAdmin):
  model = Lookup
  
  def has_add_permission(self, request):
    return False
  
  def has_change_permission(self, request):
    return False
  
  def has_delete_permission(self, request):
    return False
  
  def get_urls(self):
    base_urls = super(GenericAdminModelAdmin, self).get_urls()
    custom_urls = patterns('',
      url(r'^obj/$', self.admin_site.admin_view(generic_lookup), name='admin_genericadmin_obj_lookup'),
    )
    return custom_urls + base_urls

admin.site.register(Lookup, GenericAdminModelAdmin)