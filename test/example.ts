import {server, publicFunction,globalEventHandler,globalEvent,globalEventLissener} from 'rx-server';
import {Observable,Subject} from 'rxjs';
import {MomGo} from '../index';
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

app.get('/rx-server/clientScripts/rxServer.js', function (req, res) {
    res.sendFile(path.resolve(__dirname + '\\..\\node_modules\\rx-server\\clientScripts\\rxServer.js'));
});

app.use(express.static(__dirname + '\\public'));

_s.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});

let momgo = new MomGo("mongodb://test:1234@10.250.100.250:27017,10.252.100.48:27017?PreferredMember=nearest","test");

class Query extends publicFunction {
    db;
    docs = [];
    docLisseners:globalEventLissener[] = [];
    query = {};
    projection = {};
    dbName:string = "test";
    collectionName:string = "testing";
    whereKey:any = {};
    
    constructor(user:Object, data:any,globalEventHandler:globalEventHandler,public functionName:string){
        super(user, data,globalEventHandler);
        let me = this;
        me.whereKey = {};
        me.whereKey[me.dbName] = {};
        me.whereKey[me.dbName][me.collectionName] = {update:1};
        
        me.observable = Observable.create((_s:Subject<any>)=>{
            _s.next({rId:me._rId});
            me.runQuery(_s).then(()=>{
                me.buildUpdateLisseners(_s,globalEventHandler);
            }) ;

            let gc =  globalEventHandler.globalEventHandlerClient.createEventLissener(me.functionName,me.whereKey)
             gc.observable.subscribe((x)=>{
                me.runQuery(_s,x.msg).then(()=>{
                    me.buildUpdateLisseners(_s,globalEventHandler);
                })  
             })

           return ()=>{
               gc.dispose();
               me.docLisseners.forEach((idLissener)=>{
                   idLissener.dispose();
               })
           }
        })

    }

    buildUpdateLisseners(_s:Subject<any>,globalEventHandler:globalEventHandler){
        let me = this;
        let newDocLisseners:globalEventLissener[] =[];
        me.docs.forEach((_id)=>{
            let key ={};
            key[me.dbName] ={};
            key[me.dbName][me.collectionName] = {_id:{}};
            key[me.dbName][me.collectionName]._id[_id] = 1;
            let idLissener = globalEventHandler.globalEventHandlerClient.createEventLissener(me.functionName + "_id:" + _id,key);
            idLissener.observable.subscribe((_x)=>{
                if(_x.msg.from_rId != me._rId){
                    if(me.projection && Object.keys(me.projection).length > 1){
                        for(var i in _x.msg.save.$set){
                            let val = i.split(".")[0];
                            if(!me.projection[val]){
                                delete _x.msg.save.$set[i]
                            }
                        }
                        
                    }
                    _s.next({update:_x.msg});
                }
            })
            newDocLisseners.push(idLissener); 
        });
        
        me.docLisseners.forEach((_idLissener)=>{
            _idLissener.dispose()
        })
        me.docLisseners = newDocLisseners;
    }
    
    runQuery(_s:Subject<any>,_update = {_id:null}){
        let me = this;
        return momgo.db(me.db).then((_db)=>{
                let testing  = _db.collection(me.collectionName);
                let p = q.when(true);
                if(_update._id && me.docs.indexOf(_update._id)==-1){
                    p = testing.findOne({_id:new momgo.ObjectID(_update._id)},{_id:1}).then((doc)=>{
                        return doc?true:false;
                    })
                }
                return p.then((shouldFire)=>{
                    if(shouldFire){
                        return testing.find(me.query).project({_id:1}).toArray().then((_docs:Array<any>)=>{
                            _docs = _docs.map((_doc)=>{
                                return _doc._id.toString();
                            })
                            let resendDocs = false;
                            _docs.forEach((_id,i)=>{
                                if(_id != me.docs[i]){
                                    resendDocs = true;
                                }
                                if(me.docs.indexOf(_id) == -1){
                                    testing.findOne({_id:new momgo.ObjectID(_id)},me.projection).then((doc)=>{
                                        _s.next({doc:doc});
                                    })
                                }
                            })
                            if (resendDocs) {
                                _s.next({_ids:_docs});
                                me.docs = _docs;
                            }
                        })
                    }
                })
                
            })
    }
}

class testPF extends Query {
    constructor(user:Object, data:any,globalEventHandler:globalEventHandler){
        super(user, data,globalEventHandler,'testPF');
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


class save extends publicFunction {
    dbName:string = "test";
    collectionName:string = "testing";
    constructor(user:Object, data:any,globalEventHandler:globalEventHandler) {
        super(user, data,globalEventHandler);
        
        let me = this;
        let key = {};
        key[me.dbName] ={};
        key[me.dbName][me.collectionName] = {update:data.save.$set,_id:{}};
        key[me.dbName][me.collectionName]._id[data._id] = 1;
        
        let _s0:globalEvent = s.globalEventHandler.globalEventHandlerClient.createEvent('save', key);
        me.observable = Observable.create((_s:Subject<any>)=>{
            momgo.save(me.dbName,me.collectionName,data._id,data.save).then(()=>{
                _s0.next(data);
                _s0.dispose();
                _s.next('complete');
                _s.complete();
            })
        })
    }
}

s.addPublicFunction("save",save)


