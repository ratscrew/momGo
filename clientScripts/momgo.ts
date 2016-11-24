import {Observable, Subject} from 'rxjs/Rx';

import {serverRx} from 'rx-server/clientScripts/rxServer';

export class Query {
    ids=[];
    docs:{[id:string]:any} = {};
    savedDocs:{[id:string]:any} = {};
    private rId;
    private internalStreemSubject:Subject<any> = new Subject();
    
    constructor(public myServer: serverRx, public getFunctionName:string, public saveFunctionName:string) {
        let me = this;
        setInterval(()=>{
            Object.keys(me.docs).forEach(_key =>{
                if(me.ids.indexOf(_key) == -1) delete me.docs[_key];
            })
        },60000 * ((10 * Math.random()) + 15));
    }
    
    get(functionName = this.getFunctionName,data = {}){
        let me = this;
        
        let querySreeem =  me.myServer.publicFunction(functionName ||me.getFunctionName,data).map((data)=>{
            if(data.rId){
                me.rId = data.rId;
            }
            if(data._ids){
               me.ids = data._ids;
            }
            if(data.doc){
                me.docs[data.doc._id] = data.doc;
                me.savedDocs[data.doc._id] = data.doc;
            }
            if(data.update){
                for (var i in data.update.save.$set) {
                    //var pk = me.objAddrOfParent(me.docs[data.update._id], i);
                    //pk.parent[pk.childKey] = data.update.save.$set[i];
                    this.set([data.update._id].concat(i.split('.')),data.update.save.$set[i]);
                }
                for (var i in data.update.save.$set) {
                    var pk = me.objAddrOfParent(me.savedDocs[data.update._id], i);
                    if(pk && pk.parent && pk.parent[pk.childKey]) pk.parent[pk.childKey] = me.clone(data.update.save.$set[i]);
                }


                for (var i in data.update.save.$unset) {
                    // var pk = me.objAddrOfParent(me.docs[data.update._id], i);
                    // delete pk.parent[pk.childKey];
                    this.set([data.update._id].concat(i.split('.')),undefined);
                }
                for (var i in data.update.save.$unset) {
                    var pk = me.objAddrOfParent(me.savedDocs[data.update._id], i);
                    delete pk.parent[pk.childKey];
                }


                for (var i in data.update.save.$pull) {
                    var pk = me.objAddrOfParent(me.docs[data.update._id], i);
                    if(pk.parent && pk.childKey && pk.parent[pk.childKey])
                        for(var j = 0; j <= pk.parent[pk.childKey].length; j++){
                            if(pk.parent[pk.childKey][j] == null){
                                pk.parent[pk.childKey].splice(j,1);
                            }
                        }
                }
                for (var i in data.update.save.$pull) {
                    var pk = me.objAddrOfParent(me.savedDocs[data.update._id], i);
                    if(pk.parent && pk.childKey && pk.parent[pk.childKey])
                        for(var j = 0; j <= pk.parent[pk.childKey].length; j++){
                            if(pk.parent[pk.childKey][j] == null){
                                pk.parent[pk.childKey].splice(j,1);
                            }
                        }
                }
            }
            return data;
        }).debounceTime(50)
        
        return Observable.merge(querySreeem,me.internalStreemSubject.asObservable()).debounceTime(10).map(()=>{
            return me.ids.map((_id)=>{
                return me.docs[_id];
            }).filter((doc)=>{
                return doc?true:false;
            })
        })
    }
    
    save(_id){
        let me = this;
        let doc = me.docs[_id];
        let savedDoc = me.savedDocs[_id];
        
        if(doc && savedDoc){

            return me.myServer.publicFunction(me.saveFunctionName,{_id:_id,save:me.objDeepMatch(doc,savedDoc).save,from_rId:me.rId}).subscribe(null,null,()=>{
                me.savedDocs[_id] = doc;
            })
        }
    }
    
