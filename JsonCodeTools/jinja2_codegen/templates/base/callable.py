import os.path, sys
sys.path.append(os.path.join('/'.join(os.path.dirname(os.path.realpath(__file__)).split('/')[:-1])))
import backend.backend as be

{% macro tab(num) -%}
{{'    '*num}}
{%- endmacro %}

class {{class_name}}Impl:
    {% if methods['PUT'] %}

    @classmethod
    def put(cls, {{methods['PUT'].arguments|join(', ')}}):
        {% if methods['PUT'].printstr %}
        print str({{methods['PUT'].printstr}})
        {% endif %}
        print 'handling put'
        {% for i,attribute_object in methods['PUT'].arguments[:-2] | enumerate %}
        {{tab(i)}}if {{attribute_object}} in {{object_path[i]}}:
        {% endfor %}
        {%set arguments_length = (methods['PUT'].arguments | length | int) - 1 %}
        {%if (methods['PUT'].arguments | length | int) - 1 > 0 %}
        {{tab(arguments_length - 1)}}be.{{object_path[arguments_length - 1]}}[{{methods['PUT'].arguments[arguments_length - 1]}}] = {{methods['PUT'].arguments[arguments_length]}}
        {% else %}
        be.{{toplevel}} = {{methods['POST'].arguments[arguments_length]}}
        {% endif %}
        {% for i,attribute_object in methods['PUT'].arguments[:-2] | enumerate %}
        {{tab(arguments_length - (i + 2))}}else:
        {{tab(arguments_length - (i + 1))}}raise KeyError('{{methods['PUT'].arguments[arguments_length - (i + 1)]}}')
        {% endfor %}
    {% endif %}
    {% if methods['POST'] %}

    @classmethod
    def post(cls, {{methods['POST'].arguments|join(', ')}}):
        {% if methods['POST'].printstr %}
        print str({{methods['POST'].printstr}})
        {% endif %}
        print 'handling post'
        {% for i,attribute_object in methods['POST'].arguments[:-2] | enumerate %}
        {{tab(i)}}if {{attribute_object}} in {{object_path[i]}}:
        {% endfor %}
        {%set arguments_length = (methods['POST'].arguments | length | int) - 1 %}
        {%if (methods['POST'].arguments | length | int) - 1 > 0 %}
        {{tab(arguments_length -1)}}be.{{object_path[arguments_length - 1]}}[{{methods['POST'].arguments[arguments_length - 1]}}] = {{methods['POST'].arguments[arguments_length]}}
        {% else %}
        be.{{toplevel}} = {{methods['POST'].arguments[arguments_length]}}
        {% endif %}
        {% for i,attribute_object in methods['POST'].arguments[:-2] | enumerate %}
        {{tab(arguments_length - (i + 2))}}else:
        {{tab(arguments_length - (i + 1))}}raise KeyError('{{methods['POST'].arguments[arguments_length - (i + 1)]}}')
        {% endfor %}
    {% endif %}
    {% if methods['DELETE'] %}

    @classmethod
    def delete(cls, {{methods['DELETE'].arguments|join(', ')}}):
        {% if methods['DELETE'].printstr %}
        print str({{methods['DELETE'].printstr}})
        {% endif %}
        print 'handling delete'
        {% for i,attribute_object in methods['DELETE'].arguments | enumerate %}
        {{tab(i)}}if {{attribute_object}} in be.{{object_path[i]}}:
        {% endfor %}
        {%set arguments_length = (methods['DELETE'].arguments | length | int) %}
        {%if (methods['DELETE'].arguments | length | int)  > 0 %}
        {{tab(arguments_length)}}del be.{{object_path[arguments_length - 1]}}[{{methods['DELETE'].arguments[arguments_length - 1]}}]{{ending}}
        {% else %}
        if be.{{toplevel}}:
            del be.{{toplevel}}
        else:
            raise KeyError('{{methods['DELETE'].arguments[arguments_length]}}')
        {% endif %}
        {% for i,attribute_object in methods['DELETE'].arguments | enumerate %}
        {{tab(arguments_length - (i + 1))}}else:
        {{tab(arguments_length - i)}}raise KeyError('{{methods['DELETE'].arguments[arguments_length - (i + 1)]}}')
        {% endfor %}
    {% endif %}
    {% if methods['GET'] %}

    @classmethod
    def get(cls, {{methods['GET'].arguments|join(', ')}}):
        {% if methods['GET'].printstr %}
        print str({{methods['GET'].printstr}})
        {% endif %}
        print 'handling get'
        {% for i,attribute_object in methods['GET'].arguments | enumerate %}
        {{tab(i)}}if {{attribute_object}} in be.{{object_path[i]}}:
        {% endfor %}
        {%set arguments_length = (methods['GET'].arguments | length | int) %}
        {%if (methods['GET'].arguments | length | int)  > 0 %}
        {{tab(arguments_length)}}return be.{{object_path[arguments_length - 1]}}[{{methods['GET'].arguments[arguments_length - 1]}}]{{ending}}
        {% else %}
        if be.{{toplevel}}:
            return be.{{toplevel}}
        else:
            raise KeyError('{{methods['GET'].arguments[arguments_length]}}')
        {% endif %}
        {% for i,attribute_object in methods['GET'].arguments | enumerate %}
        {{tab(arguments_length - (i + 1))}}else:
        {{tab(arguments_length - i)}}raise KeyError('{{methods['GET'].arguments[arguments_length - (i + 1)]}}')
        {% endfor %}
    {% endif %}
