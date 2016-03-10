'''
    List of contributors:
    -Alejandro Aguado (May, 2015), High Performance Networks group, University of Bristol
    [a.aguado@bristol.ac.uk]
    -Arturo Mayoral (May, 2015), Optical Networks & Systems group, Centre Tecnologic de Telecomunicacions de Catalunya (CTTC).
    [arturo.mayoral@cttc.es]


    -Description:
    This code generates a rest api and classes in python (using json description) required for COP.
    Some things are fixed and could change in the future due to changes in json description files.
    Any doubt, bug or suggestion: a.aguado@bristol.ac.uk

'''

import sys
import json
import os
import re
import shutil
import argparse

sys.path.append(os.path.abspath(os.path.dirname(sys.argv[0])))
from CGConfiguration import CGConfiguration

# jinja code generator
from jinja2 import Environment, PackageLoader
from jinja2_codegen.jinja_classes import ImportObject, AttributeObject, EnumObject, UrlObject, CallbackObject

# The regular expression inserted in the url array.
regex_string = '(\\w+)'

# Map from JSON types to python types
type_map = {'string' : 'str', 'integer' : 'int'}

def decomposeUrl(string):
    slices = string.split("{")
    varlist = []
    url = []
    for sl in slices:
        auxslice = sl.split("}")
        if len(auxslice) != 1:
            varlist.append(auxslice[0])
            url.append(auxslice[1])
        else:
            url.append(auxslice[0])

    defurl = url[0]
    for st in url[1:]:
        defurl += regex_string+st

    return defurl, varlist


def translateRequest(js):
    ret = {}
    res = {}
    i = 1
    bp = js['basePath']
    port = int(js['host'].split(":")[-1])
    ret['port'] = port
    for path in js['paths'].keys():
        ids = {}
        url, variables = decomposeUrl(path)
        msgs = js['paths'][path].keys()
        for method in msgs:
            ids[method] = {}
            ids[method]['desc'] = js["paths"][path][method]['description']
            ids[method]['resp'] = js["paths"][path][method]['responses']
            ids[method]['body'] = False
            ids[method]['json'] = False
            if 'schemes' in js["paths"][path][method].keys():
                ids[method]['schemes'] = js["paths"][path][method]['schemes']
            if "parameters" in js["paths"][path][method].keys():
                for param in js["paths"][path][method]['parameters']:
                    if "body" in param['in']:
                        ids[method]['body'] = True
                        if '$ref' in param['schema']:
                            if 'in_params' not in ids[method]:
                                ids[method]['in_params'] = [param['schema']['$ref'].split('/')[-1]]
                            else:
                                ids[method]['in_params'].append(param['schema']['$ref'].split('/')[-1])
                        else:
                            input_name = "input"+str(to_upper_camelcase('_'.join(url.split('/')[2:-1])))
                            input_klass = {input_name:param['schema']}
                            input_params = translateClass(input_klass)
                            if 'in_params' not in ids[method]:
                                ids[method]['in_params'] = [input_params]
                            else:
                                ids[method]['in_params'].append(input_params)
                        '''if 'in_params' not in ids[method]:
                            if 'items' in param['schema']:
                                ids[method]['in_params'] = [param['schema']['items']['$ref'].split('/')[-1]]
                            else:
                                ids[method]['in_params'] = [param['schema']['$ref'].split('/')[-1]]
                        else:
                            if 'items' in param['schema']:
                                ids[method]['in_params'].append(param['schema']['items']['$ref'].split('/')[-1])
                            else:
                                ids[method]['in_params'].append(param['schema']['$ref'].split('/')[-1])'''

            if "application/json" in js["paths"][path][method]['consumes']:
                ids[method]['json'] = True
        res["func"+str(i)] = {"url":bp+url, "inlineVars":variables, "methods":ids}
        i += 1
    ret['paths'] = res
    return ret


def getType(js):
    ret = {}
    imp = False
    if "type" in js.keys():
        if "enum" in js.keys():
            ret['type'] = 'enum'
            ret['possible_values'] = [enum for enum in js['enum']]
        elif "integer" in js['type']:
            ret['type'] = js['format']
        elif "string" in js['type']:
            ret['type'] = 'string'
        elif "boolean" in js['type']:
            ret['type'] = 'boolean'
        elif "array" in js['type']:
            if "type" in js['items'].keys():
                ret['type'] = 'array'
                ret['klass'] = js['items']['type']
            elif "$ref" in js['items'].keys():
                imp = True
                ret['klass'] = js['items']['$ref'].split("/")[-1]
                if "x-key" in js.keys():
                    ret['type'] = 'keyed-array'
                    ret['key'] = js['x-key']
                else:
                    ret['type'] = 'array'
        else:
            ret['type'] = 'string'

    elif "$ref" in js.keys():
        imp = True
        ret['type'] = 'object'
        ret['klass'] = js['$ref'].split("/")[-1]

    return ret, imp