    objDeepMatch(odj1, odj2, location?, returnObj?) {
        if (!returnObj) returnObj = {
            _id: odj1._id,
            change: {},
            save: {}
        };
        if (!location) { location = []}
        for (var i in odj1) {
            if (!this.isFunction(odj1[i])) {
                if (odj2 === undefined || odj2[i] === undefined) {
                    if (!returnObj.save.$set) returnObj.save.$set = {};
                    returnObj.save.$set[this.addrArrayToStr(this.addToAddrArray(location, i))] = odj1[i];
                }
                else if (this.isArray(odj1[i]) && !this.isArray(odj2[i])) {
                    if (!returnObj.save.$set) returnObj.save.$set = {};
                    returnObj.save.$set[this.addrArrayToStr(this.addToAddrArray(location, i))] = odj1[i];
                }
                else if (this.isArray(odj1[i]) && odj1[i] !== odj2[i]) {
                    this.objDeepMatch(odj1[i], odj2[i], this.addToAddrArray(location, i), returnObj);
                }
                else if (this.isDate(odj1[i])) {
                    if (!odj2[i] || odj1[i].toString() != odj2[i].toString()) {
                        if (!returnObj.save.$set) returnObj.save.$set = {};
                        returnObj.save.$set[this.addrArrayToStr(this.addToAddrArray(location, i))] = odj1[i];
                    }
                }
                else if (this.isObject(odj1[i]) && (!this.isObject(odj2[i]) || this.isArray(odj2[i]))) {
                    if (!returnObj.save.$set) returnObj.save.$set = {};
                    returnObj.save.$set[this.addrArrayToStr(this.addToAddrArray(location, i))] = odj1[i];
                }
                else if (this.isObject(odj1[i]) && odj1[i] !== odj2[i]) {
                    this.objDeepMatch(odj1[i],odj2[i], this.addToAddrArray(location, i), returnObj)
                }
                else {
                    if (odj1[i] !== odj2[i]) {
                        if (!returnObj.save.$set) returnObj.save.$set = {};
                        returnObj.save.$set[this.addrArrayToStr(this.addToAddrArray(location, i))] = odj1[i];
                    }
                }
            }
        }
        for (var i in odj2) {
            if (!this.isFunction(odj2[i])) {
                if (odj1 === undefined || odj1[i] === undefined) {
                    if(this.isArray(odj2)){
                        if (!returnObj.save.$set) returnObj.save.$set = {};
                        returnObj.save.$set[this.addrArrayToStr(this.addToAddrArray(location, i))] = null;
                        if (!returnObj.save.$pull) returnObj.save.$pull = {};
                        returnObj.save.$pull[this.addrArrayToStr(location)] = null;
                    }
                    else{
                        if (!returnObj.save.$unset) returnObj.save.$unset = {};
                        returnObj.save.$unset[this.addrArrayToStr(this.addToAddrArray(location, i))] = "";
                    }
                }
            }
        }
        return returnObj;
    }
        
    isFunction(functionToCheck) {
        let getType = {};
        return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
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
    
    clone(obj){
        return JSON.parse(JSON.stringify(obj));
    }
    
    
    addrArrayToStr(addr) {
        let str = addr[0], i = 0;

        if (addr.length > 1) {
            do{
                i++;
                str += '.' + addr[i];
            }  while (addr.length -1 > i)
        }
        return str;
    }
    
    addToAddrArray(a,obj) {
        let newArray = [];
        if (a) {
            a.forEach(function (i) {
                newArray.push(i);
            })
        }
        newArray.push(obj);
        return newArray;
    }
    
    objAddrOfParent(obj, addr) {
        if (!Array.isArray(addr)) addr = addr.split(".");
        if (addr.length == 1) {
            return { parent: obj, childKey: addr[0] };
        }
        else if (addr.length == 2) {
            if(obj[addr[0]] == undefined){
                if(parseInt(addr[1]).toString() ==  addr[1].toString()) obj[addr[0]] = [];
                else obj[addr[0]] = {};
            }
            if(obj[addr[0]].push && parseInt(addr[1]).toString() ==  addr[1].toString() && obj[addr[0]].length <  parseInt(addr[1])){
                var newI = parseInt(addr[1]);
                while (newI < obj[addr[0]].length) {
                    obj[addr[0]].push({})
                }
            }
            return { parent: obj[addr[0]], childKey: addr[1] };
        }
        else {
            var i = addr.shift();
            if(obj[i] == null) obj[i] = {};
            return this.objAddrOfParent(obj[i], addr);
        }
    }
    
    set(_addr,value,obj?) {
        let addr:string[];
        if (!Array.isArray(_addr)) addr = _addr.split(".");
        else addr = this.newArray(_addr);
        
        if (!obj) obj = this.docs;
        
        if (addr.length == 1) {
            if(this.isArray(obj) && value === undefined) obj.splice(addr[0],1)
            else if(value === undefined) delete obj[addr[0]];
            else {
                obj[addr[0]] = value;
            }  
            this.internalStreemSubject.next(true);
        }
        else if (addr.length > 1) {
            if(obj[addr[0]] == undefined){
                if(parseInt(addr[1]).toString() ==  addr[1].toString()) obj[addr[0]] = [];
                else obj[addr[0]] = {};
            }
            if(obj[addr[0]].push && parseInt(addr[1]).toString() ==  addr[1].toString() && obj[addr[0]].length <  parseInt(addr[1])){
                var newI = parseInt(addr[1]);
                while (newI < obj[addr[0]].length) {
                    obj[addr[0]].push({})
                }
            }
            if(this.isString(obj[addr[0]])){
                obj[addr[0]] = {};
            }
            
            if(this.isArray(obj[addr[0]])){
                obj[addr[0]] = this.newArray(obj[addr[0]]);
            }
            else if(this.isObject(obj[addr[0]]) && !this.isDate(obj[addr[0]])){
                obj[addr[0]] = this.newObject(obj[addr[0]]);
            }
            
             var i = addr.shift();
             this.set(addr,value,obj[i])
        }
    }
    
    newArray(oldArray:Array<any>):Array<any>{
        let newArray:Array<any> = new Array(oldArray.length);
        
        oldArray.forEach((item,i)=>{
            newArray[i] = item;
        })
        
        return newArray;
    }
    
    newObject(oldObj:Object):Object{
        let newObj:Object= {};;
        
        for(var i in oldObj){
            newObj[i] = oldObj[i];
        }
        
        return newObj;
    }
    
}