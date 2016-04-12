"""JSON Schema output plugin for pyang.

    List of contributors:
    -Arturo Mayoral, Optical Networks & Systems group, Centre Tecnologic de Telecomunicacions de Catalunya (CTTC).
    [arturo.mayoral@cttc.es]
    -Ricard Vilalta, Optical Networks & Systems group, Centre Tecnologic de Telecomunicacions de Catalunya (CTTC)
    [ricard.vilalta@cttc.es]

    -Description:
    This code  implements a pyang plugin to translate yang RFC-6020 model files into JSON Schema (http://json-schema.org/draft-04/schema)
    format.
    JSON Schema defines the media type "application/schema+json", a JSON based format for defining the structure of JSON data. JSON Schema
    provides a contract for what JSON data is required for a given application and how to interact with it. JSON Schema is intended to
    define validation, documentation, hyperlink navigation, and interaction control of JSON data.
    
    Any doubt, bug or suggestion: arturo.mayoral@cttc.es , ricard.vilalta@cttc.es
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
NAMESPACE = ''
MODEL_ID = ''

def pyang_plugin_init():
    """ Initialization function called by the plugin loader. """
    plugin.register_plugin(JSON_SchemaPlugin())


class JSON_SchemaPlugin(plugin.PyangPlugin):

    """ Plugin class for JSON Schema file generation."""

    def add_output_format(self, fmts):
        self.multiple_modules = True
        fmts['json_schema'] = self

    def add_opts(self, optparser):
        # A list of command line options supported by the JSON Schema plugin.
        # TODO: which options are really needed?
        optlist = [
            optparse.make_option(
                '--schema_path',
                dest='schema_path',
                type='string',
                help='Path to print')]
        optgrp = optparser.add_option_group('JSON-Schema specific options')
        optgrp.add_options(optlist)

    def setup_ctx(self, ctx):
        pass

    def setup_fmt(self, ctx):
        pass

    def emit(self, ctx, modules, fd):
        emit_json_schema(ctx, modules, fd, ctx.opts.path)

def emit_json_schema(ctx, modules, fd, path):
    """ Emits the complete JSON Schema specification for the yang file."""

    model = OrderedDict()
    if ctx.opts.schema_path is not None:
        global NAMESPACE
        NAMESPACE += ctx.opts.schema_path

    # Go through all modules and extend the model.
    for module in modules:
        global MODEL_ID
        MODEL_ID = module.arg

        print_header(model, module)
        # extract children which contain data definition keywords
        chs = [ch for ch in module.i_children
               if ch.keyword in statements.data_definition_keywords]

        typdefs = [module.i_typedefs[element] for element in module.i_typedefs]
        models = list(module.i_groupings.values())

        # The attribute definitions are processed and stored in the "typedefs" data structure for further use.
        gen_typedefs(typdefs)

        for element in typdefs:
            models.append(element)

        # Print the JSON Schema definitions of the Yang groupings.
        gen_model(models, model)

        # If a model at runtime was dependant of another model which had been encounter yet, it is generated 'a posteriori'.
        if pending_models:
            gen_model(pending_models, model)

        if PARENT_MODELS:
            for element in PARENT_MODELS:
                if PARENT_MODELS[element]['models']:
                    model[element]['discriminator'] = PARENT_MODELS[element]['discriminator']

        # generate the APIs for all children
        if len(chs) > 0:
            properties = OrderedDict()
            gen_schema(chs, properties, model)
            model['properties'] = properties

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


def print_header(schema, statement):
    """ Print the schema header information."""
    module_name = str(statement.arg)
    schema['$schema'] = 'http://json-schema.org/draft-04/schema#'
    schema['id'] = str(module_name)+'#'
    schema['description'] = "JSON-schema generated for "+str(module_name)+" object"
    if str(statement.keyword) == 'list':
        schema['type'] = 'array'
    else:
        schema['type'] = 'object'

def print_header_submodule(schema, statement):
    """ Print the sub-schema header information."""
    module_name = str(statement.arg)
    schema['id'] = '#'+str(module_name)
    if str(statement.keyword) == 'list':
        schema['type'] = 'array'
    else:
        schema['type'] = 'object'


def gen_schema(children, schemas, definitions, config = True):
    """ Generates the JSON Schema path tree for the APIs."""
    for child in children:
        gen_schema_node(child, schemas, definitions, config)

# Generates the API of the current node.
def gen_schema_node(node, schemas, definitions, config = True):
    """ Generate the API for a node."""

    schema = {}

    # API entries are only generated from container and list nodes.
    if node.keyword == 'list' or node.keyword == 'container':
        # We take only the schema model of a single item inside the list as a "body"
        # parameter or response model for the API implementation of the list statement.
        if node.keyword == 'list':
            # Key statement must be present if config statament is True and may
            # be present otherwise.
            schema_list = {}
            gen_model([node], schema_list, config)
            print_header_submodule(schema, node)
            schema['items'] = schema_list[node.arg]['items']
        else:
            gen_model([node], schema, config)
            # For the API generation we pass only the content of the schema i.e {"child.arg":schema} -> schema
            schema = schema[node.arg]

        schemas[node.arg] = schema

    elif node.keyword == 'rpc':
        pass
    elif node.keyword == 'notification':
        pass


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
                        prefix, attribute.arg = attribute.arg.split(':')
                        ref = NAMESPACE + '/' + prefix + '#' + attribute.arg
                        node['$ref'] = ref
                    else:
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
                        else:
                            node['type'] = 'string'
                elif attribute.keyword == 'max-elements':
                   node['maxItems'] = int(attribute.arg)
                elif attribute.keyword == 'min-elements':
                   node['minItems'] = int(attribute.arg)
                #FIXME: KEY attribute need json-schema mapping definition
                #elif attribute.keyword == 'key':
                    #listkey = to_lower_camelcase(attribute.arg)
                elif attribute.keyword == 'mandatory':
                    if 'required' not in tree_structure:
                        tree_structure['required'] = list()
                    tree_structure['required'].append(child.arg)
                elif attribute.keyword == 'config' and attribute.arg == 'false':
                    config = False

                # Process the reference to another model.
                # We differentiate between single and array references.
                elif attribute.keyword == 'uses':
                    # A list is built containing the child elements which are not referenced statements.
                    nonRefChildren = [e for e in child.i_children if not hasattr(e, 'i_uses')]
                    # If a node contains mixed referenced and non-referenced children,
                    # it is a extension of another object, which in JSON-schema is defined using the
                    # "AllOf" statement.
                    if len(attribute.arg.split(':'))>1:
                        prefix, attribute.arg = attribute.arg.split(':')
                        ref = NAMESPACE + '/' + prefix + '#' + attribute.arg
                    else:
                        ref_arg = attribute.arg
                        ref = MODEL_ID + '#' + ref_arg
                    if not nonRefChildren:
                        referenced = True
                    else:
                        if ref_arg in PARENT_MODELS:
                            PARENT_MODELS[ref_arg]['models'].append(child.arg)
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

            tree_structure[child.arg] = node

        elif child.keyword == 'list':
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

            tree_structure[child.arg] = node

        else:
            if referenced:
                node['$ref'] =  ref

            tree_structure[child.arg] = node


def gen_model_node(node, tree_structure, config=True):
    """ Generates the properties sub-tree of the current node."""
    if hasattr(node, 'i_children'):
        properties = {}
        print_header_submodule(tree_structure, node)
        tree_structure['additionalProperties'] = False
        gen_model(node.i_children, properties, config)
        if properties:
            if 'required' in properties:
                tree_structure['required'] = properties['required']
                del properties['required']
            tree_structure['properties'] = properties




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
        TYPEDEFS[typedef.arg] = type



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

