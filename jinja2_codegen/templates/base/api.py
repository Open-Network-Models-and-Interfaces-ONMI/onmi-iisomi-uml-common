from flask import json, Blueprint, request, Response
from flask.views import MethodView
{% if auth %}
import base64
import re
{% endif %}

# BACKEND FUNCTIONS
{% for import_object in functions_import_list -%}
from {{import_object.file}} import {{import_object.name}}
{% endfor %}

# CALLABLE OBJECTS
{% for import_object in objects_import_list -%}
from {{import_object.file}} import {{import_object.name}}
{% endfor %}

urls = [
{% for url_object in url_object_list -%}
    ("{{url_object.path}}" , "{{url_object.callback}}"),
{% endfor -%}
]

{% if auth %}
users = {{users}}
{% endif %}

class NotFoundError(Response):
    def __init__(self, message):
        super(NotFoundError, self).__init__()
        self.status = '404 '+message
        self.status_code = 404
        self.headers = {'Content-Type': 'text/html'}
        self.data = '<h1>'+message+'</h1>'

class BadRequestError(Response):
    def __init__(self, message):
        super(BadRequestError, self).__init__()
        self.status = '400 '+message
        self.status_code = 400
        self.headers = {'Content-Type': 'text/html'}
        self.data = '<h1>'+message+'</h1>'

class Successful(Response):
    def __init__(self, message, info=''):
        super(Successful, self).__init__()
        self.status = '200 '+message
        self.status_code = 200
        self.headers = {'Content-Type': 'application/json'}
        self.data = info

{% if auth %}
class basicauth:

    @classmethod
    def check(self,auth):
        if auth is not None:
            auth2 = re.sub("^Basic ","", auth)
            user,pswd = base64.decodestring(auth2).split(':')
            if user in users.keys() and pswd == users[user]:
                return True
            else:
                return False
        else:
            return False
{% endif %}

{% for callback in callback_list %}

#{{callback.path}}
class {{callback.name}}:
    {% if callback.methods['PUT'] %}

    def PUT(self, {{callback.arguments|join(', ')}}):
        {% if auth %}
        if not basicauth.check(web.ctx.env.get("HTTP_AUTHORIZATION")):
            web.header('WWW-Authenticate','Basic realm="Auth example"')
            web.ctx.status = '401 Unauthorized'
            return 'Unauthorized'
        {% endif %}
        print "{{callback.methods['PUT'].printstr}}"
        {% if cors %}
        web.header('Access-Control-Allow-Origin','{{url}}')
        {% endif %}
        json_string = web.data() #data in body
        json_struct = json.loads(json_string) #json parser.
        {% if not callback.thing | is_instance(dict) %}
        new_object = {{callback.thing}}(json_struct) #It creates an object instance from the json_input data.
        {% else %}
        new_object = json_struct
        {% endif %}
        response = {{callback.name}}Impl.put({{callback.arguments|join(', ')}} {% if callback.arguments|count >0 %}, {% endif %}new_object)
        raise Successful('Successful operation','{"description":"{{callback.methods['PUT'].printstr}}"}')
    {% endif %}
    {% if callback.methods['POST'] %}

    def POST(self, {{callback.arguments|join(', ')}}):
        {% if auth %}
        if not basicauth.check(web.ctx.env.get("HTTP_AUTHORIZATION")):
            web.header('WWW-Authenticate','Basic realm="Auth example"')
            web.ctx.status = '401 Unauthorized'
            return 'Unauthorized'
        {% endif %}
        print "{{callback.methods['POST'].printstr}}"
        {% if cors %}
        web.header('Access-Control-Allow-Origin','{{url}}')
        {% endif %}
        json_string = web.data() #data in body
        json_struct = json.loads(json_string) #json parser.
        {% if not callback.thing | is_instance(dict) %}
        new_object = {{callback.thing}}(json_struct) #It creates an object instance from the json_input data.
        {% else %}
        new_object = json_struct
        {% endif %}
        response = {{callback.name}}Impl.post({{callback.arguments|join(', ')}} {% if callback.arguments|count >0 %}, {% endif %} new_object)
        raise Successful('Successful operation','{"description":"{{callback.methods['POST'].printstr}}"}')
    {% endif %}
    {% if callback.methods['DELETE'] %}

    def DELETE(self, {{callback.arguments|join(', ')}}):
        {% if auth %}
        if not basicauth.check(web.ctx.env.get("HTTP_AUTHORIZATION")):
            web.header('WWW-Authenticate','Basic realm="Auth example"')
            web.ctx.status = '401 Unauthorized'
            return 'Unauthorized'
        {% endif %}
        print "{{callback.methods['DELETE'].printstr}}"
        {% if cors %}
        web.header('Access-Control-Allow-Origin','{{url}}')
        {% endif %}
        response = {{callback.name}}Impl.delete({{callback.arguments|join(', ')}})
        raise Successful('Successful operation','{"description":"{{callback.methods['DELETE'].printstr}}"}')
    {% endif %}
    {% if callback.methods['GET'] %}

    def GET(self, {{callback.arguments|join(', ')}}):
        {% if auth %}
        if not basicauth.check(web.ctx.env.get("HTTP_AUTHORIZATION")):
            web.header('WWW-Authenticate','Basic realm="Auth example"')
            web.ctx.status = '401 Unauthorized'
            return 'Unauthorized'
        {% endif %}
        print "{{callback.methods['GET']['printstr']}}"
        {% if cors %}
        web.header('Access-Control-Allow-Origin','{{url}}')
        {% endif %}
        response = {{callback.name}}Impl.get({{callback.arguments|join(', ')}})
        raise Successful('Successful operation','{"description":"{{callback.methods['GET'].printstr}}"}')
    {% endif %}
    {% if cors %}

    def OPTIONS(self, {{callback.arguments|join(', ')}}):
        web.header('Access-Control-Allow-Origin','{{url}}')
        web.header('Access-Control-Allow-Headers','Origin, X-Requested-With, Content-Type, Accept, Authorization')
        raise Successful('Successful operation','{"description":"Options called CORS"}')
    {% endif %}

{% endfor %}
