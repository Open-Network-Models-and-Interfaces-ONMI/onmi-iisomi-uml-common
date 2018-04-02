"""Swagger output plugin for pyang.

    List of contributors:
    -Arturo Mayoral, Optical Networks & Systems group, Centre Tecnologic de Telecomunicacions de Catalunya (CTTC).
    [arturo.mayoral@cttc.es]
    -Ricard Vilalta, Optical Networks & Systems group, Centre Tecnologic de Telecomunicacions de Catalunya (CTTC)
    [ricard.vilalta@cttc.es]

    -Description:
    This code  implements a pyang plugin to translate yang RFC-6020 model files into swagger 2.0 specification
    json format (https://github.com/swagger-api/swagger-spec).
    Any doubt, bug or suggestion: arturo.mayoral@cttc.es
"""

import optparse
import json
import re
import string
from collections import OrderedDict

from pyang import plugin
from pyang import statements


TYPEDEFS = dict()
PARENT_MODELS = dict()

def pyang_plugin_init():
    """ Initialization function called by the plugin loader. """
    plugin.register_plugin(SwaggerPlugin())


class SwaggerPlugin(plugin.PyangPlugin):

    """ Plugin class for swagger file generation."""

    def add_output_format(self, fmts):
        self.multiple_modules = True
        fmts['swagger'] = self

    def add_opts(self, optparser):
        # A list of command line options supported by the swagger plugin.
        # TODO: which options are really needed?
        optlist = [
            optparse.make_option(
                '--swagger-help',
                dest='swagger_help',
                action='store_true',
                help='Print help on swagger options and exit'),
            optparse.make_option(
                '--swagger-depth',
                type='int',
                dest='swagger_depth',
                default=5,
                help='Number of levels to print'),
            optparse.make_option(
                '--simplify-api',
                default=False,
                dest='s_api',
                help='Simplified apis'),
            optparse.make_option(
                '--swagger-path',
                dest='swagger_path',
                type='string',
                help='Path to print'),
            optparse.make_option(
                '--swagger-version',
                dest='swagger_version',
                type='string',
                default='1.0.0',
                help='Version for swagger output'),
            optparse.make_option(
                '--swagger-camelcase',
                dest='swagger_camelcase',
                default=False,
                help='Print help on swagger options and exit'),]
        optgrp = optparser.add_option_group('Swagger specific options')
        optgrp.add_options(optlist)

    def setup_ctx(self, ctx):
        pass

    def setup_fmt(self, ctx):
        ctx.implicit_errors = False

    def emit(self, ctx, modules, fd):
        # TODO: the path variable is currently not used.
        if ctx.opts.swagger_path is not None:
            path = string.split(ctx.opts.swagger_path, '/')
            if path[0] == '':
                path = path[1:]
        else:
            path = None
        global S_API
        global S_OPTS
        S_API = ctx.opts.s_api
        S_OPTS = ctx.opts
        emit_swagger_spec(ctx, modules, fd, ctx.opts.path)


def print_header(module, fd):
    """ Print the swagger header information."""
    module_name = str(module.arg)
    header = OrderedDict()
    header['swagger'] = '2.0'
    header['info'] = {
        'description': '%s API generated from %s' % (
            module_name, module.pos.ref.rsplit('/')[-1]),
        'version': S_OPTS.swagger_version,
        'title': str(module_name + ' API')
    }
    header['host'] = 'localhost:8080'
    # TODO: introduce flexible base path. (CLI options?)
    header['basePath'] = '/restconf'
    header['schemes'] = ['http']
    return header


