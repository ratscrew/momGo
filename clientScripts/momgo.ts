import {Observable, Subject} from 'rxjs/rx';

import {serverRx} from 'rx-server/clientScripts/rxServer';

export class Query {
    ids=[];
    docs:{[id:string]:any} = {};
    savedDocs:{[id:string]:any} = {};
    private rId;
    constructor(public myServer: serverRx, public getFunctionName:string, public saveFunctionName:string) {

    }
    
    get(){
        let me = this;
        return me.myServer.publicFunction(me.getFunctionName).map((data)=>{
            if(data.rId){
                me.rId = data.rId;
            }
            if(data._ids){
               me.ids = data._ids;
            }
            if(data.doc){
                me.docs[data.doc._id] = data.doc;
                me.savedDocs[data.doc._id] = me.clone(data.doc);
            }
            if(data.update){
                for (var i in data.update.save.$set) {
                    var pk = me.objAddrOfParent(me.docs[data.update._id], i);
                    pk.parent[pk.childKey] = data.update.save.$set[i];
                }
                for (var i in data.update.save.$set) {
                    var pk = me.objAddrOfParent(me.savedDocs[data.update._id], i);
                    pk.parent[pk.childKey] = me.clone(data.update.save.$set[i]);
                }


                for (var i in data.update.save.$unset) {
                    var pk = me.objAddrOfParent(me.docs[data.update._id], i);
                    delete pk.parent[pk.childKey];
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

        }).sampleTime(33).map(()=>{
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
            let clonedDoc = me.clone(doc);
            return me.myServer.publicFunction(me.saveFunctionName,{_id:_id,save:me.objDeepMatch(doc,savedDoc).save,from_rId:me.rId}).subscribe(null,null,()=>{
                me.savedDocs[_id] = clonedDoc;
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
                else if (this.isArray(odj1[i])) {
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
                else if (this.isObject(odj1[i])) {
                    this.objDeepMatch(odj1[i],odj2[i], this.addToAddrArray(location, i), returnObj)
                }
                else {
                    if (odj1[i] != odj2[i]) {
                        if (!returnObj.save.$set) returnObj.save.$set = {};
                        returnObj.save.$set[this.addrArrayToStr(this.addToAddrArray(location, i))] = odj1[i];
                    }
                }
            }
        }
        for (var i in odj2) {
            if (!this.isFunction(odj2[i])) {
                if (odj1 === undefined || odj1[i] === undefined) {
                    if (!returnObj.save.$unset) returnObj.save.$unset = {};
                    returnObj.save.$unset[this.addrArrayToStr(this.addToAddrArray(location, i))] = "";
                    if(this.isArray(odj2)){
                        if (!returnObj.save.$pull) returnObj.save.$pull = {};
                        returnObj.save.$pull[this.addrArrayToStr(location)] = null;
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
            return this.objAddrOfParent(obj[i], addr);
        }
    }
}