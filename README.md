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
    4. [Device Location](#device-location)
    4. [Devices](#devices)

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

After starting the Server.js a Server is is listening under port 3000.

### Device location

You can get the location of an devices by using following url: 

```
localhost:3000/location?hostname=<hostname>
```

Example response:

```javascript
[
    {
        port: "8",
        name: "host1",
        mac: "78:92:9C:46:B5:14",
        timestamp: "1507116994633",
        switch: "switch1",
        type: "Device"
    },
    {
        name: "LAN / WLAN",
        type: "DevicePort"
    },
    {
        port: "10",
        name: "A1",
        room: "room1",
        switch: "switch1",
        type: "LocationPort"
    },
    {
        name: "Network",
        type: "SwitchPortRoom"
    },
    {
        name: "8",
        type: "SwitchPort"
    },
    {
        address: "switch1.domain.test",
        ip: "0.0.0.0",
        name: "switch1",
        url: "switch1.domain.test",
        timestamp: "1507116994452",
        type: "Switch"
    }
]
```

The response returns an array starting with a device and ending with a switch.<br />
The symbolized path looks like:<br />
(device) <- (devicePort) <- (locationPort) <- (switchPortRoom) <- (SwitchPort) <- (switch)

### Devices

You can get all devices or filter a single device.
To get all devices:

```
localhost:3000/devices
```

To search a single device:

```
localhost:3000/devices?name=<hostname>
```

Example response:

```javascript
[
    {
        port: "45",
        name: "printer",
        mac: "00:00:00:00:00:00",
        timestamp: "1507126009521",
        switch: "switch1"
    },
    {
        port: "38",
        name: "pc1",
        mac: "00:00:00:00:00:00",
        timestamp: "1507126009521",
        switch: "switch1"
    }
]
```