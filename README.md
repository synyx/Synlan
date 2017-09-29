# Synlan

Synlan is an Application to collect Network informations and save it into an graph database.

1. [Installation](#installation)
  1. [Node](#node)
  1. [Neo4j](#neo4j)
2. [Configuration](#configuration)
  2. [general.json](#generaljson)
  2. [neo4j.json](#neo4jjson)
  2. [locations.json](#locationsjson)
  2. [server.json](#serverjson)
  2. [trunkports.json](#trunkportsjson)
3. [Usage](#usage)
4. [API](#api)

## Installation

### Node

Some modules are required to run the application, you need first to install them.<br />
Required modules are written in the package.json under 'dependencies'.<br />
To Install all required node modules execute in the project folder following command:

```bash
$ npm install
```

### Neo4j

The last installation step is to download the graphdatabase Neo4j and to install it.<br />
You can download neo4j [here](https://neo4j.com/download/).

## Configuration

Before running, the application must be configured.<br />
All config files are located under following path: 

```
src/configs/
```

### general.json

**IPAM**

IPAM (IP Adress Management) tool, used to resolve mac-addresses.

Config example:
```javascript
"IPAM" : "ipam.domain.test"
```

Example of expected return value:
```javascript
{
    "hostname": "host",
    "mac": "78:92:9C:46:B5:14",
    "ip": "0.0.0.0"
}
```

**SNMP**

example:
```javascript
"SNMP" : {
    "switches" : [
        {
            "name" : "switch1",
            "url" : "switch1.domain.test",
            "ip" : "0.0.0.0",
            "ports" : 48,
            "trunkPorts": 2,
            "community" : "public"
        },
        {
            "name" : "switch2",
            "url" : "switch2.domain.test",
            "ip" : "0.0.0.0",
            "ports" : 48,
            "trunkPorts": 2,
            "community" : "public"
        }
    ]
}
```

### neo4j.json

To set the Neo4j graphdatabase url, open the json file 'neo4j.json' under 'src/config'.
Replace username and password.

example:
```javascript
{
  "url" : "http://username:password@localhost:7474/"
}
```

### locations.json

example:
```javascript
{

  "locationsList" : [
    "room1",
    "room2"
  ],

  "locationPorts" : [
    {
      "name" : "A1",
      "room" : "room1",
      "switch" : "switch1",
      "switchUrl" : "switch1.domain.test",
      "port": 10
    },
    {
      "name" : "B1",
      "room" : "room2",
      "switch" : "switch1",
      "switchUrl" : "switch1.domain.test",
      "port": 11
    },
    {
      "name" : "B2",
      "room" : "room2",
      "switch" : "switch2",
      "switchUrl" : "switch2.domain.test",
      "port": 10
    }
  ]
}
```

### server.json

example:
```javascript
{
  "updateInterval" : 3
}
```

### trunkports.json

example:
```javascript
[
  {
    "switch" : "switch1",
    "trunkPort" : 48,
    "secondSwitch" : "switch2"
  },
  {
    "switch" : "switch2",
    "trunkPort" : 48,
    "secondSwitch" : "switch1"
  }
]
```

## Usage

After finishing the configuration, go under following path:

```bash
src/
```

run the application with following command:


```bash
$ node Server.js
```

## API