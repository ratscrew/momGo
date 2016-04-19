import {server, publicFunction,globalEventHandler,globalEvent} from 'rx-server';
import {Observable,Subject} from 'rxjs';
import {} from '../index_';

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

app.get('/rx-server/clientScripts/rxServer.js', function (req, res) {
    res.sendFile(path.resolve(__dirname + '\\..\\node_modules\\rx-server\\clientScripts\\rxServer.js'));
});

app.use(express.static(__dirname + '\\public'));

_s.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});



class testPF extends publicFunction {
    constructor(user:Object, data:any,globalEventHandler:globalEventHandler){
        console.log('testPF');
        super(user, data,globalEventHandler);
        this.observable = Observable.create((_s:Subject<any>)=>{
            console.log('testPF.observable');
            let t = setInterval(()=>{
                console.log('testPF.observable.next');
                _s.next('testing')
            },1000)
            

            
            let gc =  globalEventHandler.globalEventHandlerClient.createEventLissener("testPF",{})
            gc.observable.subscribe((x)=>{
                console.log('testPF.gc.next');
                _s.next(x);
                
            },()=>{},
            ()=>{
                _s.complete();
            })
            
            
            setTimeout(()=>{
                gc.dispose();
            },20000);
            
           return ()=>{
               clearInterval(t);
           }
        })

    }
}

s.addPublicFunction("testPF",testPF)


let _s0:globalEvent = s.globalEventHandler.globalEventHandlerClient.createEvent('testOne',{test:1});

let t0 =  setInterval(()=> _s0.next('fire one'),1000);

setTimeout(()=>{
    _s0.dispose();
    clearInterval(t0);
},120000);

