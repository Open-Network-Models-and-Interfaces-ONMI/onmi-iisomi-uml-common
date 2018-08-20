# YangJsonTools

## Overview

YangJsonTools provides necessary tools for the translation from YANG schemas to JSON.

This is done with the assistance [Pyang](https://github.com/mbj4668/pyang). Pyang is an extensible YANG validator and converter written in python. It can be used to validate YANG modules for correctness, to transform YANG modules into other formats, and to generate code from the modules.

This project contains two pyang plugins:

- [SWAGGER](http://swagger.io/)
- [JSON schema](http://json-schema.org/)

## Usage

### Prerequisites

- [pyang](https://pypi.org/project/pyang/)  # tested with 1.7.5
- [swagger](./swagger.py) registered as pyang plugin
- [json_schema](./json_schema.py) registered as pyang plugin
- Docker (for generating swagger server stub)

Set up a python virtual environment.

```bash
# Set up a python virtual environment.
virtualenv env
source env/bin/activate
# Install pyang
pip install pyang
# Set environment variable for pyang plugin usage
export PYBINDPLUGIN=`echo $PWD`
echo $PYBINDPLUGIN
```

### Generate Swagger Specs

```bash
# Clone the TAPI project into the import directory (import directory is ignored by git)
git clone https://github.com/OpenNetworkingFoundation/TAPI.git import
# Generate the swagger spec
pyang --plugindir $PYBINDPLUGIN -f swagger -p import/YANG -o export/tapi-connectivity.json import/YANG/tapi-connectivity*.yang --generate-rpc=False

      --use the option '-p' to specify the path of the yang models for import purposes.
```

#### Have a look at the JSON output with the Swagger editor

[Swagger editor](http://editor.swagger.io/#/)

#### To build a Swagger server stub

We will use the [swagger code generator](https://github.com/swagger-api/swagger-codegen)

> Optionally, [Swagger editor](http://editor.swagger.io/#/) can be used to export a server stub

```bash
docker run --rm -v ${PWD}/export:/local swaggerapi/swagger-codegen-cli generate \
    -i /local/tapi-connectivity.json \
    -l python-flask \
    -o /local/server
# Build the server image
cd export/server
docker build -t swagger_server .

# Start up a container
docker run -p 8080:8080 swagger_server
```

Open Swagger UI: http://localhost:8080/restconf/ui/#

### Generate JSON Schema Files

Run pyang:

Examples:

```bash
pyang --plugindir $PYBINDPLUGIN -f json_schema --schema_path http://x.y.z/rootschema -p path/source-files-folder input-filename.yang -o output-filename

pyang --plugindir $PYBINDPLUGIN -f json_schema --schema_path file:///home/username/basefolder-local-files -p path/source-files-folder input-filename.yang -o output-filename

      --use the option '-p' to specify the path of the yang models for import purposes.
      --use the option '--schema_path' to specify the url of the basefolder where the generated JSON Schema files will be stored.
```

## License

Copyright 2015 CTTC.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at [apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

## Acknowledgements

The Swagger pyang plugin is the result of [STRAUSS project](http://www.ict-strauss.eu/en/). The EAGLE project forks the proposed plugin from [STRAUSS github repository](https://github.com/ict-strauss/COP).
