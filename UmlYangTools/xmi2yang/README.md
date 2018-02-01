# UmlToYang
_Refactored during MEF17 Hackathon 11/13 - 11/15._

Author: Dan Abarbanel <daniel.abarbanel@spirent.com>

## MEF18 APAC HACKATHON
* Merged SNOWMASS master branch
* Created Class Unit Tests, to run `npm run unit-test`
* Created functional tests, to run `npm run test`

To use refactored code:
```bash
node main.js
```

## MEF17 HACKATON

To use refactored code:
```bash
node app.js
```

To use orginal code:
```bash
node main.js
```

## Refactoring Accomplishments:
* Broke up main.js into smaller more maintainable pieces.
   * Much more refactoring can occur as there is still a lot of duplicate code.
* Created app.js for execution, left main.js for backwards compatibility.
* Changed config.txt to config.json
* Added support for multiple configs in config.json.
* Configuration matches configuration name to first portion of filename, if no match it defaults to the first entry in 
  the list. 
   * if the filename is "tapi-common.uml" and the config key is "tapi" it will use that configuration.
                  

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