def translateClass(klass):
    name = klass.keys()[0]
    imports = []
    cl = {}
    atts = []
    cl['class'] = name
    if 'discriminator' in klass[name]:
        cl["discriminator"] = klass[name]['discriminator']
    # Special case where the model extending a father class
    if 'allOf' in klass[name]:
        for item in klass[name]['allOf']:
            if "$ref" in item:
                cl['extend_class'] = item['$ref'].split("/")[-1]
            elif "properties" in item:
                for att in item['properties'].keys():
                    ret, imp = getType(item['properties'][att])
                    ret['att'] = att
                    atts.append(ret)
                    if imp:
                        if ret['klass'] not in imports:
                            imports.append(ret['klass'])
    elif '$ref' in klass[name]:
        cl['extend_class'] = klass[name]['$ref'].split("/")[-1]
    else:
        for att in klass[name]['properties'].keys():
            ret, imp = getType(klass[name]['properties'][att])
            ret['att'] = att
            atts.append(ret)
            if imp:
                if ret['klass'] not in imports:
                    imports.append(ret['klass'])
    cl["atts"] = atts
    cl["imports"] = imports
    return cl


def getNotificationAPIs(data):
    notification_urls = []
    for element in data['paths']:
        methods = data['paths'][element]['methods']
        for method in methods:
            if 'schemes' in methods[method].keys():
                if 'ws' in methods[method]['schemes']:
                    notification_urls.append(data['paths'][element])
    return notification_urls


## This function generates a HTTP Server which will serve
## as a unique access point to our COP server implementation.
def generateServerStub(restname, port, services, path, notfy):

    import_list = []
    urls_list = []
    for serv in services:
        import_list.append(ImportObject('', serv.replace("-", "_")))
        urls_list.append(serv.replace("-", "_") + '.urls')

    if target == 'demo':
        import_list.append(ImportObject('', 'backend_api'))
        urls_list.append('backend_api.urls')

    # use jinja
    template = jinja_env.get_template('server.py')
    rendered_string = template.render(import_list=import_list, urls_list=urls_list,
                                      port=port, notifications=notfy)

    # write server file
    if not debug:
        dst = path + restname + ".py"
        if os.path.isfile(dst):
            print("Server stub already exists, skipping write.")
        else:
            out = open(dst, "w+")
            out.write(rendered_string)
            out.close()


def generateNotificationServer(notification_server_name, notfy_urls, path, restname):
    name_classes = {}
    import_list = []
    for func in notfy_urls:
        list_element_url = func['url'].split('/')
        indexes=[i for i,element in enumerate(list_element_url[3:-1]) if element == '(.*)']
        name_classes[func['url']] = "".join([element.title() for i,element in enumerate(list_element_url[3:-1])])
        file = 'funcs_' + restname + '.' + name_classes[func['url']][0].lower() + name_classes[func['url']][1:] + "Impl"
        name = name_classes[func['url']] + "Impl"
        import_list.append(ImportObject(file, name))

    class_list = []
    dictio = {}
    base_url = ''
    for element in notfy_urls:
        base_url = '/'.join(element['url'].split('/')[:-2])
        className = to_upper_camelcase(element['url'].split('/')[-2])
        class_name = name_classes[element['url']]
        url = to_upper_camelcase(element['url'].split('/')[-2])+"Service"
        lower_url = "/"+to_lower_camelcase(element['url'].split('/')[-2])+"Service"
        dictio[str(base_url)+str(lower_url)] = str(url)
        class_list.append((className, class_name))

    servicemap = []
    for element in dictio:
        servicemap.append("\'"+str(element)+"\' : "+str(dictio[element]))

    # use jinja
    template = jinja_env.get_template('notification_server.py')
    rendered_string = template.render(servicemap=servicemap, class_list=class_list, import_list=import_list)

    # write notification server file
    if not debug:
        dst = path + notification_server_name + ".py"
        if os.path.isfile(dst):
            print("Notification server already exists, skipping write.")
        else:
            out = open(dst, "w+")
            out.write(rendered_string)
            out.close()


