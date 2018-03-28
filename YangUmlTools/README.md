# YANG to UML

Several Standards developing organizations (SDO) such as  ietf, ITU-T, IEEE, MEF and more will use Papyrus/UML to discribe information models. Tools are used to convert later UML to different data models for differnt transport protocols (Yang, Swagger, ...)

In order to be more efficent, UML information modules should reference existing and common yang modules as references.

It requires an UML representation of the Yang modules.

This project is a first idea how a "tool" can fulfill the requirements for converting existing Yang to UML (Papyrus). 

## High-level

UML is represented in Papyrus as xmi, which is xml.
Yang modules can be represented as yin, which is also xml.

So the task is to convert xml to xml and the recommended way is using xslt.

## Prerequisites

### **java 8**: the Java development kit.  - 

openJdk 8 is recommended. Here the install procedure: [ubuntu openjdk](https://wiki.ubuntuusers.de/Java/Installation/OpenJDK/)

```
sudo apt-get update
sudo apt-get install openjdk-8-jdk 
```

Add the JAVA_HOME variable to your profile (~/.profile) and activate.

```
export JAVA_HOME="/usr/lib/jvm/java-8-openjdk-amd64" >> ~/.profile
source ~/.profile
```
      
### **maven**: the Apache build manager for Java projects.
       
Is within the ubuntu repository.

```
sudo apt-get install maven
```
 
### **git**: the version control system.

```
sudo apt-get install git
```

### **pyang**: the YANG validator, transformator and code generator

```
sudo apt-get install python-setuptools
git clone https://github.com/mbj4668/pyang
cd pyang
python setup.py install
```

## Usage

```
git clone https://github.com/OpenNetworkingFoundation/EAGLE-Open-Model-Profile-and-Tools
cd EAGLE-Open-Model-Profile-and-Tools/YangUmlTools
mvn clean install
```

You will find the generated uml files in folder './target/generated-resources/xml/xslt/'.


