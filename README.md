# Synlan

Synlan is an Application to collect Network informations and save it into an graph database.

## Installation

Synlan is running with Node.js, to execute the application 'NPM' is required.
Initialize NPM in Project folder:

```
npm init
```

Some modules are required to run the application, you need first to install them.
Requires node modules are written in the package.json under 'dependencies'
Installing all required node modules:

```
npm install
```


## Configuration

Before running, the application must be configured.
To configure the application, open the json file 'general.json' under 'src/config'

```
"IPAM" : {
    "host" : "ipam.domain.test",
    "port" : 80,
    "path" : "/index.php?i=list_all",
    "method" : "GET",
    "headers" : {
      "Accept" : "application/json"
    }
}
```



## Usage

After finishing the configuration, run the application with following command:


```
node Main.js
```
