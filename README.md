# Server Generator for Python

Python code that uses Swagger json outputs from **YangJsonTools** to generate a **RESTful server** and the defined objects

## Getting started

### How?

- Follow the indications from [EAGLE YangJsonTools](https://github.com/OpenNetworkingFoundation/EAGLE-Open-Model-Profile-and-Tools/tree/YangJsonTools) for the Swagger json generation.

- Run: `$ python JsonCodeTools.py jsonfile.json` with **jsonfile** as **Tapi-ObjectClasses.json** (as example)

- Check **CGConfiguration.xml** to enable/disable CORS and Basic Authentication

### Dependencies
To allow simple installation using pip commands, install [setuptools](https://pypi.python.org/pypi/setuptools).

The code generator itself uses the templating language [Jinja2](http://jinja.pocoo.org/docs/dev/intro/#installation).
 ```
pip install Jinja2
 ```
The Jinja2 library also requires the setuptools package to be installed, see step one.

 This code generates python code that uses:
 - [Flask](http://flask.pocoo.org/)
```
pip install flask
```
 - [Twisted](https://twistedmatrix.com/trac/)
```
pip install twisted
```
 - [Autobahn] (https://pypi.python.org/pypi/autobahn)
```
pip install autobahn
```

### Server generation

```
python JsonCodeTools.py swagger_json_file_a.json swagger_json_file_b.json -o TAPIserver/
```

### License

Copyright 2015 University of Bristol, High Performance Networks group.

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
