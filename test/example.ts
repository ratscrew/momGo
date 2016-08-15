import {server, publicFunction,globalEventHandler,globalEvent,globalEventLissener} from 'rx-server';
import {Observable,Subject} from 'rxjs';
import {MomGo,Query,Save} from '../index';
import * as q from 'q';

var express = require('express');
var app = express();
var path = require('path');

let _s = require('http').Server(app)

let s = new server(_s);

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

app.use('/rxjs',express.static(path.resolve(__dirname + '\\..\\node_modules\\rxjs')));

app.get('/angular2.dev.js', function (req, res) {
  res.sendFile(path.resolve(__dirname + '\\..\\node_modules\\angular2\\bundles\\angular2.dev.js'));
});

// app.get('/rx-server/clientScripts/rxServer.js', function (req, res) {
//     res.sendFile(path.resolve(__dirname + '\\..\\node_modules\\rx-server\\clientScripts\\rxServer.js'));
// });
app.use('/rx-server/clientScripts/',express.static(path.resolve(__dirname + '\\..\\node_modules\\rx-server\\clientScripts')));

// app.get('/clientScripts/momgo.js', function (req, res) {
//     res.sendFile(path.resolve(__dirname + '\\..\\clientScripts\\momgo.js'));
// });
app.use('/clientScripts/',express.static(path.resolve(__dirname + '\\..\\clientScripts')));

app.use(express.static(__dirname + '\\public'));

_s.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});

let momgo = new MomGo("mongodb://test:1234@10.250.100.250:27017,10.252.100.48:27017?PreferredMember=nearest","test");


class testPF extends Query {
    constructor(user:Object, data:any,globalEventHandler:globalEventHandler){
        super(user, data,globalEventHandler,'testPF',momgo);
        this.dbName = "test";
        this.collectionName = "testing";
        this.projection = {test:1,other:1,subs:1};
        this.query = {group:1};
        this.whereKey.test.testing.update = {group:1};
    }
}

s.addPublicFunction("testPF",testPF);



// let _s0:globalEvent = s.globalEventHandler.globalEventHandlerClient.createEvent('testOne',{test:1});

// let t0 =  setInterval(()=> _s0.next('fire one'),1000);

// setTimeout(()=>{
//     _s0.dispose();
//     clearInterval(t0);
// },120000);



class save extends Save {
    constructor(user:Object, data:any,globalEventHandler:globalEventHandler){
        super(user, data,globalEventHandler,momgo);
        this.dbName = "test";
        this.collectionName = "testing";
    }
}

s.addPublicFunction("save",save)


