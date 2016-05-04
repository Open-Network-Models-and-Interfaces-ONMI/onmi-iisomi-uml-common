# These classes serve as a storage for variables passed to the jinja code generator in the template.render() method.
# Instead of classes, dictionaries could be used as well, but classes document better which variables exist.

class ImportObject(object):
    # This is used together with the "import.py" template to generate the following python statement:
    # from file import name
    def __init__(self, file, name):
        self.file = file
        self.name = name


class AttributeObject(object):
    # Used together with the "object.py" template, to generate attributes of a class, for example:
    # self.name = value
    def __init__(self, name, value):
        self.name = name
        self.value = value


class EnumObject(object):
    # Use in the "object.py" template, to generate the defintion of class that inherits from EnumType:
    # class Operstatus(EnumType):
    #     possible_values = ['down', 'up']
    #     range_end = 2
    def __init__(self, name, values):
        self.name = name
        self.values = values
        self.range_end = str(len(values))


class UrlObject(object):
    # Used in the template "api.py", to generate a web.py url to class mapping:
    # urls = (
    # "/restconf/config/connections/connection/(\w+)/match/" , "service_call.ConnectionsConnectionConnectionidMatch"
    # )
    def __init__(self, path, callback, methods):
        self.path = path
        self.callback = callback
        self.methods = methods


class CallbackObject(object):
    # Used in the template "api.py", to generate the POST, PUT etc. methods.
    def __init__(self, name, path, methods, arguments, thing, check_id):
        self.name = name
        self.path = path
        self.methods = methods
        self.arguments = arguments
        self.thing = thing
        self.check_id = check_id