def generateRESTapi(data, name, imp, restname, params, services, path, notfy_urls):
    if notfy_urls:
        generateNotificationServer("notification_factory", notfy_urls, path, restname)
        urls = [element['url'] for element in notfy_urls]
        data_prov={}
        for k, v in data['paths'].items():
            if v['url'] not in urls:
                data_prov[k] = v

        data['paths'] = data_prov

    info = data['paths']
    name_classes = {}
    params_callback = {}

    url_object_list = []

    for func in info.keys():
        # Here we generate the name of the class and its related callback
        # to the backend program based on the API syntax of each function.
        list_element_url = info[func]['url'].split('/')
        indexes = [i for i, element in enumerate(list_element_url[3:-1]) if element == regex_string]
        name_classes[func] = "".join([info[func]["inlineVars"][indexes.index(i)].title() if element == regex_string else element.title() for i, element in enumerate(list_element_url[3:-1])])
        params_callback[func] = ",".join([info[func]["inlineVars"][indexes.index(i)] for i, element in enumerate(list_element_url[3:-1]) if element == regex_string])
        url = info[func]['url']
        callback = restname + "." + name_classes[func]
        url_object_list.append(UrlObject(url, callback))

    # imports of functions
    functions_import_list = []
    for func in info.keys():
        file = "funcs_" + restname + "." + name_classes[func][0].lower() + name_classes[func][1:] + "Impl"
        name = name_classes[func] + "Impl"
        functions_import_list.append(ImportObject(file, name))

    # imports of objects
    objects_import_list = []
    for im in imp:
        file = "objects_" + restname + "." + im[0].lower() + im[1:]
        name = im
        objects_import_list.append(ImportObject(file, name))

    callback_list = []
    for func in info.keys():
        # Create funcs with inlineVars
        arguments = info[func]["inlineVars"]
        methods = {}
        check_id = False
        thing = ''
        for method in info[func]['methods'].keys():
            methods[method.upper()] = {}
            methods[method.upper()]['printstr'] = str(info[func]['methods'][method]['desc'])
            if method == 'put':
                if 'in_params' in info[func]['methods'][method]:
                    thing = info[func]['methods'][method]['in_params'][0]
                    if [regex_string] == info[func]['url'].split('/')[-2:-1]:
                        check_id = True

        url = info[func]['url']
        name = name_classes[func]
        callback_list.append(CallbackObject(name, url, methods, arguments, thing, check_id))

    if params.isAuth:
        auth = True
        users = json.dumps(params.users)
    else:
        auth = False
        users = None
    if params.isCORS:
        cors = True
        url = params.url
    else:
        cors = False
        url = None

    # use jinja
    template = jinja_env.get_template('api.py')
    rendered_string = template.render(auth=auth,
                                      users=users,
                                      cors=cors,
                                      url=url,
                                      functions_import_list=functions_import_list,
                                      objects_import_list=objects_import_list,
                                      url_object_list=url_object_list,
                                      callback_list=callback_list)

    # write API file
    if not debug:
        dst = path + restname + ".py"
        if os.path.isfile(dst):
            print("REST API file already exists, skipping write.")
        else:
            out = open(dst, "w+")
            out.write(rendered_string)
            out.close()


def translate_type_json2python(typename):
    if typename in type_map:
        return type_map[typename]
    else:
        return typename

def generateAttributeValue(att, struc=None): #Initialization of different attributes
    if att['type'] == "string":
        return '""'
    elif "int" in att['type']:
        return '0'
    elif att['type'] == "boolean":
        return 'False'
    elif att['type'] == "array":
        return "ArrayType.factory(" + translate_type_json2python(att['klass']) + ")"
    elif att['type'] == "keyed-array":
        if struc:
            child_classes = '('
            for i in struc['child_classes']:
                child_classes+=i
                child_classes+=','
            child_classes = child_classes[:-1] + ')'
            return "KeyedArrayType("+ child_classes + ", '" + att['key'] + "', '"+ struc['discriminator'] +"')"
        else:
            return "KeyedArrayType(" + att['klass'] + ", '" + att['key'] + "')"
    # Always use class definitions for objects, not dicts
    elif att['type'] == "object":
        return att['klass']+"() #import"
    elif att['type'] == "enum":
        return att['att'].capitalize() + '(0)'
    else:
        return "None #FIXME: This parameter is not well defined"


