{% for import_object in import_list %}
from {{import_object.file}} import {{import_object.name}}
{% endfor %}