def emit_swagger_spec(ctx, modules, fd, path):
    """ Emits the complete swagger specification for the yang file."""
    
    printed_header = False
    model = OrderedDict()
    definitions = OrderedDict()

    # Go through all modules and extend the model.
    for module in modules:
        if not printed_header:
            model = print_header(module, fd)
            printed_header = True
            path = '/'

        
        # extract children which contain data definition keywords
        chs = [ch for ch in module.i_children
               if ch.keyword in (statements.data_definition_keywords + ['rpc','notification'])]

        typdefs = [module.i_typedefs[element] for element in module.i_typedefs]
        models = list(module.i_groupings.values())

        referenced_types = list()
        referenced_types = findTypedefs(ctx, module, models, referenced_types)
        for element in referenced_types:
            typdefs.append(element)

        # The attribute definitions are processed and stored in the "typedefs" data structure for further use.
        gen_typedefs(typdefs)

        # list() needed for python 3 compatibility
        referenced_models = list()

        referenced_models = findModels(ctx, module, models, referenced_models)
        referenced_models.extend(findModels(ctx, module, chs, referenced_models))

        for element in referenced_models:
            models.append(element)

        # Print the swagger definitions of the Yang groupings.
        gen_model(models, definitions)

        # If a model at runtime was dependant of another model which had been encounter yet, it is generated 'a
        # posteriori'.
        if pending_models:
            gen_model(pending_models, definitions)

        if PARENT_MODELS:
            for element in PARENT_MODELS:
                if PARENT_MODELS[element]['models']:
                    definitions[element]['discriminator'] = PARENT_MODELS[element]['discriminator']

        # generate the APIs for all children
        model['paths'] = OrderedDict()

        augments = module.search('augment')
        genAugmentedStatements(ctx, augments, definitions, model['paths'])

        if len(chs) > 0:
            gen_apis(chs, path, model['paths'], definitions)

        model['definitions'] = definitions
        fd.write(json.dumps(model, indent=4, separators=(',', ': ')))


def genAugmentedStatements(ctx, augments, definitions, paths):
    new_definitions = definitions.copy()
    path = '/'

    for augment in augments:
        #apis = OrderedDict()
        apis = paths
        parent_augments = augment.i_target_node.top.search('augment')
        genAugmentedStatements(ctx, parent_augments, new_definitions, apis)
        for _def in new_definitions:
            if _def not in definitions:
                definitions[_def] = new_definitions[_def]

        chs = [ch for ch in augment.i_target_node.top.i_children
               if ch.keyword in (statements.data_definition_keywords + ['rpc','notification'])]
        gen_apis(chs, path, apis, new_definitions)
        for api in apis:
            path = '/'
            api_match = False
            if api.split('/')[-3] == augment.arg.split('/')[-1].split(':')[1]:
                api_match = True
                if api.split('/')[2:-3]:
                    path +='/'.join(api.split('/')[2:-3])+'/'

            elif api.split('/')[-2] == augment.arg.split('/')[-1].split(':')[1]:
                api_match = True
                if api.split('/')[2:-2]:
                    path +='/'.join(api.split('/')[2:-2])+'/'

            if api_match:
                for child in augment.i_target_node.i_children:
                    references = [sub for sub in augment.i_target_node.substmts if sub.keyword == 'uses']
                    if references:
                        ref = references[-1]
                        if hasattr(child, 'i_uses') and getattr(child, 'i_uses'):
                            if child.i_uses[len(child.i_uses)-1].arg is not ref.arg:
                                del child.i_uses
                gen_api_node(augment.i_target_node, path, paths, definitions)

                typdefs = [augment.i_target_node.top.i_typedefs[element]
                           for element in augment.i_target_node.top.i_typedefs]
                referenced_types = list()
                referenced_types = findTypedefs(ctx, augment.i_target_node.top,
                                                augment.i_target_node.top.i_children, referenced_types)
                for element in referenced_types:
                    typdefs.append(element)
                # The attribute definitions are processed and stored in the "typedefs" data structure for further use.
                gen_typedefs(typdefs)

                referenced_models = list()
                findModels(ctx, augment.i_target_node.top, augment.i_target_node.top.i_children, referenced_models)
                # Print the swagger definitions of the Yang groupings.
                gen_model(referenced_models, definitions)


def findModels(ctx, module, children, referenced_models):

    for child in children:
        if hasattr(child, 'substmts'):
             for attribute in child.substmts:
                 if attribute.keyword == 'uses':
                    if len(attribute.arg.split(':'))>1:
                        for i in module.search('import'):
                            subm = ctx.get_module(i.arg)
                            models = [group for group in subm.i_groupings.values() if group.arg not in [element.arg for element in referenced_models]]
                            
                            for element in models:
                                referenced_models.append(element)

                            referenced_models = findModels(ctx, subm, models, referenced_models)
                    else:
                        models = [group for group in module.i_groupings.values() if group.arg not in [element.arg for element in referenced_models]]
                        for element in models:
                            referenced_models.append(element)

        if hasattr(child, 'i_children'):
            findModels(ctx, module, child.i_children, referenced_models)


    return referenced_models


