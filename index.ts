import {server, publicFunction,globalEventHandler,globalEvent,globalEventLissener} from 'rx-server';
import * as mongoDriver from 'mongodb';
import * as q from 'q';
import {Observable,Subject} from 'rxjs';

export class MomGo {
    MongoClient = mongoDriver.MongoClient;
    ObjectID = mongoDriver.ObjectID;
    private dbs = {};
    
    constructor(public serverName, public dbName) {
        this.db()
    }
    
    mongoConnection(connectionStr:string){
        let me = this;
        if(me.dbs[connectionStr]){
            return q.when(me.dbs[connectionStr])
        }
        else{
            var deferred = q.defer();
            me.dbs[connectionStr] = deferred.promise;
            console.log({connectionStr:connectionStr});
            me.MongoClient.connect(connectionStr, (err, _db)=> {
                if(err) {
                    console.log({connectionError:err, connectionStr:connectionStr});
                    //throw new Error(err);
                    return deferred.reject(err);
                    //log(err);
                }

                _db.on('disconnect', function (err) {
                    console.log({disconnect:err});
                    if(me.dbs[connectionStr]) delete me.dbs[connectionStr];
                    throw new Error(err);
                });

                me.dbs[connectionStr] = _db;

                deferred.resolve(_db);
            });
            return me.dbs[connectionStr];
        }
    }
    
    
    db(_dbName?):Q.IPromise<mongoDriver.Db>{
        let me = this;
        if(!_dbName || _dbName == "default") _dbName = me.dbName;
        let connectionStr:string = "";
        if(me.serverName.indexOf('mongodb://') == -1) connectionStr = 'mongodb://' + me.serverName + ':27017/' + _dbName;
        else {
            connectionStr = me.serverName.replace("27017?",'27017/' + _dbName + "?") ;
        }
        return me.mongoConnection(connectionStr).catch(function (err) {
            console.log({connectionStr:connectionStr,err:err});
            console.log('trying again');
            return me.mongoConnection(connectionStr)
        })
    }
    
    save(dbName,collectionName,_id,save){
        let me = this;
        if(save.$set && Object.keys(save.$set).length > 0) me.scanObj(save.$set);
        
        for (var key in save) {

            console.log(save[key]);
    
        }
        
        return me.db(dbName).then((_db)=>{
            let collection = _db.collection(collectionName);
            let update:any = {};
            if(save.$set) update.$set = save.$set;
            if(save.$unset) update.$unset = save.$unset;
            return collection.updateOne({_id:new me.ObjectID(_id)},update).then(()=>{
                let $pull =[];
                if(save.$pull && Object.keys(save.$pull).length > 0)  {
                    for (var i in save.$pull){
                        var p = {};
                        p[i] = null;
                        $pull.push(p);
                    }
                }
                
                let qList = [];
                $pull.forEach(function (p) {
                    qList.push(collection.updateOne({_id: new me.ObjectID(_id)}, {$pull:p}));
                });
                
                return q.all(qList).then(()=>{
                    console.log('saved');
                });
            })
        })
    }
    
    
    scanObj(obj){
        for(var i in obj){
            if((this.isArray(obj[i]) || this.isObject(obj[i])) && !this.isDate(obj[i])) this.scanObj(obj[i]);
            else if(this.isString(obj[i])) this.checkDate(obj, i);
        }
    }
    
    isArray(val) {
        return (Object.prototype.toString.call(val) === '[object Array]');
    }
    
    isObject(val) {
        return (typeof val === 'object');
    }
    
    isDate(val){
        if(val != undefined && val != null && !this.isString(val)) return !!val.getUTCFullYear;
        else false;
    }
    
    isString(val){
        return (typeof val == 'string' || val instanceof String);
    }
    
    checkDate (obj, key){
        if(obj[key].match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/i)) obj[key] = new Date(obj[key]);
    }
}


export class Query extends publicFunction {
    db;
    docs = [];
    docLisseners:globalEventLissener[] = [];
    query = {};
    projection = {};
    dbName:string = "test";
    collectionName:string = "testing";
    whereKey:any = {};
    
    constructor(user:Object, data:any,globalEventHandler:globalEventHandler,public functionName:string,public momgo:MomGo){
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
        return me.momgo.db(me.db).then((_db)=>{
                let collection:mongoDriver.Collection = _db.collection(me.collectionName);
                let p = q.when(true);
                if(_update._id && me.docs.indexOf(_update._id)==-1){
                    p = collection.findOne({_id:new me.momgo.ObjectID(_update._id)},{_id:1}).then((doc)=>{
                        return doc?true:false;
                    })
                }
                return p.then((shouldFire)=>{
                    if(shouldFire){
                        return collection.find(me.query).project({_id:1}).toArray().then((_docs:Array<any>)=>{
                            _docs = _docs.map((_doc)=>{
                                return _doc._id.toString();
                            })
                            let resendDocs = false;
                            _docs.forEach((_id,i)=>{
                                if(_id != me.docs[i]){
                                    resendDocs = true;
                                }
                                if(me.docs.indexOf(_id) == -1){
                                    collection.findOne({_id:new me.momgo.ObjectID(_id)},me.projection).then((doc)=>{
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


export class Save extends publicFunction {
    dbName:string = "test";
    collectionName:string = "testing";
    constructor(user:Object, data:any,globalEventHandler:globalEventHandler, public momgo:MomGo) {
        super(user, data,globalEventHandler);
        
        let me = this;
        let key = {};
        key[me.dbName] ={};
        key[me.dbName][me.collectionName] = {update:data.save.$set,_id:{}};
        key[me.dbName][me.collectionName]._id[data._id] = 1;
        
        let _s0:globalEvent = globalEventHandler.globalEventHandlerClient.createEvent('save', key);
        me.observable = Observable.create((_s:Subject<any>)=>{
            me.momgo.save(me.dbName,me.collectionName,data._id,data.save).then(()=>{
                _s0.next(data);
                _s0.dispose();
                _s.next('complete');
                _s.complete();
            })
        })
    }
}
