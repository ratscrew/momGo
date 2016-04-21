"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var rx_server_1 = require('rx-server');
var rxjs_1 = require('rxjs');
var index_1 = require('../index');
var q = require('q');
var express = require('express');
var app = express();
var path = require('path');
var _s = require('http').Server(app);
var s = new rx_server_1.server(_s);
app.get('/', function (req, res) {
    res.sendFile(__dirname + '\\public\\index.html');
});
app.get('/es6-shim.min.js', function (req, res) {
    res.sendFile(path.resolve(__dirname + '/../node_modules/es6-shim/es6-shim.min.js'));
});
app.get('/system-polyfills.js', function (req, res) {
    res.sendFile(path.resolve(__dirname + '\\..\\node_modules\\systemjs\\dist\\system-polyfills.js'));
});
app.get('/shims_for_IE.js', function (req, res) {
    res.sendFile(path.resolve(__dirname + '\\..\\node_modules\\angular2\\es6\\dev\\src\\testing\\shims_for_IE.js'));
});
app.get('/angular2-polyfills.js', function (req, res) {
    res.sendFile(path.resolve(__dirname + '\\..\\node_modules\\angular2\\bundles\\angular2-polyfills.js'));
});
app.get('/system.src.js', function (req, res) {
    res.sendFile(path.resolve(__dirname + '\\..\\node_modules\\systemjs\\dist\\system.src.js'));
});
app.get('/Rx.js', function (req, res) {
    res.sendFile(path.resolve(__dirname + '\\..\\node_modules\\rxjs\\bundles\\Rx.js'));
});
app.use('/rxjs', express.static(path.resolve(__dirname + '\\..\\node_modules\\rxjs')));
app.get('/angular2.dev.js', function (req, res) {
    res.sendFile(path.resolve(__dirname + '\\..\\node_modules\\angular2\\bundles\\angular2.dev.js'));
});
app.get('/rx-server/clientScripts/rxServer.js', function (req, res) {
    res.sendFile(path.resolve(__dirname + '\\..\\node_modules\\rx-server\\clientScripts\\rxServer.js'));
});
app.use(express.static(__dirname + '\\public'));
_s.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});
var momgo = new index_1.MomGo("mongodb://test:1234@10.250.100.250:27017,10.252.100.48:27017?PreferredMember=nearest", "test");
var testPF = (function (_super) {
    __extends(testPF, _super);
    function testPF(user, data, globalEventHandler) {
        _super.call(this, user, data, globalEventHandler);
        this.docs = [];
        this.docLisseners = [];
        this.query = {};
        this.projection = {};
        this.dbName = "test";
        this.collectionName = "testing";
        console.log('testPF');
        var me = this;
        me.observable = rxjs_1.Observable.create(function (_s) {
            _s.next({ rId: me._rId });
            me.runQuery(_s).then(function () {
                me.buildUpdateLisseners(_s, globalEventHandler);
            });
            //console.log('testPF.observable');
            // let t = setInterval(()=>{
            //     console.log('testPF.observable.next');
            //     _s.next('testing')
            // },1000)
            var gc = globalEventHandler.globalEventHandlerClient.createEventLissener("testPF", { "test": { testing: { update: 1 } } });
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
    testPF.prototype.buildUpdateLisseners = function (_s, globalEventHandler) {
        var me = this;
        var newDocLisseners = [];
        me.docs.forEach(function (_id) {
            var key = {};
            key[me.dbName] = {};
            key[me.dbName][me.collectionName] = { _id: {} };
            key[me.dbName][me.collectionName]._id[_id] = 1;
            var idLissener = globalEventHandler.globalEventHandlerClient.createEventLissener("testPF_id:" + _id, key);
            idLissener.observable.subscribe(function (_x) {
                if (_x.msg.from_rId != me._rId) {
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
    testPF.prototype.runQuery = function (_s, _update) {
        if (_update === void 0) { _update = { _id: null }; }
        var me = this;
        return momgo.db(me.db).then(function (_db) {
            var testing = _db.collection("testing");
            var p = q.when(true);
            if (_update._id && me.docs.indexOf(_update._id) == -1) {
                p = testing.findOne({ _id: new momgo.ObjectID(_update._id) }, { _id: 1 }).then(function (doc) {
                    return doc ? true : false;
                });
            }
            return p.then(function (shouldFire) {
                if (shouldFire) {
                    return testing.find(me.query).project({ _id: 1 }).toArray().then(function (_docs) {
                        _docs = _docs.map(function (_doc) {
                            return _doc._id.toString();
                        });
                        var resendDocs = false;
                        _docs.forEach(function (_id, i) {
                            if (_id != me.docs[i]) {
                                resendDocs = true;
                            }
                            if (me.docs.indexOf(_id) == -1) {
                                testing.findOne({ _id: new momgo.ObjectID(_id) }, me.projection).then(function (doc) {
                                    _s.next({ doc: doc });
                                });
                            }
                        });
                        if (resendDocs) {
                            _s.next({ _ids: _docs });
                            me.docs = _docs;
                        }
                    });
                }
            });
        });
    };
    return testPF;
}(rx_server_1.publicFunction));
s.addPublicFunction("testPF", testPF);
// let _s0:globalEvent = s.globalEventHandler.globalEventHandlerClient.createEvent('testOne',{test:1});
// let t0 =  setInterval(()=> _s0.next('fire one'),1000);
// setTimeout(()=>{
//     _s0.dispose();
//     clearInterval(t0);
// },120000);
var save = (function (_super) {
    __extends(save, _super);
    function save(user, data, globalEventHandler) {
        _super.call(this, user, data, globalEventHandler);
        this.dbName = "test";
        this.collectionName = "testing";
        console.log('save');
        console.log(data);
        var me = this;
        var key = {};
        key[me.dbName] = {};
        key[me.dbName][me.collectionName] = { update: data.save.$set, _id: {} };
        key[me.dbName][me.collectionName]._id[data._id] = 1;
        var _s0 = s.globalEventHandler.globalEventHandlerClient.createEvent('save', key);
        me.observable = rxjs_1.Observable.create(function (_s) {
            momgo.save(me.dbName, me.collectionName, data._id, data.save).then(function () {
                _s0.next(data);
                _s0.dispose();
                _s.next('complete');
                _s.complete();
            });
        });
    }
    return save;
}(rx_server_1.publicFunction));
s.addPublicFunction("save", save);
//# sourceMappingURL=example.js.map