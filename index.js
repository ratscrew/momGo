"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var rx_server_1 = require('rx-server');
var mongoDriver = require('mongodb');
var q = require('q');
var rxjs_1 = require('rxjs');
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
        console.log(save);
        return me.db(dbName).then(function (_db) {
            var collection = _db.collection(collectionName);
            var update = {};
            if (save.$set)
                update.$set = save.$set;
            if (save.$unset)
                update.$unset = save.$unset;
            if (Object.keys(update).length > 0) {
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
            }
            else
                return console.log('nothing to save');
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
var Query = (function (_super) {
    __extends(Query, _super);
    function Query(user, data, globalEventHandler, functionName, momgo) {
        _super.call(this, user, data, globalEventHandler);
        this.functionName = functionName;
        this.momgo = momgo;
        this.docs = [];
        this.docLisseners = [];
        this.query = {};
        this.projection = {};
        this.dbName = "test";
        this.collectionName = "testing";
        this.whereKey = {};
        this._firstRun = true;
        var me = this;
        me.whereKey = {};
        me.whereKey[me.dbName] = {};
        me.whereKey[me.dbName][me.collectionName] = { update: 1 };
        me.observable = rxjs_1.Observable.create(function (_s) {
            _s.next({ rId: me._rId });
            me.runQuery(_s).then(function () {
                me.buildUpdateLisseners(_s, globalEventHandler);
            });
            var gc = globalEventHandler.globalEventHandlerClient.createEventLissener(me.functionName, me.whereKey);
            gc.observable.subscribe(function (x) {
                me.runQuery(_s, x.msg).then(function () {
                    me.buildUpdateLisseners(_s, globalEventHandler);
                });
            });
            return function () {
                gc.dispose();
                me.docLisseners.forEach(function (idLissener) {
                    idLissener.dispose();
                });
            };
        });
    }
    Query.prototype.buildUpdateLisseners = function (_s, globalEventHandler) {
        var me = this;
        var newDocLisseners = [];
        me.docs.forEach(function (_id) {
            var key = {};
            key[me.dbName] = {};
            key[me.dbName][me.collectionName] = { _id: {} };
            key[me.dbName][me.collectionName]._id[_id] = 1;
            var idLissener = globalEventHandler.globalEventHandlerClient.createEventLissener(me.functionName + "_id:" + _id, key);
            idLissener.observable.subscribe(function (_x) {
                if (_x.msg.from_rId != me._rId) {
                    if (me.projection && Object.keys(me.projection).length > 1) {
                        for (var i in _x.msg.save.$set) {
                            var val = i.split(".")[0];
                            if (!me.projection[val]) {
                                delete _x.msg.save.$set[i];
                            }
                        }
                    }
                    _s.next({ update: _x.msg });
                }
            });
            newDocLisseners.push(idLissener);
        });
        me.docLisseners.forEach(function (_idLissener) {
            _idLissener.dispose();
        });
        me.docLisseners = newDocLisseners;
    };
    Query.prototype.runQuery = function (_s, _update) {
        if (_update === void 0) { _update = { _id: null }; }
        var me = this;
        return me.momgo.db(me.dbName).then(function (_db) {
            var collection = _db.collection(me.collectionName);
            var p = q.when(true);
            if (_update._id && me.docs.indexOf(_update._id) == -1) {
                p = collection.findOne({ $and: [{ _id: new me.momgo.ObjectID(_update._id) }, me.query] }, { _id: 1 }).then(function (doc) {
                    return doc ? true : false;
                });
            }
            return p.then(function (shouldFire) {
                if (shouldFire) {
                    var cusor = collection.find(me.query).project({ _id: 1 });
                    if (me.limit)
                        cusor.limit(me.limit);
                    if (me.skip)
                        cusor.skip(me.skip);
                    if (me.sort)
                        cusor.sort(me.sort);
                    return cusor.toArray().then(function (_docs) {
                        _docs = _docs.map(function (_doc) {
                            return _doc._id.toString();
                        });
                        var resendDocs = false;
                        if (me._firstRun || _docs.length != me.docs.length)
                            resendDocs = true;
                        _docs.forEach(function (_id, i) {
                            if (_id != me.docs[i]) {
                                resendDocs = true;
                            }
                            if (me.docs.indexOf(_id) == -1) {
                                collection.findOne({ _id: new me.momgo.ObjectID(_id) }, me.projection).then(function (doc) {
                                    _s.next({ doc: doc });
                                });
                            }
                        });
                        if (!resendDocs) {
                            me.docs.forEach(function (_id, i) {
                                if (_id != _docs[i])
                                    resendDocs = true;
                            });
                        }
                        if (resendDocs) {
                            _s.next({ _ids: _docs });
                            me.docs = _docs;
                        }
                        me._firstRun = false;
                    });
                }
            });
        });
    };
    return Query;
}(rx_server_1.publicFunction));
exports.Query = Query;
var Save = (function (_super) {
    __extends(Save, _super);
    function Save(user, data, globalEventHandler, momgo) {
        _super.call(this, user, data, globalEventHandler);
        this.momgo = momgo;
        this.dbName = "test";
        this.collectionName = "testing";
        var me = this;
        var key = {};
        me.observable = rxjs_1.Observable.create(function (_s) {
            key[me.dbName] = {};
            key[me.dbName][me.collectionName] = { update: me.buildUpdateKey(data.save.$set), _id: {} };
            key[me.dbName][me.collectionName]._id[data._id] = 1;
            var _s0 = globalEventHandler.globalEventHandlerClient.createEvent('save', key);
            me.momgo.save(me.dbName, me.collectionName, data._id, data.save).then(function () {
                _s0.next(data);
                _s0.dispose();
                _s.next('complete');
                _s.complete();
            });
        });
    }
    Save.prototype.buildUpdateKey = function (_set) {
        var update = {}, me = this;
        if (!_set || Object.keys(_set).length == 0)
            return update;
        Object.keys(_set).forEach(function (_key) {
            me.buildObj(update, _key.split('.'));
        });
        return update;
    };
    Save.prototype.buildObj = function (obj, array) {
        var me = this;
        if (array[0]) {
            var key = array[0];
            if (!obj[key])
                obj[key] = 1;
            array.splice(0, 1);
            if (array.length > 0) {
                if (obj[key] == 1)
                    obj[key] = {};
                me.buildObj(obj[key], array);
            }
        }
        return obj;
    };
    return Save;
}(rx_server_1.publicFunction));
exports.Save = Save;
//# sourceMappingURL=index.js.map