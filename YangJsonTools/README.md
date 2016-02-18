# YangJsonTools

This branch of [EAGLE-Open-Model-Profile-and-Tools](https://github.com/OpenNetworkingFoundation/EAGLE-Open-Model-Profile-and-Tools) is focused in developing the necessary tools for the translation from YANG schemas to JSON.
We provide two PYANG plugins to provide translation for:
- YANG to [JSON schema](http://json-schema.org/).
- YANG to [SWAGGER specification](http://swagger.io/).

[Pyang](https://code.google.com/p/pyang/) is an extensible YANG validator and converter written in python. 

It can be used to validate YANG modules for correctness, to transform YANG modules into other formats, and to generate code from the modules. We have written two pyang plugins: SWAGGER and JSON Schema:

The YANG defined information models can be translated into [JSON Schema](http://json-schema.org/) syntax with the json_schema pyang plugin.

Besides, the RESTCONF API of the YANG model is interpreted with [Swagger](http://swagger.io/), which is a powerful framework for API description. This framework will be used to generate a Stub server for the YANG module.

The proposed pyang plugin for Swagger is the result of [STRAUSS project](http://www.ict-strauss.eu/en/). The EAGLE project forks the proposed plugin from [STRAUSS github repository](https://github.com/ict-strauss/COP).

##Install pyang

Download pyang [here](https://code.google.com/p/pyang/wiki/Downloads?tm=2) (tested with version 1.5).
Extract the archive to a folder of you choice.
Install pyang  by running the following command inside that folder:

```
sudo python setup.py install
```

#JSON Schema

## Copy the json_schema plugin to pyang's plugin directory:

```
sudo cp pyang_plugins/json_schema.py /usr/local/lib/python2.7/dist-packages/pyang/plugins/
```

## Run pyang json_schema plugin

Run pyang:

Examples:

```
pyang -f json_schema --schema-path http://x.y.z/rootschema -p path/source-files-folder input-filename.yang -o output-filename

pyang -f json_schema --schema-path file:///home/username/basefolder-local-files -p path/source-files-folder input-filename.yang -o output-filename

      --use the option '-p' to specify the path of the yang models for import purposes.
      --use the option '--schema-path' to specify the url of the basefolder where the generated JSON Schema files will be stored.
```

# SWAGGER

## Copy the swagger plugin to pyang's plugin directory:

```
sudo cp pyang_plugins/swagger.py /usr/local/lib/python2.7/dist-packages/pyang/plugins/
```

## Run pyang swagger plugin

Go to the `yang-cop` folder and run pyang:

```
pyang -f swagger -p yang/yang-cop service-call.yang -o service-call.json

      --use the option '-p' to specify the path of the yang models for import purposes.
```

## Have a look at the JSON output with the Swagger editor

[Swagger editor](http://editor.swagger.io/#/)


## To build a server stub

We will use the swagger code generator. The obtained swagger files from our pyang plugin are in swagger v2.0. To generate code from this swagger file version we will need the [development branch](https://github.com/swagger-api/swagger-codegen/tree/develop_2.0) of the swagger code generator:


```
git clone https://github.com/swagger-api/swagger-codegen.git
cd swagger-codegen/
git checkout -b develop_2.0 origin/develop_2.0
```


Go to the swagger-codegen main folder and compile the maven project:

```
mvn clean install
```

Run the code-generator by executing the compiled .jar file:

```
java -classpath 'target/swagger-codegen-2.1.0-SNAPSHOT.jar:target/lib/*' com.wordnik.swagger.codegen.Codegen -i path/to/service-call.json -l jaxrs
```

Run the generated server:

```
cd generated-code/javaJaxRS
mvn jetty:run
```

After starting the server open the following link: 
```
http://localhost:8002/restconf/config/calls
```
If everything worked, you will see this reply:
```
{"code":4,"type":"ok","message":"magic!"}
```


License
-------

Copyright 2015 CTTC.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at [apache.org/licenses/LICENSE-2.0](http://www.apache.org/licenses/LICENSE-2.0)

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

