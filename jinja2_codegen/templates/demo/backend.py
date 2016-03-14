# Example, only works for COP

from objects_common.keyedArrayType import KeyedArrayType
from objects_service_topology.topology import Topology
from objects_service_call.connection import Connection
from objects_service_call.call import Call
import json
from objects_service_path_computation.pathRequest import PathRequest
from objects_service_virtual_network.virtualNetwork import VirtualNetwork

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

topologies = KeyedArrayType(Topology, 'topologyId')
connections = KeyedArrayType(Connection, 'connectionId')
calls = KeyedArrayType(Call, 'callId')
pathComputation = KeyedArrayType(PathRequest, 'pathComputationId')
virtualNetworks = KeyedArrayType(VirtualNetwork, 'virtualNetworkId')

def save_state():
    json_struct = {'connections' : connections.json_serializer(), 'calls' : calls.json_serializer(),
                   'topologies' : topologies.json_serializer(), 'pathComputation' : pathComputation.json_serializer(),
                   'virtualNetworks' : virtualNetworks.json_serializer()}
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
    topologies.load_json(json_struct['topologies'])
    connections.load_json(json_struct['connections'])
    calls.load_json(json_struct['calls'])
    pathComputation.load_json(json_struct['pathComputation'])
    virtualNetworks.load_json(json_struct['virtualNetworks'])
    return True
