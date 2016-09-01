var fs = require('fs');
var readline = require('readline');
var sp = require('sprintf-js');
const util = require('util');

if (process.argv.length != 4) {
    // 0: node
    // 1: script name
    // 2: the expected input file
    console.error('Both input and output are expected');
    console.error('Usage %s %s input output', process.argv[0], process.argv[1]);
    process.exit(-1);
}

ipFile = process.argv[2];
opFile = process.argv[3];

console.log("Input Parameters: %s-%s", ipFile, opFile);

var opFileDescriptor = fs.openSync(opFile, 'w', '0666');

var ts = (new Date().getTime() / 1000).toFixed();
var officialTable = 'keywords_auto_suggestion';
var tmpTable = sp.sprintf('t_%s_%d', officialTable, ts);
var createTmpTableStatement = sp.sprintf('create table %s like %s;\n', tmpTable, officialTable);
console.log(createTmpTableStatement);
var buffer_TmpTable = Buffer.from(createTmpTableStatement);
console.log("buffer:%s, length:%d", buffer_TmpTable, buffer_TmpTable.length);

var bytesLenght = fs.writeSync(opFileDescriptor, buffer_TmpTable, 0, buffer_TmpTable.length, 0);
// bytesLenght must be equals buffer_TmpTable.length
console.log('length:' + bytesLenght);

const rl = readline.createInterface({
    input: fs.createReadStream(ipFile,
        {
            flags: 'r',
            // encoding: 'utf8', // it make the event 'data' buffer
            fd: null,
            mode: 0o666,
            autoClose: true
        }),
});

var writeStream = fs.createWriteStream(opFile, {
    flags: 'w', // a - append, w- write or create new a file then write, 
    defaultEncoding: 'utf8',
    // fd: null,
    fd: opFileDescriptor, // when the fd is not null, the "opFile" will be ingored.
    mode: 0o666,
    autoClose: true,
    start: buffer_TmpTable.length
});

console.log('Writable Output Path:%s', writeStream.path);

writeStream.on('open', (fd) => {
    console.log('success- writeStream "open" event:' + fd);
    fs.fstat(fd, function (err, stats) {
        var fileStats = util.inspect(stats);
        console.log('FD stats: ' + fileStats);
    })
});

writeStream.on('error', (error) => {
    console.error(error);
    process.exit(-1);
});

function echoFile(sql, callback) {
    writeStream.write(sql, 'utf8', callback);
}

var WindowSize = 5000;
var count = 0;
var valueArray = new Array();
var illegalCount = 0;

var mysqlBatchInsertCmd = 'insert into %s (keyword,frequency,language, country) values %s;\n';
var mysqlBatchValueSchema = '("%(keyword)s",%(frequency)d,"%(language)s","%(country)s")';



rl.on('line', (line) => {
    var t = line.split('\t');
    if (t.length != 2) {
        console.error('illegal line:' + line);
        illegalCount++;
        return;
    }
    var keyword = t[0];
    var frequency = t[1];
    if (keyword.endsWith('\\')) {
        illegalCount++;
        return;
    }
    var kseg = keyword.split('\001'); // ctr-a
    // console.log('%s-%s-%s', kseg[0],kseg[1],kseg[2]);    
    if (kseg.length != 3) {
        illegalCount++;
        return;
    }
    var language = kseg[0];
    var country = kseg[1];
    keyword = kseg[2];
    if (language.length == 0 || country.length == 0 || keyword.length == 0) {
        illegalCount++;
        return;
    }

    var entity = sp.sprintf(mysqlBatchValueSchema, {
        language: language,
        country: country,
        keyword: keyword,
        frequency: frequency
    });

    valueArray.push(entity);
    count++;
    if (valueArray.length == WindowSize) {
        console.log('count=%d,array length =%d', count, valueArray.length);
        var valueBatch = valueArray.join(',');
        valueArray.length = 0; // clear the array
        //valueArray = [];
        var sql = sp.sprintf(mysqlBatchInsertCmd, tmpTable, valueBatch);
        echoFile(sql, function (err) {
            if (err) {
                console.error('failure to write file');
            }
            console.log('success to write file.');
        });
    }
}).on('close', () => {
    if (valueArray.length > 0) {
        console.log('event-close, count=%d,array length =%d', count, valueArray.length);
        var valueBatch = valueArray.join(',');
        var sql = sp.sprintf(mysqlBatchInsertCmd, tmpTable, valueBatch);
        echoFile(sql, function (err) {
            if (err) {
                console.error('failure in event close.');
            }
            console.log('success to write file.');
            echoFile(sp.sprintf(
                'rename table %(tableName)s to backup_%(tableName)s_%(timestamp)s, %(tmpTableName)s to %(tableName)s;\
                \nANALYZE TABLE %(tableName)s;', {
                    tableName: officialTable,
                    timestamp: ts,
                    tmpTableName: tmpTable
                }), (error) => {
                    if (error) { console.error('failure to rename table;'); } console.log('success to rename table');
                    console.log('illegail lines:%d', illegalCount);
                    console.log('success, good job :)');
                    //     	process.exit(0);
                });
        });
    } else {
        console.log('event-close, valueArray.length:%d', valueArray.length);
    }
});