def findTypedefs(ctx, module, children, referenced_types):
    for child in children:
        if hasattr(child, 'substmts'):
             for attribute in child.substmts:
                if attribute.keyword == 'type':
                    if len(attribute.arg.split(':'))>1:
                        for i in module.search('import'):
                            subm = ctx.get_module(i.arg)
                            models = [type for type in subm.i_typedefs.values() if str(type.arg) == str(attribute.arg.split(':')[-1]) and type.arg not in [element.arg for element in referenced_types]]
                            for element in models:
                                referenced_types.append(element)
                            referenced_types = findTypedefs(ctx, subm, models, referenced_types)
                    else:
                        models = [type for type in module.i_typedefs.values() if str(type.arg) == str(attribute.arg) and type.arg not in [element.arg for element in referenced_types]]
                        for element in models:
                            referenced_types.append(element)

        if hasattr(child, 'i_children'):
            findTypedefs(ctx, module, child.i_children, referenced_types)
    return referenced_types

pending_models = list()
def gen_model(children, tree_structure, config=True):
    """ Generates the swagger definition tree."""
    for child in children:
        referenced = False
        node = dict()
        nonRefChildren = None
        listkey = None
        if hasattr(child, 'substmts'):
            for attribute in child.substmts:
                # process the 'type' attribute:
                # Currently integer, enumeration and string are supported.
                if attribute.keyword == 'type':
                    if len(attribute.arg.split(':'))>1:
                        attribute.arg = attribute.arg.split(':')[-1]
                    # Firstly, it is checked if the attribute type has been previously define in typedefs.
                    if attribute.arg in TYPEDEFS:
                        if TYPEDEFS[attribute.arg]['type'][:3] == 'int':
                            node['type'] = 'integer'
                            node['format'] = TYPEDEFS[attribute.arg]['format']
                        elif TYPEDEFS[attribute.arg]['type'] == 'enumeration':
                            node['type'] = 'string'
                            node['enum'] = [e for e in TYPEDEFS[attribute.arg]['enum']]
                        # map all other types to string
                        else:
                            node['type'] = 'string'
                    elif attribute.arg[:3] == 'int':
                        node['type'] = 'integer'
                        node['format'] = attribute.arg
                    elif attribute.arg == 'decimal64':
                        node['type'] = 'number'
                        node['format'] = 'double'
                    elif attribute.arg == 'boolean':
                        node['type'] = attribute.arg
                    elif attribute.arg == 'enumeration':
                        node['type'] = 'string'
                        node['enum'] = [e[0]
                                        for e in attribute.i_type_spec.enums]
                    elif attribute.arg == 'leafref':
                        node['type'] = 'string'
                        node['x-path'] = attribute.i_type_spec.path_.arg
                    # map all other types to string
                    else:
                        node['type'] = 'string'
                elif attribute.keyword == 'key':
                    listkey = to_lower_camelcase(attribute.arg)
                elif attribute.keyword == 'description' and (attribute.arg != 'none'):
                    node['description'] = attribute.arg
                elif attribute.keyword == 'mandatory':
                    parent_model = to_upper_camelcase(child.parent.arg)
                    if parent_model not in PARENT_MODELS.keys():
                        PARENT_MODELS[parent_model] = {'models':[],'discriminator':to_lower_camelcase(child.arg)}
                elif attribute.keyword == 'config' and attribute.arg == 'false':
                    config = False

                # Process the reference to another model.
                # We differentiate between single and array references.
                elif attribute.keyword == 'uses':
                    #pending_models.append(attribute.arg)
                    if len(attribute.arg.split(':'))>1:
                        attribute.arg = attribute.arg.split(':')[-1]

                    ref_arg = to_upper_camelcase(attribute.arg)
                    # A list is built containing the child elements which are not referenced statements.
                    nonRefChildren = [e for e in child.i_children if not hasattr(e, 'i_uses')]

                    # If a node contains mixed referenced and non-referenced children,
                    # it is a extension of another object, which in swagger is defined using the
                    # "AllOf" statement.
                    ref = '#/definitions/' + ref_arg


                    if not nonRefChildren:
                        referenced = True
                    else:
                        if ref_arg in PARENT_MODELS:
                            PARENT_MODELS[ref_arg]['models'].append(child.arg)
                        
                        # Create new array on the first reference
                        if 'allOf' not in node:
                            node['allOf'] = []
                        node['allOf'].append({'$ref': ref})


        # When a node contains a referenced model as an attribute the algorithm
        # does not go deeper into the sub-tree of the referenced model.
        if not referenced :
            if not nonRefChildren:
                gen_model_node(child, node, config)
            else:
                node_ext = dict()
                properties = dict()
                gen_model(nonRefChildren, properties)
                node_ext['properties'] = properties
                node['allOf'].append( node_ext)

        # Leaf-lists need to create arrays.
        # Copy the 'node' content to 'items' and change the reference
        if child.keyword == 'leaf-list':
            ll_node = {'type': 'array', 'items': node}
            node = ll_node


        # Groupings are class names and upper camelcase.
        # All the others are variables and lower camelcase.
        if child.keyword == 'grouping':
            if referenced:
                node['$ref'] =  ref

            tree_structure[to_upper_camelcase(child.arg)] = node

        elif child.keyword == 'list':
            node['type'] = 'array'
            node['items'] = dict()
            if listkey:
                node['x-key'] = listkey
            if referenced:
                node['items'] = {'$ref': ref}
            else:
                if 'allOf' in node:
                    allOf = list(node['allOf'])
                    node['items']['allOf'] = allOf
                    del node['allOf']
                else:
                    properties = dict(node['properties'])
                    node['items']['properties'] = properties
                    del node['properties']

            tree_structure[to_lower_camelcase(child.arg)] = node

        else:
            if referenced:
                node['$ref'] =  ref
            tree_structure[to_lower_camelcase(child.arg)] = node