def generateClasses(data, restname, path):
    # Create folder objects_
    if not debug:
        if not os.path.exists(path+"objects_"+restname+"/"):
            os.makedirs(path+"objects_"+restname+"/")

    # Create __init__.py file
    if not debug:
        open(path+"objects_"+restname+"/__init__.py", "a").close()

    # Create class.py files
    for klass in data:
        name = klass['class']

        import_list = []
        attribute_list = []
        enum_list = []

        imports = klass['imports']
        if 'extend_class' in klass:
            superclass_name = klass['extend_class']
            klass['imports'].append(klass['extend_class'])
        else:
            superclass_name = 'JsonObject'
            import_list.append(ImportObject('objects_common.jsonObject', 'JsonObject'))
            for klass2 in data:
                if 'extend_class' in klass2 and klass2['extend_class'] in klass['imports']:
                    imports.append(klass2['class'])

        # imports
        for imp in imports:
            imp_file = imp[0].lower()+imp[1:]
            import_list.append(ImportObject(imp_file, imp))

        # attributes
        import_array = False
        import_keyed_array = False
        
        for att in klass['atts']:
            struc = ''
            if att['type'] == "array":
                import_array = True
            if att['type'] == "keyed-array":
                import_keyed_array = True
                if is_inheritted_class(data, att):
                    struc = get_child_classes(data, att)
            if struc:
                attribute_list.append(AttributeObject(att['att'], generateAttributeValue(att,struc)))
            else:
                attribute_list.append(AttributeObject(att['att'], generateAttributeValue(att)))

        if import_array:
            import_list.append(ImportObject('objects_common.arrayType', 'ArrayType'))
        if import_keyed_array:
            import_list.append(ImportObject('objects_common.keyedArrayType', 'KeyedArrayType'))

        # enums
        import_enum = False
        for att in klass['atts']:
            if "enum" in att['type']:
                enum_values = ['\'' + x + '\'' for x in att['possible_values']]
                enum_list.append(EnumObject(att['att'].capitalize(), enum_values))
                import_enum = True
        if import_enum:
            import_list.append(ImportObject('objects_common.enumType', 'EnumType'))

        # use jinja
        template = jinja_env.get_template('object.py')
        rendered_string = template.render(import_list=import_list,
                                          attribute_list=attribute_list,
                                          enum_list=enum_list,
                                          class_name=name,
                                          superclass_name=superclass_name)

        #write class file
        if not debug:
            dst = path+"objects_"+restname+"/"+name[0].lower()+name[1:]+".py"
            if os.path.isfile(dst):
                print("Class file already exists, skipping write.")
            else:
                out = open(dst, "w+")
                out.write(rendered_string)
                out.close()

def is_inheritted_class(data, att):
    for child_klass in data:
        if child_klass['class'] == att['klass']:
            if 'discriminator' in child_klass.keys():
                return True
    return False

def get_child_classes(data, att):
    child_classes = []
    for child_klass in data:
        if child_klass['class'] == att['klass']:
            discriminator = child_klass['discriminator']
            for att2 in child_klass['atts']:
                if att2['att'] == discriminator:
                    _type = att2['type']
                    
        if 'extend_class' in child_klass.keys():
            if child_klass['extend_class'] == att['klass']:
                child_classes.append(child_klass['class'].encode('ascii','ignore'))

    return {'discriminator':discriminator, 'child_classes':child_classes, 'type':_type}

