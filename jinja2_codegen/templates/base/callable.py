import os.path, sys
sys.path.append(os.path.join('/'.join(os.path.dirname(os.path.realpath(__file__)).split('/')[:-1])))

class {{class_name}}Impl:
    {% if methods['PUT'] %}

    @classmethod
    def put(cls, {{methods['PUT'].arguments|join(', ')}}):
        {% if methods['PUT'].printstr %}
        print str({{methods['PUT'].printstr}})
        {% endif %}
        print 'handling put'
    {% endif %}
    {% if methods['POST'] %}

    @classmethod
    def post(cls, {{methods['POST'].arguments|join(', ')}}):
        {% if methods['POST'].printstr %}
        print str({{methods['POST'].printstr}})
        {% endif %}
        print 'handling post'
    {% endif %}
    {% if methods['DELETE'] %}

    @classmethod
    def delete(cls, {{methods['DELETE'].arguments|join(', ')}}):
        {% if methods['DELETE'].printstr %}
        print str({{methods['DELETE'].printstr}})
        {% endif %}
        print 'handling delete'
    {% endif %}
    {% if methods['GET'] %}

    @classmethod
    def get(cls, {{methods['GET'].arguments|join(', ')}}):
        {% if methods['GET'].printstr %}
        print str({{methods['GET'].printstr}})
        {% endif %}
        print 'handling get'
    {% endif %}
