#!/usr/bin/env node
var fs          = require('fs')
var path        = require('path')
var tedious     = require('tedious')
var optimist    = require('optimist')

// Parse CLI
var argv = optimist
    .usage('siga-report-watcher --c path/to/config.json --u <SQLUser> --p <SQLPassword>')
    .alias('c', 'config')   .describe('c', 'Configuration file.')     .default('c', './config.json')
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
var config = require(argv.config)

// Connect to database
var connection = new tedious.Connection({
    userName: argv.username,
    password: argv.password,
    server  : argv.server,
    options : {
        instanceName: argv.instance,
        databaseName: argv.database
    }
}).on('connect', function (err) {
    if (!!err) throw err
    connection.connected = true
    console.log('Established database connection!')
})

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

// Watch for file changes
files.forEach(function(file) {
    fs.watch(file.source, { persistent: true}, function (event) {
        if (event !== 'change') return
        //console.log('File changed: ' + file.source)
        saveDB(file)
    })
})

/* Save file to DB */
function saveDB (file) {
    // Queue until connected!
    if (!connection.connected) return connection.on('connect', saveDB.bind(null, file))

    // Get file contents
    var source = fs.readFileSync(file. source, 'utf8')
    var source = source.substr(1) // FIX ÿ issue

    // Save outputs
    file.output.forEach(function (output) {
        var query = " UPDATE " + argv.table
                  + " SET ReporteSecundario = @file"
                  + " WHERE NombreReporteOriginal = @name"
        var request = new tedious.Request(query, function (err) {
            if (!!err) return console.error(err)
            console.log('Updated ' + output)
        })
        request.addParameter('name', tedious.TYPES.VarChar, output)
        request.addParameter('file', tedious.TYPES.VarChar, source)
        connection.execSql(request)
    })
}
