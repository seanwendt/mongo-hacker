function runMatch(cmd, args, regexp) {
    clearRawMongoProgramOutput();
    if (args) {
        run(cmd, args);
    } else {
        run(cmd);
    }
    var output = rawMongoProgramOutput();
    return output.match(regexp);
};

function getEnv(env_var) {
    var env_regex = new RegExp(' ' + env_var + '=(.*)');
    return runMatch('env', '', env_regex)[1];
};

function getVersion() {
    var regexp = /version: (\d).(\d).(\d)/;
    return runMatch('mongo', '--version', regexp).slice(1, 4);
};

function isMongos() {
    return db.isMaster().msg == 'isdbgrid';
};

function getSlowms(){
    if (!isMongos()){
        var current_version = parseFloat(db.serverBuildInfo().version).toFixed(2);
        if (current_version >= 4.0) {
            // The `profile` command can block with pending transactions in 4.0+ (#193)
            return 100;
        }

        var res = db._dbCommand({profile: -1});
        return (res.ok ? res.slowms : 100);
    } else {
        return 100;
    }
};

function maxLength(listOfNames) {
    return listOfNames.reduce(function(maxLength, name) {
        return (name.length > maxLength) ? name.length : maxLength ;
    }, 0);
};

function printPaddedColumns() {
    var columnWidths = Array.prototype.map.call(
        arguments,
        function(column) {
            return maxLength(column);
        }
    );

    for (i = 0; i < arguments[0].length; i++) {
        row = "";
        for (j = 0; j < arguments.length; j++) {
            var separator = ""
            var val = arguments[j][i].toString();
            if (!val && j >= arguments.length - 1) { continue; }
            val = val.pad(columnWidths[j], (j == 0));
            if (j > 0) {
                separator = " " + ((j == 1) ?
                    mongo_hacker_config['column_separator'] :
                    mongo_hacker_config['value_separator']
                ) + " ";
            }
            row += separator + val;
        }
        print(row);
    }

    return null;
};

function runOnDbs(regexp, callback) {
    var originalDb = db.getName();
    db.getMongo().getDBs().databases.filter(function(db) {
        return db.name.match(regexp); }
    ).forEach(function(dbEntry) {
        db = db.getSiblingDB(dbEntry.name);
        callback(db);
    });
    db = db.getSiblingDB(originalDb);
}
