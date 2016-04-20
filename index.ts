import {server, publicFunction,globalEventHandler,globalEvent} from 'rx-server';
import * as mongoDriver from 'mongodb';
import * as q from 'q';

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




