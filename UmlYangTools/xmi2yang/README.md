# UmlToYang

## Changes

* `config.txt` has been replaced by `config.json` which must now be valid JSON. See below for details.

* `main.js` now has command line options for specifying config, project and output locations - see the usage for details.

## Setup

Before running the xmi2yang tool, check that the javascript dependencies are up-to-date:

```bash
npm install
```

## Usage

To use refactored code:
```bash
node main.js --help
Usage:   node main.js [options]

Converts XML/UML to Yang
Options
	-c		 specify path to config.json, default: specified project directory/config.json
	-d		 specify project directory, default: ./project
	-o		 specify output directory for generated yang files, default: specified project directory
	-h, --help	 print usage information

Example: node main.js -d /opt/project -c /etc/config.json -o /opt/project/yang
```

## Refactoring Accomplishments:

* Broke up main.js into smaller more maintainable pieces.
   * Much more refactoring can occur as there is still a lot of duplicate code.
* Created app.js for importing into other nodejs apps, left main.js for command-line execution.
* Changed config.txt to config.json
* Added support for multiple configs in config.json.
* Configuration matches configuration name to first portion of filename, if no match it defaults
  to the first entry in the list.
   * if the filename is "tapi-common.uml" and the config key is "tapi" it will use that configuration.

## Configuration

The xmi2yang configuration file is a JSON file which by default is called `project/config.json`.
You can create a section for each module by using a key that matches the module name, for
example "tapi" will match tapi-common.uml and tapi-topology.uml.

Example Multiple Configuration file:
```javascript
{
  "tapi": {
    "namespace":"urn:onf:params:xml:ns:yang:",
    "prefix":{
      "tapi-common":"com",
      "tapi-topology":"top",
      "tapi-connectivity":"con",
      "tapi-path-computation":"pat",
      "tapi-virtual-network":"vnw",
      "tapi-notification":"not",
      "tapi-oam":"oam",
      "tapi-odu":"odu",
      "tapi-och":"och"
    },
    "withSuffix":false,
    "organization":"ONF (Open Networking Foundation) IMP Working Group",
    "contact":"WG Web: <https://www.open{[]}networking.org/technical-communities/areas/services/> \n WG List: mailto: <wg list name>@opennetworking.org>, \n.WG Chair: your-WG-chair<mailto:your-WG-chair@example.com> \nEditor: your-name<mailto:your-email@example.com>",
    "revision":{
      "date":"2017-11-13",
      "description":"Test revision",
      "reference":"Papyrus"
    }
  },
  "mef":{
    "namespace":"urn:mef:yang:",
    "organization":"Metro Ethernet Forum (MEF)",
    "contact":"MEF",
    "withSuffix":false,
    "revision": {
      "date":"2017-02-27",
      "description":"MEF NRP 1.0.alpha",
      "reference":"ONF-TR-527, ONF-TR-512, ONF-TR-531, RFC 6020 and RFC 6087"
    }
  }
}
```
