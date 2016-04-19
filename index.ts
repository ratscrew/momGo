import {server, publicFunction,globalEventHandler,globalEvent} from 'rx-server';
import * as mongoDriver from 'mongodb';
import * as q from 'q';

export class MomGo {
    MongoClient = mongoDriver.MongoClient;
    OnjectID = mongoDriver.ObjectID;
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
    
}




