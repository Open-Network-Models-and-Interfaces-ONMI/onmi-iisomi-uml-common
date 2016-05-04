from flask import json, Blueprint, request, Response
from flask.views import MethodView
import sys

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

{% if auth %}
users = {{users}}
{% endif %}

setattr(sys.modules[__name__], __name__,  Blueprint(__name__, __name__))

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
class {{callback.name}}(MethodView):
    {% if callback.methods['PUT'] %}

    def put(self, {{callback.arguments|join(', ')}}):
        print "{{callback.methods['PUT'].printstr}}"
        json_struct = request.get_json() #json parser.
        {% if not callback.thing | is_instance(dict| type) %}
        new_object = {{callback.thing}}(json_struct) #It creates an object instance from the json_input data.
        {% else %}
        new_object = json_struct
        {% endif %}
        response = {{callback.name}}Impl.put({{callback.arguments|join(', ')}} {% if callback.arguments|count >0 %}, {% endif %}new_object)
        return Successful('Successful operation','{"description":"{{callback.methods['PUT'].printstr}}"}')
    {% endif %}
    {% if callback.methods['POST'] %}

    def post(self, {{callback.arguments|join(', ')}}):
        print "{{callback.methods['POST'].printstr}}"
        json_struct = request.get_json() #json parser.
        {% if not callback.thing | is_instance(dict| type) %}
        new_object = {{callback.thing}}(json_struct) #It creates an object instance from the json_input data.
        {% else %}
        new_object = json_struct
        {% endif %}
        response = {{callback.name}}Impl.post({{callback.arguments|join(', ')}} {% if callback.arguments|count >0 %}, {% endif %} new_object)
        return Successful('Successful operation','{"description":"{{callback.methods['POST'].printstr}}"}')
    {% endif %}
    {% if callback.methods['DELETE'] %}

    def delete(self, {{callback.arguments|join(', ')}}):
        print "{{callback.methods['DELETE'].printstr}}"
        response = {{callback.name}}Impl.delete({{callback.arguments|join(', ')}})
        return Successful('Successful operation','{"description":"{{callback.methods['DELETE'].printstr}}"}')
    {% endif %}
    {% if callback.methods['GET'] %}

    def get(self, {{callback.arguments|join(', ')}}):
        print "{{callback.methods['GET']['printstr']}}"
        response = {{callback.name}}Impl.get({{callback.arguments|join(', ')}})
        return Successful('Successful operation','{"description":"{{callback.methods['GET'].printstr}}"}')
    {% endif %}

{% endfor %}


{% for url_object in url_object_list %}
getattr(sys.modules[__name__], __name__).add_url_rule("{{url_object.path}}", view_func = globals()["{{url_object.callback}}"].as_view('"{{url_object.callback}}"+_api'), methods={{url_object.methods}})
{% endfor %}
