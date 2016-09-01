var fs = require('fs');
var readline = require('readline');
var sp = require('sprintf-js');

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

console.log(ipFile + '-' + opFile);


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
    flags: 'w',
    defaultEncoding: 'utf8',
    fd: null,
    mode: 0o666,
    autoClose: true
});
console.log(writeStream.path);
writeStream.on('error', (error) => {
    console.error(error);
    process.exit(-1);
});

function echoFile(sql, callback) {
    writeStream.write(sql, 'utf8', callback);
}

var WindowSize = 5000;
var count = 0;
var cmd = 'insert into '
var valueArray = new Array();
var illegalCount = 0;
var ts = (new Date().getTime() / 1000).toFixed();
var tmpTable = 't_keywords_auto_suggestion_' + ts;
var officialTable = 'keywords_auto_suggestion';

echoFile(sp.sprintf('create table %s like %s;\n', tmpTable, officialTable), (error) => {
    if (error) { console.error(error); process.exit(-1); }

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
        //var kseg = keyword.split('\001');
        //console.log('%s-%s-%s', kseg[0],kseg[1],kseg[2]);
        var entity = sp.sprintf('("%s",%d)', keyword, frequency);
        valueArray.push(entity);
        count++;
        if (valueArray.length == WindowSize) {
            console.log('count=%d,array length =%d', count, valueArray.length);
            var valueBatch = valueArray.join(',');
            valueArray.length = 0; // clear the array
            //valueArray = [];
            var sql = sp.sprintf('insert into %s (keyword, frequency) values %s;\n', tmpTable, valueBatch);
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
            var sql = sp.sprintf('insert into %s (keyword, frequency) values %s;\n', tmpTable, valueBatch);
            echoFile(sql, function (err) {
                if (err) {
                    console.error('failure in event close.');
                }
                console.log('success to write file.');
                echoFile(sp.sprintf('rename table %s to backup_%s_%s, %s to %s;', officialTable, officialTable, ts, tmpTable, officialTable), (error) => {
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
});