def generateCallableClasses(data, imp, restname, path, notfy_urls):
    # create folder funcs_
    if not debug:
        if os.path.exists(path+"funcs_"+restname+"/"):
            print("Callable classes folder already exists, skipping.")
        else:
            os.makedirs(path+"funcs_"+restname+"/")
            open(path+"funcs_"+restname+"/__init__.py", "a").close()


    if notfy_urls:
        name_classes = {}
        params_callback = {}
        for func in notfy_urls:
            index=0
            print func
            resp_model = func['methods']['get']['resp']['200']['schema']['$ref'].split('/')[-1]
            list_element_url = func['url'].split('/')
            indexes=[i for i,element in enumerate(list_element_url[3:-1]) if element == '(.*)']
            name_classes[func['url']] = "".join([element.title() for i,element in enumerate(list_element_url[3:-1])])
            filename = path+"funcs_"+restname+"/"+name_classes[func['url']][0].lower()+""+name_classes[func['url']][1:]+"Impl.py"
            if os.path.isfile(filename): #if exists, don't create
                print(filename + "already exists, skipping write")
            else:
                import_list = []
                for im in imp:
                    if im == resp_model:
                        file = "objects_" + restname + "." + im[0].lower() + im[1:]
                        import_list.append(ImportObject(file, im))

                class_name = name_classes[func['url']]
                new_object = resp_model
                json_string = '{"callId":"Example_' + class_name + '"}'

                # use jinja
                template = jinja_env.get_template('notificationImpl.py')
                rendered_string = template.render(import_list=import_list, class_name=class_name,
                                                  new_object=new_object, json_string=json_string)

                # write Impl file
                if not debug:
                    out = open(filename, "w+")
                    out.write(rendered_string)
                    out.close()

    info = data['paths']
    name_classes = {}
    params_callback = {}

    for func in info.keys():
        # Here we generate the name of the class_name and its related callback_name
        # to the backend program based on the API syntax of each function.
        list_element_url = info[func]['url'].split('/')
        indexes = [i for i, element in enumerate(list_element_url[3:-1]) if element == regex_string]
        name_classes[func] = "".join([info[func]["inlineVars"][indexes.index(i)].title() if element == regex_string else element.title() for i, element in enumerate(list_element_url[3:-1])])
        params_callback[func] = [info[func]["inlineVars"][indexes.index(i)] for i, element in enumerate(list_element_url[3:-1]) if element == regex_string]

        # generate object path, for example: connections[connectionId].aEnd
        relevant_list = []
        for x in list_element_url[3:-1]:
            if '_' in x:
                relevant_list.append(to_lower_camelcase(str(x)))
            else:
                relevant_list.append(str(x))
        if len(params_callback[func]) == 0:
            object_path = relevant_list
            ending = ''
        else:
            object_path_parts = []
            object_path = []
            params_found = 0
            remain = []
            for element in relevant_list:
                if element == regex_string:
                    if params_found == 0:
                        object_path_parts.append('.'.join(remain[:-1]))
                    else:
                        object_path_parts.append('.'.join(remain))
                    remain = []
                    params_found += 1
                else:
                    remain.append(element)

            for i, part in enumerate(object_path_parts):
                object_path.append([])
                if i > 0:
                    object_path[i].append(object_path[i-1])
                    object_path[i].append('[' + params_callback[func][i-1] + ']' + '.')
                object_path[i].append(part)
                object_path[i] = ''.join(object_path[i])
            if remain:
                ending = '.' + '.'.join(remain)
            else:
                ending = ''
        toplevel = relevant_list[0]

        class_name = name_classes[func]
        methods = {}
        for method in info[func]['methods'].keys():
            if len(params_callback[func]) > 0:
                ## Input body parameters are included into the class headers if so.
                if (method in ['put', 'post']) and ('in_params' in info[func]['methods'][method]):
                    in_params = [element.lower() if not isinstance(element,dict) else element['class'].lower() for element in info[func]['methods'][method]['in_params']]
                    arguments = params_callback[func] + in_params
                else:
                    arguments = params_callback[func]
            else:
                if (method in ['put', 'post']) and ('in_params' in info[func]['methods'][method]):
                    arguments = [element.lower() if not isinstance(element,dict) else element['class'].lower() for element in info[func]['methods'][method]['in_params']]
                else:
                    arguments = []
            if 'in_params' in info[func]['methods'][method]:
                if not isinstance(info[func]['methods'][method]['in_params'][0],dict):
                    printstr = info[func]['methods'][method]['in_params'][0].lower()
                else:
                    printstr = info[func]['methods'][method]['in_params'][0]['class'].lower()
            else:
                printstr = ''
            method = method.upper()
            methods[method] = {}
            methods[method]['arguments'] = arguments
            methods[method]['printstr'] = printstr

        # use jinja
        #print 'URL %s, object_path %s' % (relevant_list, object_path )
        template = jinja_env.get_template('callable.py')
        rendered_string = template.render(class_name=class_name,
                                          methods=methods, toplevel=toplevel,
                                          object_path=object_path, ending=ending)

        # write callable file
        if not debug:
            dst = path+"funcs_"+restname+"/"+name_classes[func][0].lower()+name_classes[func][1:]+"Impl.py"
            if os.path.isfile(dst):
                print("Callable class file already exists, skipping write.")
            else:
                out = open(dst, "w+")
                out.write(rendered_string)
                out.close()


def to_lower_camelcase(name):
    """ Converts the name string to lower camelcase by using "-" and "_" as
    markers.
    """
    return re.sub(r'(?:\B_|\b\-)([a-zA-Z0-9])', lambda l: l.group(1).upper(),
                  name)