def gen_model_node(node, tree_structure, config=True):
    """ Generates the properties sub-tree of the current node."""
    if hasattr(node, 'i_children'):
        properties = {}
        gen_model(node.i_children, properties, config)
        if properties:
            tree_structure['properties'] = properties

def gen_apis(children, path, apis, definitions, config = True):
    """ Generates the swagger path tree for the APIs."""
    for child in children:
        gen_api_node(child, path, apis, definitions, config)


# Generates the API of the current node.

def gen_api_node(node, path, apis, definitions, config = True):
    """ Generate the API for a node."""
    path += str(node.arg) + '/'
    tree = {}
    schema = {}
    key = None
    for sub in node.substmts:
        # If config is False the API entry is read-only.
        if sub.keyword == 'config' and sub.arg == 'false':
            config = False
        elif sub.keyword == 'key':
            key = sub.arg
        '''elif sub.keyword == 'uses':
            # Set the reference to a model, previously defined by a grouping.
            schema['$ref'] ='#/definitions/' + to_upper_camelcase(sub.arg)'''

    # API entries are only generated from container and list nodes.
    if node.keyword == 'list' or node.keyword == 'container':
        nonRefChildren = [e for e in node.i_children if not hasattr(e, 'i_uses')]
        # We take only the schema model of a single item inside the list as a "body"
        # parameter or response model for the API implementation of the list statement.
        if node.keyword == 'list':
            # Key statement must be present if config statament is True and may
            # be present otherwise.
            if config:
                if not key:
                    raise Exception('Invalid list statement, key parameter is required')
            # It is checked that there is not name duplication within the input parameters list (i.e., path). In case
            #  of duplicity the input param. is upgrade to node.arg (parent node name) + _ + the input param (key).
            # Example: /config/Context/{uuid}/_topology/{uuid}/_link/{uuid}/_transferCost/costCharacteristic/{
            # costAlgorithm}/
            #
            # is replaced by:
            #
            # 		   /config/Context/{uuid}/_topology/{topology_uuid}/_link/{link_uuid}/_transferCost/costCharacteristic/{costAlgorithm}/

            schema_list = {}
            if key:
                match = re.search(r"\{([A-Za-z0-9_]+)\}", path)
                if match and key == match.group(1):
                    if node.arg[0] == '_':
                        new_param_name = node.arg[1:] +'_'+ to_lower_camelcase(key)
                    else:
                        new_param_name = node.arg +'_'+ to_lower_camelcase(key)
                    path += '{'+re.sub('-','_',new_param_name)+ '}/'
                    for child in node.i_children:
                        if child.arg == key:
                            child.arg = new_param_name
                else:
                    path += '{' + re.sub('-','_', to_lower_camelcase(key)) + '}/'

                schema_list, path_list = gen_list_response_schema(path)
                apis['/config'+str(path_list)] = print_api(node, False, schema_list, path_list)

            schema_list = {}
            gen_model([node], schema_list, config)

            # If a body input params has not been defined as a schema (not included in the definitions set),
            # a new definition is created, named the parent node name and the extension Schema (i.e.,
            # NodenameSchema). This new definition is a schema containing the content of the body input schema i.e {
            # "child.arg":schema} -> schema
            if schema_list[to_lower_camelcase(node.arg)]['items']:
                if not '$ref' in schema_list[to_lower_camelcase(node.arg)]['items']:
                    definitions[to_upper_camelcase(node.arg+'_schema')] = dict(schema_list[to_lower_camelcase(node.arg)]['items'])
                    schema['$ref'] =  '#/definitions/' + to_upper_camelcase(node.arg+'_schema')
                else:
                    schema = dict(schema_list[to_lower_camelcase(node.arg)]['items'])
            else:
                schema = None

        else:
            gen_model([node], schema, config)
            # If a body input params has not been defined as a schema (not included in the definitions set),
            # a new definition is created, named the parent node name and the extension Schema (i.e., NodenameSchema).
            # This new definition is a schema containing the content of the body input schema i.e {"child.arg":schema} -> schema
            if schema[to_lower_camelcase(node.arg)]:
                if not '$ref' in schema[to_lower_camelcase(node.arg)]:
                    definitions[to_upper_camelcase(node.arg+'_schema')] = schema[to_lower_camelcase(node.arg)]
                    schema = {'$ref':'#/definitions/' + to_upper_camelcase(node.arg+'_schema')}
                else:
                    schema = schema[to_lower_camelcase(node.arg)]
            else:
                schema = None

        apis['/config'+str(path)] = print_api(node, config, schema, path)

    elif node.keyword == 'rpc':
        schema_out = dict()
        for child in node.i_children:
            if child.keyword == 'input':
                gen_model([child], schema, config)

                # If a body input params has not been defined as a schema (not included in the definitions set),
                # a new definition is created, named the parent node name and the extension Schema (i.e., NodenameRPCInputSchema).
                # This new definition is a schema containing the content of the body input schema i.e {"child.arg":schema} -> schema
                if schema[to_lower_camelcase(child.arg)]:
                    if not '$ref' in schema[to_lower_camelcase(child.arg)]:
                        definitions[to_upper_camelcase(node.arg+'RPC_input_schema')] = schema[to_lower_camelcase(child.arg)]
                        schema = {'$ref':'#/definitions/' + to_upper_camelcase(node.arg+'RPC_input_schema')}
                    else:
                        schema = schema[to_lower_camelcase(node.arg)]
                else:
                    schema = None

            elif child.keyword == 'output':
                gen_model([child], schema_out, config)

                # If a body input params has not been defined as a schema (not included in the definitions set),
                # a new definition is created, named the parent node name and the extension Schema (i.e., NodenameRPCOutputSchema).
                # This new definition is a schema containing the content of the body input schema i.e {"child.arg":schema} -> schema
                if schema_out[to_lower_camelcase(child.arg)]:
                    if not '$ref' in schema_out[to_lower_camelcase(child.arg)]:
                        definitions[to_upper_camelcase(node.arg+'RPC_output_schema')] = schema_out[to_lower_camelcase(child.arg)]
                        schema_out = {'$ref':'#/definitions/' + to_upper_camelcase(node.arg+'RPC_output_schema')}
                    else:
                        schema_out = schema_out[to_lower_camelcase(child.arg)]
                else:
                    schema_out = None

        apis['/operations'+str(path)] = print_rpc(node, schema, schema_out)
        return apis

    elif node.keyword == 'notification':
        schema_out = dict()
        gen_model([node], schema_out)
        # For the API generation we pass only the content of the schema i.e {"child.arg":schema} -> schema
        schema_out = schema_out[to_lower_camelcase(node.arg)]
        apis['/streams'+str(path)] = print_notification(node, schema_out)
        return apis

    # Generate APIs for children.
    if hasattr(node, 'i_children'):
        gen_apis(node.i_children, path, apis, definitions, config)


