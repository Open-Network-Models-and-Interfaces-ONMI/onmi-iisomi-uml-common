# uml-migration

A project using xslt to migrate UML projects from Papyrus Mars to Papyrus Oxygen.

## Prerequisits

### Java8

### Saxon xslt processor

Please download the Saxon xslt processor https://sourceforge.net/projects/saxon/files/latest/download?source=typ_redirect
and copy the saxon9he.jar into folder ./src/lib.

### Nodejs

Please install node js on your system.
https://nodejs.org/en/

### git

Please install git on your system.
https://git-scm.com/downloads

## Initialisation

```
npm install
```

## Usage

Copy the papyrus project of Mars version to ./source folder.

```
npm run start
```

The merged papyrus project for version Oxygen can be found in the ./target folder.