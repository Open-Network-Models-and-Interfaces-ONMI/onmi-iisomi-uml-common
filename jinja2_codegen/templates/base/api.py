from flask import json, Blueprint, request, Response
from flask.views import MethodView
import sys
from objects_common.keyedArrayType import KeyedArrayKeyError

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



def byteify(input):
    # Convert JSON unicode strings to python byte strings, recursively on a json_struct
    if isinstance(input, dict):
        return {byteify(key):byteify(value) for key,value in input.iteritems()}
    elif isinstance(input, list):
        return [byteify(element) for element in input]
    elif isinstance(input, unicode):
        return input.encode('utf-8')
    else:
        return input

def json_loads(json_string):
    # Try to use json.loads and raise HTTP Error
    try:
        json_struct = json.loads(json_string) #json parser.
    except ValueError:
        raise BadRequestError("Malformed JSON")
    else:
        return byteify(json_struct)

def json_dumps(js):
    # Pretty-print version of json.dumps
    return json.dumps(js, sort_keys=True, indent=4, separators=(',', ': '))

def create_instance(klass, json_struct, id=None):
    # Try to create an object instance and raise HTTP Errors
    try:
        new_object = klass(json_struct) # Creates an object instance of type klass from the json_struct data
    except KeyError as inst:
        return BadRequestError("Unknown entity name in JSON:" + "<br>" + inst.args[0])
    except TypeError as inst:
        key = inst.args[0]
        value = json.dumps(inst.args[1])
        return BadRequestError("Incorrect type in JSON:" + "<br>" +
                              key + " was:" + "<br>" +
                              value + "<br>" +
                              "Allowed type:" + "<br>" +
                              inst.args[2])
    except ValueError as inst:
        if type(inst.args[1]) == str:
            return BadRequestError("Incorrect value in JSON:" + "<br>" +
                                  "Enum " + inst.args[0] + " was:" + "<br>" +
                                  inst.args[1] + "<br>" +
                                  "Allowed values:" + "<br>" +
                                  "[" + ", ".join(inst.args[2]) + "]")
        elif type(inst.args[1]) == int:
            return BadRequestError("Incorrect value in JSON:" + "<br>" +
                                  "Enum " + inst.args[0] + " was:" + "<br>" +
                                  str(inst.args[1]) + "<br>" +
                                  "Allowed range:" + "<br>" +
                                  "1 - " + str(inst.args[2]))
    except KeyedArrayKeyError as inst:
        return BadRequestError("Error in JSON:" + "<br>" +
                              "Missing key in list:" + "<br>" +
                              inst.args[0] + "<br>" +
                              "Received JSON:" + "<br>" +
                              json.dumps(inst.args[1]) + "<br>" +
                              "Key name:" + "<br>" +
                              inst.args[2])
    else:
        # Check if the id given in the URL matches the id given in the body
        if id != None and id[0] != getattr(new_object, id[1]):
            return BadRequestError(id[1] + " in body not matching " + id[1] + " in URL")
        else:
            return new_object

def modify_instance(existing_object, json_struct):
    try:
        existing_object.load_json(json_struct)
    except KeyError as inst:
        return BadRequestError("Unknown entity name in JSON:" + "<br>" + inst.args[0])
    except TypeError as inst:
        key = inst.args[0]
        value = json.dumps(inst.args[1])
        return BadRequestError("Incorrect type in JSON:" + "<br>" +
                              key + " was:" + "<br>" +
                              value + "<br>" +
                              "Allowed type:" + "<br>" +
                              inst.args[2])
    except ValueError as inst:
        if type(inst.args[1]) == str:
            return BadRequestError("Incorrect value in JSON:" + "<br>" +
                                  "Enum " + inst.args[0] + " was:" + "<br>" +
                                  inst.args[1] + "<br>" +
                                  "Allowed values:" + "<br>" +
                                  "[" + ", ".join(inst.args[2]) + "]")
        elif type(inst.args[1]) == int:
            return BadRequestError("Incorrect value in JSON:" + "<br>" +
                                  "Enum " + inst.args[0] + " was:" + "<br>" +
                                  str(inst.args[1]) + "<br>" +
                                  "Allowed range:" + "<br>" +
                                  "1 - " + str(inst.args[2]))
    except KeyedArrayKeyError as inst:
        return BadRequestError("Error in JSON:" + "<br>" +
                              "Missing key in list:" + "<br>" +
                              inst.args[0] + "<br>" +
                              "Received JSON:" + "<br>" +
                              json.dumps(inst.args[1]) + "<br>" +
                              "Key name:" + "<br>" +
                              inst.args[2])
    else:
        return existing_object


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

class Unauthorized(Response):
    def __init__(self, message):
        super(Unauthorized, self).__init__()
        self.status = '401 '+message
        self.status_code = 401
        self.headers = {'WWW-Authenticate','Basic realm="Auth example"'}
        self.data = '<h1>'+message+'</h1>'

class Successful(Response):
    def __init__(self, message, info=''):
        super(Successful, self).__init__()
        self.status = '200 '+message
        self.status_code = 200
        self.headers = {'Content-Type': 'application/json'}
        self.data = info

{% for callback in callback_list %}