def gen_list_response_schema(path):
    schema = {}
    list_path = '/'.join(path.split('/')[:-2]) +'/'
    schema['items'] = {'type':'string','x-path':path}
    schema['type'] = 'array'
    return schema, list_path


def gen_typedefs(typedefs):
    for typedef in typedefs:
        type = {'name':typedef.arg}
        for attribute in typedef.substmts:
            if attribute.keyword == 'type':
                if attribute.arg[:3] == 'int':
                    type['type'] = 'integer'
                    type['format'] = attribute.arg
                elif attribute.arg == 'enumeration':
                    type['type'] = 'enumeration'
                    type['enum'] = [e[0]
                                    for e in attribute.i_type_spec.enums]
                # map all other types to string
                else:
                    type['type'] = 'string'
        TYPEDEFS[typedef.arg    ] = type


def print_notification(node, schema_out):
    operations = {'get': generate_retrieve(node, schema_out, None)}
    operations['get']['schemes'] = ['ws']
    return operations


def print_rpc(node, schema_in, schema_out):
    operations = {'post': generate_create(node, schema_in, None, schema_out)}
    return operations


# print the API JSON structure.
def print_api(node, config, ref, path):
    """ Creates the available operations for the node."""
    operations = {}
    if config and config != 'false':
        operations['post'] = generate_create(node, ref, path)
        operations['get'] = generate_retrieve(node, ref, path)
        operations['put'] = generate_update(node, ref, path)
        operations['delete'] = generate_delete(node, ref, path)
    else:
        operations['get'] = generate_retrieve(node, ref, path)
    if S_API:
        del operations['post']
    return operations


