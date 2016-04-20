"use strict";
var mongoDriver = require('mongodb');
var q = require('q');
var MomGo = (function () {
    function MomGo(serverName, dbName) {
        this.serverName = serverName;
        this.dbName = dbName;
        this.MongoClient = mongoDriver.MongoClient;
        this.ObjectID = mongoDriver.ObjectID;
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
    MomGo.prototype.save = function (dbName, collectionName, _id, save) {
        var me = this;
        if (save.$set && Object.keys(save.$set).length > 0)
            me.scanObj(save.$set);
        for (var key in save) {
            console.log(save[key]);
        }
        return me.db(dbName).then(function (_db) {
            var collection = _db.collection(collectionName);
            var update = {};
            if (save.$set)
                update.$set = save.$set;
            if (save.$unset)
                update.$unset = save.$unset;
            return collection.updateOne({ _id: new me.ObjectID(_id) }, update).then(function () {
                var $pull = [];
                if (save.$pull && Object.keys(save.$pull).length > 0) {
                    for (var i in save.$pull) {
                        var p = {};
                        p[i] = null;
                        $pull.push(p);
                    }
                }
                var qList = [];
                $pull.forEach(function (p) {
                    qList.push(collection.updateOne({ _id: new me.ObjectID(_id) }, { $pull: p }));
                });
                return q.all(qList).then(function () {
                    console.log('saved');
                });
            });
        });
    };
    MomGo.prototype.scanObj = function (obj) {
        for (var i in obj) {
            if ((this.isArray(obj[i]) || this.isObject(obj[i])) && !this.isDate(obj[i]))
                this.scanObj(obj[i]);
            else if (this.isString(obj[i]))
                this.checkDate(obj, i);
        }
    };
    MomGo.prototype.isArray = function (val) {
        return (Object.prototype.toString.call(val) === '[object Array]');
    };
    MomGo.prototype.isObject = function (val) {
        return (typeof val === 'object');
    };
    MomGo.prototype.isDate = function (val) {
        if (val != undefined && val != null && !this.isString(val))
            return !!val.getUTCFullYear;
        else
            false;
    };
    MomGo.prototype.isString = function (val) {
        return (typeof val == 'string' || val instanceof String);
    };
    MomGo.prototype.checkDate = function (obj, key) {
        if (obj[key].match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/i))
            obj[key] = new Date(obj[key]);
    };
    return MomGo;
}());
exports.MomGo = MomGo;
//# sourceMappingURL=index.js.map