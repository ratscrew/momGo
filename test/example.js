"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var rx_server_1 = require('rx-server');
var rxjs_1 = require('rxjs');
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
var testPF = (function (_super) {
    __extends(testPF, _super);
    function testPF(user, data, globalEventHandler) {
        console.log('testPF');
        _super.call(this, user, data, globalEventHandler);
        this.observable = rxjs_1.Observable.create(function (_s) {
            console.log('testPF.observable');
            var t = setInterval(function () {
                console.log('testPF.observable.next');
                _s.next('testing');
            }, 1000);
            var gc = globalEventHandler.globalEventHandlerClient.createEventLissener("testPF", {});
            gc.observable.subscribe(function (x) {
                console.log('testPF.gc.next');
                _s.next(x);
            }, function () { }, function () {
                _s.complete();
            });
            setTimeout(function () {
                gc.dispose();
            }, 20000);
            return function () {
                clearInterval(t);
            };
        });
    }
    return testPF;
}(rx_server_1.publicFunction));
s.addPublicFunction("testPF", testPF);
var _s0 = s.globalEventHandler.globalEventHandlerClient.createEvent('testOne', { test: 1 });
var t0 = setInterval(function () { return _s0.next('fire one'); }, 1000);
setTimeout(function () {
    _s0.dispose();
    clearInterval(t0);
}, 120000);
//# sourceMappingURL=example.js.map