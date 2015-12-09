"""Swagger output plugin for pyang.
"""

import optparse
import json
import os
import re
import string
import pyang
from collections import OrderedDict

from pyang import plugin
from pyang import statements
from pyang import Context as ctx
import sys


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
                '--swagger-path',
                dest='swagger_path',
                type='string',
                help='Path to print')]
        optgrp = optparser.add_option_group('Swagger specific options')
        optgrp.add_options(optlist)

    def setup_ctx(self, ctx):
        pass

    def setup_fmt(self, ctx):
        pass

    def emit(self, ctx, modules, fd):
        # TODO: the path variable is currently not used.
        if ctx.opts.swagger_path is not None:
            path = string.split(ctx.opts.swagger_path, '/')
            if path[0] == '':
                path = path[1:]
        else:
            path = None

        emit_swagger_spec(ctx, modules, fd, ctx.opts.path)


def print_header(module, fd):
    """ Print the swagger header information."""
    module_name = str(module.arg)
    header = OrderedDict()
    header['swagger'] = '2.0'
    header['info'] = {
        'description': '%s API generated from %s' % (
            module_name, module.pos.ref.rsplit('/')[-1]),
        'version': '1.0.0',
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
    augments = list()
    # Go through all modules and extend the model.
    for module in modules:
        if not printed_header:
            model = print_header(module, fd)
            printed_header = True
            path = '/'

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
        for element in referenced_models:
            models.append(element)
        # Print the swagger definitions of the Yang groupings.
        definitions = gen_model(models, definitions)

        # If a model at runtime was dependant of another model which had been encounter yet, it is generated 'a posteriori'.
        if pending_models:
            gen_model(pending_models, definitions)

        if PARENT_MODELS:
            for element in PARENT_MODELS:
                if PARENT_MODELS[element]['models']:
                    definitions[element]['discriminator'] = PARENT_MODELS[element]['discriminator']
        # extract children which contain data definition keywords
        chs = [ch for ch in module.i_children
               if ch.keyword in (statements.data_definition_keywords + ['rpc','notification'])]

        # generate the APIs for all children
        if len(chs) > 0:
            model['paths'] = OrderedDict()
            gen_apis(chs, path, model['paths'], definitions)

        model['definitions'] = definitions
        fd.write(json.dumps(model, indent=4, separators=(',', ': ')))


def findModels(ctx, module, children, referenced_models):
    for child in children:
        if hasattr(child, 'substmts'):
             for attribute in child.substmts:
                if attribute.keyword == 'uses':
                    if len(attribute.arg.split(':'))>1:
                        for i in module.search('import'):
                            subm = ctx.get_module(i.arg)
                            models = [group for group in subm.i_groupings.values() if str(group.arg) == str(attribute.arg.split(':')[-1]) and group.arg not in [element.arg for element in referenced_models]]
                            for element in models:
                                referenced_models.append(element)
                            referenced_models = findModels(ctx, subm, models, referenced_models)
                    else:
                        models = [group for group in module.i_groupings.values() if str(group.arg) == str(attribute.arg) and group.arg not in [element.arg for element in referenced_models]]
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
                            print subm
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
def gen_model(children, tree_structure):
    """ Generates the swagger definition tree."""
    referenced = False
    extended = False
    for child in children:
        #print child.arg
        node = dict()
        extended = False
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
                            node['enum'] = [e
                                            for e in TYPEDEFS[attribute.arg]['enum']]
                        # map all other types to string
                        else:
                            node['type'] = 'string'
                    elif attribute.arg[:3] == 'int':
                        node['type'] = 'integer'
                        node['format'] = attribute.arg
                    elif attribute.arg == 'boolean':
                        node['type'] = attribute.arg
                    elif attribute.arg == 'enumeration':
                        node['type'] = 'string'
                        node['enum'] = [e[0]
                                        for e in attribute.i_type_spec.enums]
                    # map all other types to string
                    else:
                        node['type'] = 'string'
                elif attribute.keyword == 'mandatory':
                    parent_model = to_upper_camelcase(child.parent.arg)
                    if parent_model not in PARENT_MODELS.keys():
                        PARENT_MODELS[parent_model] = {'models':[],'discriminator':to_lower_camelcase(child.arg)}
                # Process the reference to another model.
                # We differentiate between single and array references.
                elif attribute.keyword == 'uses':
                    if len(attribute.arg.split(':'))>1:
                        attribute.arg = attribute.arg.split(':')[-1]

                    ref = to_upper_camelcase(attribute.arg)
                    ref = '#/definitions/' + ref
                    if str(child.keyword) == 'list':
                        node['items'] = {'$ref': ref}
                        node['type'] = 'array'
                        for attribute in child.substmts:
                            if attribute.keyword == 'key':
                                listkey = to_lower_camelcase(attribute.arg)
                        if listkey:
                            node['x-key'] = listkey
                        referenced = True
                    elif str(child.keyword) == 'grouping':
                        ref = to_upper_camelcase(attribute.arg)
                        if ref in tree_structure:
                            PARENT_MODELS[ref]['models'].append(child.arg)
                            list_properties = [item for item in tree_structure[ref]['properties']]
                            ref = '#/definitions/' + ref
                            node['allOf'] = []
                            node['allOf'].append({'$ref': ref})
                            index = 0
                            for i in range(0, len(child.i_children)):
                                #print len(child.i_children)
                                if to_lower_camelcase(child.i_children[index].arg) in list_properties:
                                    del child.i_children[index]
                                else:
                                    index+=1
                            extended = True
                        else:
                            pending_models.append(child)
                    else:
                        node['$ref'] = ref
                        referenced = True

        # When a node contains a referenced model as an attribute the algorithm
        # does not go deeper into the sub-tree of the referenced model.
        if not referenced :
            if not extended:
                node = gen_model_node(child, node)
            else:
                node_ext = dict()
                node_ext = gen_model_node(child, node_ext)
                node['allOf'].append( node_ext)
                extended = False

        # Leaf-lists need to create arrays.
        # Copy the 'node' content to 'items' and change the reference
        if child.keyword == 'leaf-list':
            ll_node = {'type': 'array', 'items': node}
            node = ll_node
        # Groupings are class names and upper camelcase.
        # All the others are variables and lower camelcase.
        if child.keyword == 'grouping':
            tree_structure[to_upper_camelcase(child.arg)] = node
        else:
            tree_structure[to_lower_camelcase(child.arg)] = node
    # TODO: do we really need this return value? We are working on the
    # reference anyhow.
    return tree_structure


def gen_model_node(node, tree_structure):
    """ Generates the properties sub-tree of the current node."""
    if hasattr(node, 'i_children'):
        properties = {}
        properties = gen_model(node.i_children, properties)
        if properties:
            tree_structure['properties'] = properties
    # TODO: do we need a return value or is the reference enough.
    return tree_structure

def gen_apis(children, path, apis, definitions):
    """ Generates the swagger path tree for the APIs."""
    for child in children:
        gen_api_node(child, path, apis, definitions)
    # TODO: do we need a return value or is the reference enough.
    return apis


# Generates the API of the current node.

def gen_api_node(node, path, apis, definitions):
    """ Generate the API for a node."""
    path += str(node.arg) + '/'
    config = True
    tree = {}
    schema = {}
    for sub in node.substmts:
        # If config is False the API entry is read-only.
        if sub.keyword == 'config':
            # TODO: this is not correct in general because it does not consider
            # inheritance. It should be changed to node.i_config.
            config = sub.arg
        elif sub.keyword == 'key':
            key = sub.arg
        elif sub.keyword == 'uses':
            # Set the reference to a model, previously defined by a grouping.
            schema = {'$ref': '#/definitions/' + to_upper_camelcase(sub.arg)}

    # API entries are only generated from container and list nodes.
    if node.keyword == 'list' or node.keyword == 'container':
        if schema:
            if node.keyword == 'list':
                path += '{' + to_lower_camelcase(key) + '}/'
                apis['/config'+str(path)] = print_api(node, config, schema, path)
            else:
                apis['/config'+str(path)] = print_api(node, config, schema, path)
        else:
            # If the container has not a referenced model it is necessary
            # to generate the schema tree based on the node children.

            # In our case we just need to create arrays with references
            # TODO: extend to general case and clean up the branches.
            if node.keyword == 'container':
                for child in node.i_children:
                    if child.keyword == 'list':
                        schema['type'] = 'array'
                    ref_model = [ch for ch in child.substmts
                                 if ch.keyword == 'uses']
                    schema['items'] = {
                        '$ref': '#/definitions/' + to_upper_camelcase(
                            ref_model[0].arg)
                    }
            else:
                # TODO: dead code for our model
                properties = {}
                item = {}
                item = gen_model(node.i_children, tree)
                properties2 = {}
                properties2['properties'] = item
                properties[str(node.arg)] = properties2
                schema['properties'] = properties
            apis['/config'+str(path)] = print_api(node, config, schema, path)

    elif node.keyword == 'rpc':
        #print node.i_children
        for child in node.i_children:
            if child.keyword == 'input':
                ref_model = [ch for ch in child.substmts
                                 if ch.keyword == 'uses']
                schema = {'$ref':'#/definitions/' + to_upper_camelcase(
                            ref_model[0].arg)}
            elif child.keyword == 'output':
                schema_out = dict()
                ref_model = [ch for ch in child.substmts
                                 if ch.keyword == 'uses']
                schema_out = {'$ref':'#/definitions/' + to_upper_camelcase(
                            ref_model[0].arg)}
        apis['/operations'+str(path)] = print_rpc(node, schema, schema_out)
        return apis

    elif node.keyword == 'notification':
        ref_model = [ch for ch in node.substmts
                         if ch.keyword == 'uses']
        schema_out = {'$ref':'#/definitions/' + to_upper_camelcase(
                    ref_model[0].arg)}

        apis['/streams'+str(path)] = print_notification(node, schema_out)
        return apis

    # Generate APIs for children.
    if hasattr(node, 'i_children'):
        gen_apis(node.i_children, path, apis, definitions)


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
    operations = {}
    operations['get'] = generate_retrieve(node, schema_out, None)
    operations['get']['schemes'] = ['ws']

    return operations

def print_rpc(node, schema_in, schema_out):
    operations = {}
    operations['put'] = generate_update(node, schema_in, None, schema_out)
    return operations
# print the API JSON structure.

def print_api(node, config, ref, path):
    """ Creates the available operations for the node."""
    operations = {}
#     is_list = False
#     if node.keyword == 'list':
#         is_list = True
#     if hasattr(node, 'i_children'):
#         for param in node.i_children:
#             if param.keyword == 'list':
#                 is_list = True
    if config and config != 'false':
        operations['post'] = generate_create(node, ref, path)
        operations['get'] = generate_retrieve(node, ref, path)
        operations['put'] = generate_update(node, ref, path)
        operations['delete'] = generate_delete(node, ref, path)
    else:
        operations['get'] = generate_retrieve(node, ref, path)
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

def generate_create(stmt, schema, path):
    """ Generates the create function definitions."""
    if path:
        path_params = get_input_path_parameters(path)
    post = {}
    generate_api_header(stmt, post, 'Create')
    # Input parameters
    if path_params:
        post['parameters'] = create_parameter_list(path_params)
    else:
        post['parameters'] = []
    post['parameters'].append(create_body_dict(stmt.arg, schema))
    # Responses
    response = create_responses(stmt.arg)
    post['responses'] = response
    return post


# RETRIEVE

def generate_retrieve(stmt, schema, path):
    """ Generates the retrieve function definitions."""
    if path:
        path_params = get_input_path_parameters(path)
    get = {}
    generate_api_header(stmt, get, 'Retrieve', stmt.keyword == 'container'
                        and not path_params)
    if path:
        get['parameters'] = create_parameter_list(path_params)
    else:
        get['parameters'] = []

    # Responses
    response = create_responses(stmt.arg, schema)
    get['responses'] = response
    return get


# UPDATE

def generate_update(stmt, schema, path, rpc=None):
    """ Generates the update function definitions."""
    if path:
        path_params = get_input_path_parameters(path)
    put = {}
    generate_api_header(stmt, put, 'Update')
    # Input parameters
    if path:
        put['parameters'] = create_parameter_list(path_params)
    else:
        put['parameters'] = []
    put['parameters'].append(create_body_dict(stmt.arg, schema))
    # Responses
    if rpc:
        response = create_responses(stmt.arg, rpc)
    else:
        response = create_responses(stmt.arg)
    put['responses'] = response
    return put


# DELETE

def generate_delete(stmt, ref, path):
    """ Generates the delete function definitions."""
    path_params = get_input_path_parameters(path)
    delete = {}
    generate_api_header(stmt, delete, 'Delete')
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
        parameter['description'] = 'ID of ' + str(param)[:-2]
        parameter['required'] = True
        parameter['type'] = 'string'
        param_list.append(parameter)
    return param_list


def create_body_dict(name, schema):
    """ Create a body description from the name and the schema."""
    body_dict = {}
    body_dict['in'] = 'body'
    body_dict['name'] = name
    body_dict['schema'] = schema
    body_dict['description'] = 'ID of ' + name
    body_dict['required'] = True
    return body_dict


def create_responses(name, schema=None):
    """ Create generic responses based on the name and an optional schema."""
    response = {
        '200': {'description': 'Successful operation'},
        '400': {'description': 'Invalid ID parameter'},
        '404': {'description': '' + name.capitalize() + ' not found'}
    }
    if schema:
        response['200']['schema'] = schema
    return response


def generate_api_header(stmt, struct, operation, is_collection=False):
    """ Auxiliary function to generate the API-header skeleton.
    The "is_collection" flag is used to decide if an ID is needed.
    """
    struct['summary'] = '%s %s%s' % (
        str(operation), str(stmt.arg),
        ('' if is_collection else ' by ID'))
    struct['description'] = str(operation) + ' operation of resource: ' \
        + str(stmt.arg)
    struct['operationId'] = '%s%s%s' % (str(operation).lower(),
                                        to_upper_camelcase(stmt.arg),
                                        ('' if is_collection else 'ById'))
    struct['produces'] = ['application/json']
    struct['consumes'] = ['application/json']


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


'''
def import_models(module, path):
    if module.search('namespace'):
        if module.search('namespace')[0].arg[:4] == 'http':
            namespace = ""
            ##TODO: implement a method to access to this repository.
            pass
        elif module.search('namespace')[0].arg[:4] == 'file':
            namespace = module.search('namespace')[0].arg[7:]
            repos = pyang.FileRepository(namespace)
            ctx = pyang.Context(repos)
        else:
            raise Exception('The namespace is incorrect or is missing, impossible to import modules')

    imported_models = OrderedDict()
    for i in module.search('import'):
        filename = "/".join([element for element in i.arg.split(":")]) + ".yang"
        for ch in i.substmts:
            if ch.keyword == "prefix":
                prefix = ch.arg
            elif ch.keyword == "revision-date":
                rev = ch.arg
        if namespace != "":
            f = open(namespace+filename)
        else:
            raise Exception('Namespace not found')
            return None

        text = f.read()
        imported_module = ctx.add_module(filename, text, format, i.arg, rev, expect_failure_error=False)
        imported_groupings = list(imported_module.i_groupings.values())
        imported_definitions = OrderedDict()
        imported_definitions = gen_model(imported_groupings, imported_definitions)

        imported_chs = [ch for ch in imported_module.i_children
           if ch.keyword in (statements.data_definition_keywords + ['rpc','notifications'])]
        imported_model = OrderedDict()
        if len(imported_chs) > 0:
            imported_model['paths'] = OrderedDict()
            gen_apis(imported_chs, path, imported_model['paths'], imported_definitions)

        imported_model['definitions'] = imported_definitions
        imported_models[prefix] = imported_model
    return imported_models'''