#{{callback.path}}
class {{callback.name}}(MethodView):
    {% if callback.methods['PUT'] %}

    def put(self, {{callback.arguments|join(', ')}}):
        print "{{callback.methods['PUT'].printstr}}"
        json_struct = request.get_json() #json parser.
    {% if callback.thing %}
        try:
            existing_object = {{callback.name}}Impl.get({{callback.arguments|join(', ')}})
        except KeyError as inst:
            if inst.args[0] != '{{callback.arguments|last()}}':
                return NotFoundError(inst.args[0] + " not found")

            new_object = create_instance({{callback.thing}}, json_struct)
            if isinstance(new_object, BadRequestError):
                return new_object
            elif isinstance(new_object, NotFoundError):
                return new_object
            else:
                try:
                {% if callback.arguments %}
                    {{callback.name}}Impl.put({{callback.arguments|join(', ')}}, new_object)
                {% else %}
                    {{callback.name}}Impl.put(new_object)
                {% endif %}
                    js=new_object.json_serializer()
                except KeyError as inst:
                    return NotFoundError(inst.args[0] + " not found")
        else:
            existing_object = modify_instance(existing_object, json_struct)
            if isinstance(existing_object, BadRequestError):
                return existing_object
            elif isinstance(existing_object, NotFoundError):
                return existing_object
            else:
                try:
                {% if callback.arguments %}
                    {{callback.name}}Impl.put({{callback.arguments|join(', ')}}, existing_object)
                {% else %}
                    {{callback.name}}Impl.put(existing_object)
                {% endif %}
                    js=existing_object.json_serializer()
                except KeyError as inst:
                    return NotFoundError(inst.args[0] + " not found")

        return Successful("Successful operation",json_dumps(js))

    {% else %}
        json_struct = request.get_json() #json parser.
        {% if not callback.thing | is_instance(dict | type) %}
        new_object = {{callback.thing}}(json_struct) #It creates an object instance from the json_input data.
        {% else %}
        new_object = json_struct
        {% endif %}
        response = {{callback.name}}Impl.put({{callback.arguments|join(', ')}} {% if callback.arguments|count >0 %}, {% endif %}new_object)
        return Successful('Successful operation','{"description":"{{callback.methods['PUT'].printstr}}"}')
    {% endif %}

    {% endif %}
    {% if callback.methods['POST'] %}

    def post(self, {{callback.arguments|join(', ')}}):
        print "{{callback.methods['POST'].printstr}}"
        {% if callback.thing %}
        try:
            response = {{callback.name}}Impl.get({{callback.arguments|join(', ')}})
        except KeyError as inst:
            if inst.args[0] != '{{callback.arguments|last()}}':
                return NotFoundError(inst.args[0] + " not found")

            json_struct = request.get_json() #json parser.
            {% if callback.check_id %}
            new_object = create_instance({{callback.thing}}, json_struct, ({{callback.arguments|last()}},'{{callback.arguments|last()}}'))
            {% else %}
            new_object = create_instance({{callback.thing}}, json_struct)
            {% endif %}
            if isinstance(new_object, BadRequestError):
                return new_object
            elif isinstance(new_object, NotFoundError):
                return new_object
            else:
                try:
                {% if callback.arguments %}
                    {{callback.name}}Impl.post({{callback.arguments|join(', ')}}, new_object)
                {% else %}
                    {{callback.name}}Impl.post(new_object)
                {% endif %}
                    js=new_object.json_serializer()
                except KeyError as inst:
                    return NotFoundError(inst.args[0] + " not found")
        else:
            return BadRequestError("Object already exists. For updates use PUT.")
        return Successful("Successful operation",json_dumps(js))

        {% else %}
        json_struct = request.get_json() #json parser.
        {% if not callback.thing | is_instance(dict | type) %}
        new_object = {{callback.thing}}(json_struct) #It creates an object instance from the json_input data.
        {% else %}
        new_object = json_struct
        {% endif %}
        response = {{callback.name}}Impl.post({{callback.arguments|join(', ')}} {% if callback.arguments|count >0 %}, {% endif %}new_object)
        return Successful('Successful operation','{"description":"{{callback.methods['POST'].printstr}}"}')
        {% endif %}
    {% endif %}
    {% if callback.methods['DELETE'] %}

    def delete(self, {{callback.arguments|join(', ')}}):
        print "{{callback.methods['DELETE'].printstr}}"
        try:
            response={{callback.name}}Impl.delete({{callback.arguments|join(', ')}})
        except KeyError as inst:
            return NotFoundError(inst.args[0] + " not found")
        else:
            return Successful('Successful operation')

    {% endif %}
    {% if callback.methods['GET'] %}

    def get(self, {{callback.arguments|join(', ')}}):
        print "{{callback.methods['GET']['printstr']}}"
        try:
            response = {{callback.name}}Impl.get({{callback.arguments|join(', ')}})
        except KeyError as inst:
            return NotFoundError(inst.args[0] + " not found")
        else:
            js = response.json_serializer()
            return Successful("Successful operation",json_dumps(js))
    {% endif %}

{% endfor %}


{% for url_object in url_object_list %}
getattr(sys.modules[__name__], __name__).add_url_rule("{{url_object.path}}", view_func = globals()["{{url_object.callback}}"].as_view('"{{url_object.callback}}"'+'"_api"'), methods={{url_object.methods}})
{% endfor %}