def get_input_path_parameters(path):
    """"Get the input parameters from the path url."""
    path_params = []
    params = path.split('/')
    for param in params:
        if len(param) > 0 and param[0] == '{' and param[len(param) - 1] \
                == '}':
            path_params.append(param[1:-1])
    return path_params


###########################################################
############### Creating CRUD Operations ##################
###########################################################

# CREATE

def generate_create(stmt, schema, path, rpc=None):
    """ Generates the create function definitions."""
    if path:
        path_params = get_input_path_parameters(path)
    post = {}
    generate_api_header(stmt, post, 'Create', path)
    # Input parameters
    if path:
        post['parameters'] = create_parameter_list(path_params)
    else:
        post['parameters'] = []
    in_params = create_body_dict(stmt.arg, schema)
    if in_params:
        post['parameters'].append(in_params)
    else:
        if not post['parameters']:
            del post['parameters']
    # Responses
    if rpc:
        response = create_responses(stmt.arg, rpc)
    else:
        response = create_responses(stmt.arg)
    post['responses'] = response
    return post


# RETRIEVE

def generate_retrieve(stmt, schema, path):
    """ Generates the retrieve function definitions."""
    if path:
        path_params = get_input_path_parameters(path)
        is_collection = False
        if re.search(r"\{*\}",path.split('/')[-2]):
            is_collection = True

    get = {}
    generate_api_header(stmt, get, 'Retrieve', path, stmt.keyword in ['container','list']
                        and not is_collection)
    if path:
        get['parameters'] = create_parameter_list(path_params)

    # Responses
    response = create_responses(stmt.arg, schema)
    get['responses'] = response
    return get


# UPDATE