def to_upper_camelcase(name):
    """ Converts the name string to upper camelcase by using "-" and "_" as
    markers.
    """
    return re.sub(r'(?:\B_|\b\-|^)([a-zA-Z0-9])', lambda l: l.group(1).upper(),
                  name)


def is_instance(object, type):
    return isinstance(object,type)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Generate a RESTful server and class definitions using the swagger.py json output.')
    parser.add_argument('swagger_json_files', nargs='+', type=str, help='a list of swagger JSON files generated with swagger.py which serves as the input of this generator')
    parser.add_argument('-o', '--outdir', type=str, default='', help='the directory to which the output files are saved')
    parser.add_argument('-d', '--debug', action='store_true', help='if flag is given, do not write any files')
    parser.add_argument('-p', '--port', type=str, default='8080', help='the port on which the REST server is listening')
    parser.add_argument('-a', '--alternative', action='store_true', help='if flag is given, generate the demo code instead of the base code')
    #parser.add_argument('-t', '--target', type=str, choices=['base', 'demo'], default='base')
    args = parser.parse_args()
    debug = args.debug
    port = args.port
    params = CGConfiguration(os.path.abspath(os.path.dirname(sys.argv[0]))+"/CGConfiguration.xml")
    if args.alternative:
        target = 'demo'
    else:
        target = 'base'
    templates_dir = 'templates/' + target
    jinja_env = Environment(loader=PackageLoader('jinja2_codegen', templates_dir), trim_blocks=True, lstrip_blocks=True)

    jinja_env.filters.update({
            'is_instance': is_instance,
    })

    services = []
    notfy_urls_total = []
    for filename in args.swagger_json_files:
        print("Processing file: " + filename)
        path = args.outdir
        if path and path[-1] != "/":
            path += "/"

        service = filename.split("/")[-1].split(".")[0]
        services.append(service)

        name = service+".py"
        restname = service.replace("-", "_")

        # read input from swagger json file
        f = open(filename, 'rb')
        stri = f.read()
        f.close()

        js = json.loads(stri)
        #Translate json into a more manageable structure
        jsret = []
        for klass in js['definitions'].keys():
            js_class = {klass:js['definitions'][klass]}
            jsret.append(translateClass(js_class))

        print json.dumps(jsret, sort_keys=True,indent=4, separators=(',', ': '))
        #generating classes first
        print("Class definitions are found in the folder '" + path + "objects_" + restname + "/'")
        generateClasses(jsret, restname, path)

        #create imports for the main class (in case the user needs to use them)
        imp = []
        for klass in jsret:
            imp.append(klass['class'])

        #generate (if any) the RESTful Server
        if "paths" in js.keys():
            jsret2 = translateRequest(js)
            notfy_urls = getNotificationAPIs(jsret2)
            notfy_urls_total+=notfy_urls
            generateRESTapi(jsret2, name, imp, restname, params, services, path, notfy_urls)
            generateCallableClasses(jsret2, imp, restname, path, notfy_urls)

    #copy common objects
    if not debug:
        srcdir = os.path.join(os.path.abspath(os.path.dirname(sys.argv[0])), 'objects_common')
        dstdir = os.path.join(path, 'objects_common')
        if os.path.exists(dstdir):
            print("Common objects folder already exists, skipping copy.")
        else:
            shutil.copytree(srcdir, dstdir)

    #copy backend files
    if not debug and target == 'demo':
        # copy backend_api.py
        src = os.path.join(os.path.abspath(os.path.dirname(sys.argv[0])), 'jinja2_codegen', 'templates', 'demo', 'backend_api.py')
        shutil.copyfile(src, path + 'backend_api.py')
        if not os.path.exists(path + "backend/"):
            os.makedirs(path + "backend/")
            open(path + "backend/__init__.py", "a").close()
            # copy backend.py
            src = os.path.join(os.path.abspath(os.path.dirname(sys.argv[0])), 'jinja2_codegen', 'templates', 'demo', 'backend.py')
            dst = path + "backend/" + 'backend.py'
            shutil.copyfile(src, dst)

    if notfy_urls_total:
        notfy = True
    else:
        notfy = False
    generateServerStub("server", port, services, path, notfy)
    """
    if not debug:
        servicefile = open(path+".cop/services.json", 'w+')
        servicefile.write(json.dumps(services))
        servicefile.close()
    """
    print("Finished processing " + str(len(args.swagger_json_files)) + " file(s).")

