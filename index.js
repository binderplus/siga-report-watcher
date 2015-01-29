#!/usr/bin/env node
var fs          = require('fs')
var path        = require('path')
var tedious     = require('tedious')
var optimist    = require('optimist')
var async       = require('async')

// Parse CLI
var argv = optimist
    .usage('siga-report-watcher --c path/to/config.json --u <SQLUser> --p <SQLPassword>')
    .alias('c', 'config')   .describe('c', 'Configuration file.')     .default('c', path.join(__dirname, 'config.json'))
    .alias('u', 'username') .describe('u', 'Database Username')       .demand('u')
    .alias('p', 'password') .describe('p', 'Database Password')       .demand('p')
    .alias('s', 'server')   .describe('s', 'Database Server Address') .default('s', 'localhost')
    .alias('i', 'instance') .describe('i', 'Database Instance Name')  .default('i', 'SQLExpress')
    .alias('d', 'database') .describe('d', 'Database Name')           .default('d', 'SIGA')
    .alias('t', 'table')    .describe('t', 'Database Table')          .default('t', 'ArchivosAImprimir')
    .argv

// Read config file
if (!fs.existsSync(argv.config)) {
    console.error('ERROR: Can\'t find config file ' + argv.config + '\r\n')
    optimist.showHelp()
    process.exit(1)
}

// Read config
var config = JSON.parse(fs.readFileSync(argv.config, "utf8"))

// mixin arguments
config.database = {
	username: argv.username,
	password: argv.password,
	server  : argv.server,
	instance: argv.instance,
	database: argv.database,
	table   : argv.table
}

// Normalize full file description format { source: filename, output: [ row ] }
var files = config.files.map(function(file) {
    if (typeof file === 'string') file = { source: file, output: [ file ] }
    if (typeof file !== 'object' && !file.source) throw new TypeError('wrong file format')
    if (typeof file.output === 'string') file.output = [ file.output ]
    if (!!config.path) file.source = path.join(config.path, file.source)
    return file
})

// Get sources
var sources = files.map(function(file) { 
    return file.source
})

// Simple Debounce implementation
var _debounceLastCall = [];
function debounce (event, func) {
	var now = new Date();
	if ((now - (_debounceLastCall[event]||0)) > 1000) {
		_debounceLastCall[event] = new Date();
		func();
	}
}

// Watch for file changes
files.forEach(function(file) {
    fs.watch(file.source, { persistent: true}, function (event) {
        if (event !== 'change') return;
        debounce(file.source+event, function() {
        	console.log('<- Changed', path.basename(file.source));
        	saveDB(file);
        })
    })
})

/* Save file to DB */
function saveDB (file) {

	// Get file contents
    var source = fs.readFileSync(file. source, 'utf8')
    var source = source.substr(1) // FIX ÿ issue

    // Save outputs
    file.output.forEach(function (output) {

		// Connect to database
		var connection = new tedious.Connection({
		    userName: config.database.username,
		    password: config.database.password,
		    server  : config.database.server,
		    options : {
		        instanceName: config.database.instance,
		        databaseName: config.database.database
		    }
		})

        var query = " UPDATE " + argv.table
                  + " SET ReporteSecundario = @file"
                  + " WHERE NombreReporteOriginal = @name"


        // Configure request
        var request = new tedious.Request(query, function (err) {
            if (!!err) return console.error(err)
           	connection.close();
            console.log('-> Updated', output)
        })

        request.addParameter('name', tedious.TYPES.VarChar, output)
        request.addParameter('file', tedious.TYPES.VarChar, source)

        // Execute Query
        connection.on('connect', function (err) {
		    if (!!err) throw err
        	connection.execSql(request)
		})
    })


	

}
