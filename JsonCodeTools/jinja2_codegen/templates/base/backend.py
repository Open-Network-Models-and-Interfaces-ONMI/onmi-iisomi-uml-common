# Example, only works for COP
import json

from objects_common.keyedArrayType import KeyedArrayType
{% for import_object in objects_import_list -%}
from {{import_object.file}} import {{import_object.schema}} as {{import_object.schema}}_object
{% endfor %}

"""
class TopLevelObject(jsonObject):
    def __init__(self):
        self.calls = KeyedArrayType(Call, 'callId')
        self.connections = KeyedArrayType(Connection, 'connectionId')
        super(TopLevelObject, self).__init__()
"""

def json_dumps(js):
    # Pretty-print version of json.dumps
    return json.dumps(js, sort_keys=True, indent=4, separators=(',', ': '))


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

filename = 'server_backend_state.json'

{% for import_object in objects_import_list -%}
{% if import_object.yang_type == "list" %}
{{import_object.name}} = {}
{% else %}
{{import_object.name}} = {{import_object.schema}}_object()
{% endif %}
{% endfor %}

def save_state():
    json_struct = {}
    {% for import_object in objects_import_list %}
    {% if import_object.yang_type == "list" %}
    json_struct['{{import_object.name}}'] = {}
    for {{import_object.name}}It in {{import_object.name}}:
        json_struct['{{import_object.name}}'][{{import_object.name}}It] = {{import_object.name}}[{{import_object.name}}It].json_serializer() 
    {% else %}
    json_struct['{{import_object.name}}'] = {{import_object.name}}.json_serializer()
    {% endif %}
    {% endfor %}

    json_string = json_dumps(json_struct)
    out = open(filename, 'w+')
    out.write(json_string)
    out.close()
    return True

def load_state():
    f = open(filename, 'rb')
    json_string = f.read()
    f.close()
    json_struct = byteify(json.loads(json_string))
    {% for import_object in objects_import_list %}
    global {{import_object.name}}
    {% if import_object.yang_type == "list" %}
    for {{import_object.name}}It in json_struct['{{import_object.name}}']:
        {{import_object.name}}[{{import_object.name}}It]={{import_object.schema}}_object(json_struct['{{import_object.name}}'][{{import_object.name}}It])
    {% else %}
    {{import_object.name}} = {{import_object.schema}}_object(json_struct['{{import_object.name}}'])
    {% endif %}
    {% endfor %}
    return True
