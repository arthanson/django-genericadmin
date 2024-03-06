import re
import pytest
from playwright.sync_api import Page, expect


class Params:
    def __init__(self):
        self.obj_root_from_change = '../../'
        self.user_model_option = 'Authentication and Authorization | user'


def connect(page: Page):
    page.goto("http://localhost:8000/")
    page.locator('#id_username').fill('admin')
    page.locator('#id_password').fill('admin')
    page.locator('#login-form input[type="submit"]').click()
    expect(page.locator('#user-tools')).to_have_text(re.compile(r'^\s*Welcome,\s*admin.'))
    
    params = Params()
    django_version = page.locator('#site-name a').text_content()
    if django_version in ['1.7', '1.8']:
        params.obj_root_from_change = '../'

    if django_version.startswith(('1.', '2.')):
        params.user_model_option = 'User'        
    elif django_version.startswith(('3.', '4.')):
        params.user_model_option = 'Auth | user'

    return params


def test_change(page: Page):
    params = connect(page)

    page.goto('http://localhost:8000/demo/taggeditem/1/')
    expect(page.locator('#lookup_id_object_id')).to_have_attribute('href', f'{params.obj_root_from_change}../../auth/user/')
    expect(page.locator('#lookup_text_id_object_id a')).to_have_attribute('target', '_new')
    expect(page.locator('#lookup_text_id_object_id a')).to_have_attribute('href', f'{params.obj_root_from_change}../../auth/user/1')
    expect(page.locator('#lookup_text_id_object_id a')).to_have_text(f'{params.user_model_option}: Admin')

    with page.expect_popup() as popup_info:
        page.locator('#lookup_id_object_id').click()
    popup = popup_info.value

    popup.wait_for_load_state()
    expect(popup).to_have_title(re.compile(r'^Select user '))

    with popup.expect_event('close'):
        popup.locator('.field-username a:has-text("other")').click()

    expect(page.locator('#id_object_id')).to_have_value('2')
    expect(page.locator('#lookup_text_id_object_id a')).to_have_text(f'{params.user_model_option}: Other')

    page.locator('#id_object_id').fill('1')
    page.focus('input[type="submit"]')
    expect(page.locator('#lookup_text_id_object_id a')).to_have_text(f'{params.user_model_option}: Admin')


def test_add(page: Page):
    params = connect(page)

    page.goto('http://localhost:8000/demo/taggeditem/add/')

    expect(page.locator('#lookup_id_object_id')).not_to_be_visible()

    page.locator('#id_tag').fill('other-tag')
    page.locator('#id_content_type').select_option(params.user_model_option)

    expect(page.locator('#lookup_id_object_id')).to_be_visible()

    page.locator('#id_object_id').fill('2')
    page.focus('input[type="submit"]')
    expect(page.locator('#lookup_text_id_object_id a')).to_have_attribute('target', '_new')
    expect(page.locator('#lookup_text_id_object_id a')).to_have_attribute('href', '../../../auth/user/2')
    expect(page.locator('#lookup_text_id_object_id a')).to_have_text(f'{params.user_model_option}: Other')