def generate_update(stmt, schema, path):
    """ Generates the update function definitions."""
    if path:
        path_params = get_input_path_parameters(path)
    put = {}
    generate_api_header(stmt, put, 'Update', path)
    # Input parameters
    if path:
        put['parameters'] = create_parameter_list(path_params)
    else:
        put['parameters'] = []
    in_params = create_body_dict(stmt.arg, schema)
    if in_params:
        put['parameters'].append(in_params)
    else:
        if not put['parameters']:
            del put['parameters']
    # Responses
    response = create_responses(stmt.arg)

    put['responses'] = response
    return put


# DELETE

def generate_delete(stmt, ref, path):
    """ Generates the delete function definitions."""
    path_params = get_input_path_parameters(path)
    delete = {}
    generate_api_header(stmt, delete, 'Delete', path)
    # Input parameters
    if path_params:
        delete['parameters'] = create_parameter_list(path_params)

    # Responses
    response = create_responses(stmt.arg)
    delete['responses'] = response
    return delete


def create_parameter_list(path_params):
    """ Create description from a list of path parameters."""
    param_list = []
    for param in path_params:
        parameter = {}
        parameter['in'] = 'path'
        parameter['name'] = str(param)
        parameter['description'] = 'ID of ' + str(param)
        parameter['required'] = True
        parameter['type'] = 'string'
        param_list.append(parameter)
    return param_list


def create_body_dict(name, schema):
    """ Create a body description from the name and the schema."""
    body_dict = {}
    if schema:
        body_dict['in'] = 'body'
        body_dict['name'] = name
        body_dict['schema'] = schema
        body_dict['description'] = name + 'body object'
        body_dict['required'] = True
    return body_dict


def create_responses(name, schema=None):
    """ Create generic responses based on the name and an optional schema."""
    response = {
        '200': {'description': 'Successful operation'},
        '400': {'description': 'Internal Error'}
    }
    if schema:
        response['200']['schema'] = schema
    return response


def generate_api_header(stmt, struct, operation, path, is_collection=False):
    """ Auxiliary function to generate the API-header skeleton.
    The "is_collection" flag is used to decide if an ID is needed.
    """
    childPath = False
    parentContainer = [to_upper_camelcase(element) for i,element in enumerate(str(path).split('/')[1:-1])
                       if str(element)[0] =='{' and str(element)[-1] == '}' ]


    if len(str(path).split('/'))>3:
        childPath = True
        if S_OPTS.swagger_camelcase:
          parentContainer = ''.join([to_upper_camelcase(element) for i,element in enumerate(str(path).split('/')[1:-1])
                       if not str(element)[0] =='{' and not str(element)[-1] == '}' ])
        else:
          parentContainer = '_'.join([to_upper_camelcase(element) for i,element in enumerate(str(path).split('/')[1:-1])
                       if not str(element)[0] =='{' and not str(element)[-1] == '}' ])  

    struct['summary'] = '%s %s%s' % (
        str(operation), str(stmt.arg),
        ('' if is_collection else ' by ID'))
    struct['description'] = str(operation) + ' operation of resource: ' \
        + str(stmt.arg)
    if S_OPTS.swagger_camelcase:
      struct['operationId'] = '%s%s%s%s' % (str(operation).lower(),
                                          (parentContainer if childPath else ''),
                                          to_upper_camelcase(stmt.arg),
                                          ('' if is_collection else 'ById'))
    else:
      struct['operationId'] = '%s%s_%s%s' % (str(operation).lower(),
                                          ('_'+parentContainer if childPath else ''),
                                          to_upper_camelcase(stmt.arg),
                                          ('' if is_collection else '_by_id'))  
    struct['produces'] = ['application/json']
    struct['consumes'] = ['application/json']


def to_lower_camelcase(name, force=False):
    """ Converts the name string to lower camelcase by using "-" and "_" as
    markers.
    """
    if S_OPTS.swagger_camelcase :
      return re.sub(r'(?:\B_|\b\-)([a-zA-Z0-9])', lambda l: l.group(1).upper(), name)
    else:
      return name


def to_upper_camelcase(name):
    """ Converts the name string to upper camelcase by using "-" and "_" as
    markers.
    """
    if S_OPTS.swagger_camelcase:
      return re.sub(r'(?:\B_|\b\-|^)([a-zA-Z0-9])', lambda l: l.group(1).upper(),
                  name)
    else:
      return name              

