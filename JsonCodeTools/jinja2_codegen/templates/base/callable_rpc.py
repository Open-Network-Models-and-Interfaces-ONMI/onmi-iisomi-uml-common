import os.path, sys
sys.path.append(os.path.join('/'.join(os.path.dirname(os.path.realpath(__file__)).split('/')[:-1])))

{% macro tab(num) -%}
{{'    '*num}}
{%- endmacro %}

class {{class_name}}Impl:
    {% if methods['POST'] %}

    @classmethod
    def post(cls, {{methods['POST'].arguments|join(', ')}}):
        {% if methods['POST'].printstr and methods['POST'].printstr | length > 0 %}
        print str({{methods['POST'].printstr}})
        {% endif %}
        print 'handling RPC operation'
    {% endif %}
