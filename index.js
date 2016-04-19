"use strict";
var mongoDriver = require('mongodb');
var q = require('q');
var MomGo = (function () {
    function MomGo(serverName, dbName) {
        this.serverName = serverName;
        this.dbName = dbName;
        this.MongoClient = mongoDriver.MongoClient;
        this.OnjectID = mongoDriver.ObjectID;
        this.dbs = {};
        this.db();
    }
    MomGo.prototype.mongoConnection = function (connectionStr) {
        var me = this;
        if (me.dbs[connectionStr]) {
            return q.when(me.dbs[connectionStr]);
        }
        else {
            var deferred = q.defer();
            me.dbs[connectionStr] = deferred.promise;
            console.log({ connectionStr: connectionStr });
            me.MongoClient.connect(connectionStr, function (err, _db) {
                if (err) {
                    console.log({ connectionError: err, connectionStr: connectionStr });
                    //throw new Error(err);
                    return deferred.reject(err);
                }
                _db.on('disconnect', function (err) {
                    console.log({ disconnect: err });
                    if (me.dbs[connectionStr])
                        delete me.dbs[connectionStr];
                    throw new Error(err);
                });
                me.dbs[connectionStr] = _db;
                deferred.resolve(_db);
            });
            return me.dbs[connectionStr];
        }
    };
    MomGo.prototype.db = function (_dbName) {
        var me = this;
        if (!_dbName || _dbName == "default")
            _dbName = me.dbName;
        var connectionStr = "";
        if (me.serverName.indexOf('mongodb://') == -1)
            connectionStr = 'mongodb://' + me.serverName + ':27017/' + _dbName;
        else {
            connectionStr = me.serverName.replace("27017?", '27017/' + _dbName + "?");
        }
        return me.mongoConnection(connectionStr).catch(function (err) {
            console.log({ connectionStr: connectionStr, err: err });
            console.log('trying again');
            return me.mongoConnection(connectionStr);
        });
    };
    return MomGo;
}());
exports.MomGo = MomGo;
var m = new MomGo("sdfsdf", "sdfsdf");
m.db();
//# sourceMappingURL=index.js.map