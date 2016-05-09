System.register(['rxjs/rx'], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var rx_1;
    var Query;
    return {
        setters:[
            function (rx_1_1) {
                rx_1 = rx_1_1;
            }],
        execute: function() {
            Query = (function () {
                function Query(myServer, getFunctionName, saveFunctionName) {
                    this.myServer = myServer;
                    this.getFunctionName = getFunctionName;
                    this.saveFunctionName = saveFunctionName;
                    this.ids = [];
                    this.docs = {};
                    this.savedDocs = {};
                    this.internalStreemSubject = new rx_1.Subject();
                }
                Query.prototype.get = function (functionName, data) {
                    var _this = this;
                    if (functionName === void 0) { functionName = this.getFunctionName; }
                    if (data === void 0) { data = {}; }
                    var me = this;
                    var querySreeem = me.myServer.publicFunction(functionName || me.getFunctionName, data).map(function (data) {
                        if (data.rId) {
                            me.rId = data.rId;
                        }
                        if (data._ids) {
                            me.ids = data._ids;
                        }
                        if (data.doc) {
                            me.docs[data.doc._id] = data.doc;
                            me.savedDocs[data.doc._id] = data.doc;
                        }
                        if (data.update) {
                            for (var i in data.update.save.$set) {
                                //var pk = me.objAddrOfParent(me.docs[data.update._id], i);
                                //pk.parent[pk.childKey] = data.update.save.$set[i];
                                _this.set([data.update._id].concat(i.split('.')), data.update.save.$set[i]);
                            }
                            for (var i in data.update.save.$set) {
                                var pk = me.objAddrOfParent(me.savedDocs[data.update._id], i);
                                pk.parent[pk.childKey] = me.clone(data.update.save.$set[i]);
                            }
                            for (var i in data.update.save.$unset) {
                                // var pk = me.objAddrOfParent(me.docs[data.update._id], i);
                                // delete pk.parent[pk.childKey];
                                _this.set([data.update._id].concat(i.split('.')), undefined);
                            }
                            for (var i in data.update.save.$unset) {
                                var pk = me.objAddrOfParent(me.savedDocs[data.update._id], i);
                                delete pk.parent[pk.childKey];
                            }
                            for (var i in data.update.save.$pull) {
                                var pk = me.objAddrOfParent(me.docs[data.update._id], i);
                                if (pk.parent && pk.childKey && pk.parent[pk.childKey])
                                    for (var j = 0; j <= pk.parent[pk.childKey].length; j++) {
                                        if (pk.parent[pk.childKey][j] == null) {
                                            pk.parent[pk.childKey].splice(j, 1);
                                        }
                                    }
                            }
                            for (var i in data.update.save.$pull) {
                                var pk = me.objAddrOfParent(me.savedDocs[data.update._id], i);
                                if (pk.parent && pk.childKey && pk.parent[pk.childKey])
                                    for (var j = 0; j <= pk.parent[pk.childKey].length; j++) {
                                        if (pk.parent[pk.childKey][j] == null) {
                                            pk.parent[pk.childKey].splice(j, 1);
                                        }
                                    }
                            }
                        }
                    }).debounceTime(20);
                    return rx_1.Observable.merge(querySreeem, me.internalStreemSubject.asObservable()).debounceTime(10).map(function () {
                        return me.ids.map(function (_id) {
                            return me.docs[_id];
                        }).filter(function (doc) {
                            return doc ? true : false;
                        });
                    });
                };
                Query.prototype.save = function (_id) {
                    var me = this;
                    var doc = me.docs[_id];
                    var savedDoc = me.savedDocs[_id];
                    if (doc && savedDoc) {
                        return me.myServer.publicFunction(me.saveFunctionName, { _id: _id, save: me.objDeepMatch(doc, savedDoc).save, from_rId: me.rId }).subscribe(null, null, function () {
                            me.savedDocs[_id] = doc;
                        });
                    }
                };
                Query.prototype.objDeepMatch = function (odj1, odj2, location, returnObj) {
                    if (!returnObj)
                        returnObj = {
                            _id: odj1._id,
                            change: {},
                            save: {}
                        };
                    if (!location) {
                        location = [];
                    }
                    for (var i in odj1) {
                        if (!this.isFunction(odj1[i])) {
                            if (odj2 === undefined || odj2[i] === undefined) {
                                if (!returnObj.save.$set)
                                    returnObj.save.$set = {};
                                returnObj.save.$set[this.addrArrayToStr(this.addToAddrArray(location, i))] = odj1[i];
                            }
                            else if (this.isArray(odj1[i]) && !this.isArray(odj2[i])) {
                                if (!returnObj.save.$set)
                                    returnObj.save.$set = {};
                                returnObj.save.$set[this.addrArrayToStr(this.addToAddrArray(location, i))] = odj1[i];
                            }
                            else if (this.isArray(odj1[i]) && odj1[i] !== odj2[i]) {
                                this.objDeepMatch(odj1[i], odj2[i], this.addToAddrArray(location, i), returnObj);
                            }
                            else if (this.isDate(odj1[i])) {
                                if (!odj2[i] || odj1[i].toString() != odj2[i].toString()) {
                                    if (!returnObj.save.$set)
                                        returnObj.save.$set = {};
                                    returnObj.save.$set[this.addrArrayToStr(this.addToAddrArray(location, i))] = odj1[i];
                                }
                            }
                            else if (this.isObject(odj1[i]) && (!this.isObject(odj2[i]) || this.isArray(odj2[i]))) {
                                if (!returnObj.save.$set)
                                    returnObj.save.$set = {};
                                returnObj.save.$set[this.addrArrayToStr(this.addToAddrArray(location, i))] = odj1[i];
                            }
                            else if (this.isObject(odj1[i]) && odj1[i] !== odj2[i]) {
                                this.objDeepMatch(odj1[i], odj2[i], this.addToAddrArray(location, i), returnObj);
                            }
                            else {
                                if (odj1[i] !== odj2[i]) {
                                    if (!returnObj.save.$set)
                                        returnObj.save.$set = {};
                                    returnObj.save.$set[this.addrArrayToStr(this.addToAddrArray(location, i))] = odj1[i];
                                }
                            }
                        }
                    }
                    for (var i in odj2) {
                        if (!this.isFunction(odj2[i])) {
                            if (odj1 === undefined || odj1[i] === undefined) {
                                if (this.isArray(odj2)) {
                                    if (!returnObj.save.$set)
                                        returnObj.save.$set = {};
                                    returnObj.save.$set[this.addrArrayToStr(this.addToAddrArray(location, i))] = null;
                                    if (!returnObj.save.$pull)
                                        returnObj.save.$pull = {};
                                    returnObj.save.$pull[this.addrArrayToStr(location)] = null;
                                }
                                else {
                                    if (!returnObj.save.$unset)
                                        returnObj.save.$unset = {};
                                    returnObj.save.$unset[this.addrArrayToStr(this.addToAddrArray(location, i))] = "";
                                }
                            }
                        }
                    }
                    return returnObj;
                };
                Query.prototype.isFunction = function (functionToCheck) {
                    var getType = {};
                    return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
                };
                Query.prototype.isArray = function (val) {
                    return (Object.prototype.toString.call(val) === '[object Array]');
                };
                Query.prototype.isObject = function (val) {
                    return (typeof val === 'object');
                };
                Query.prototype.isDate = function (val) {
                    if (val != undefined && val != null && !this.isString(val))
                        return !!val.getUTCFullYear;
                    else
                        false;
                };
                Query.prototype.isString = function (val) {
                    return (typeof val == 'string' || val instanceof String);
                };
                Query.prototype.clone = function (obj) {
                    return JSON.parse(JSON.stringify(obj));
                };
                Query.prototype.addrArrayToStr = function (addr) {
                    var str = addr[0], i = 0;
                    if (addr.length > 1) {
                        do {
                            i++;
                            str += '.' + addr[i];
                        } while (addr.length - 1 > i);
                    }
                    return str;
                };
                Query.prototype.addToAddrArray = function (a, obj) {
                    var newArray = [];
                    if (a) {
                        a.forEach(function (i) {
                            newArray.push(i);
                        });
                    }
                    newArray.push(obj);
                    return newArray;
                };
                Query.prototype.objAddrOfParent = function (obj, addr) {
                    if (!Array.isArray(addr))
                        addr = addr.split(".");
                    if (addr.length == 1) {
                        return { parent: obj, childKey: addr[0] };
                    }
                    else if (addr.length == 2) {
                        if (obj[addr[0]] == undefined) {
                            if (parseInt(addr[1]).toString() == addr[1].toString())
                                obj[addr[0]] = [];
                            else
                                obj[addr[0]] = {};
                        }
                        if (obj[addr[0]].push && parseInt(addr[1]).toString() == addr[1].toString() && obj[addr[0]].length < parseInt(addr[1])) {
                            var newI = parseInt(addr[1]);
                            while (newI < obj[addr[0]].length) {
                                obj[addr[0]].push({});
                            }
                        }
                        return { parent: obj[addr[0]], childKey: addr[1] };
                    }
                    else {
                        var i = addr.shift();
                        return this.objAddrOfParent(obj[i], addr);
                    }
                };
                Query.prototype.set = function (_addr, value, obj) {
                    var addr;
                    if (!Array.isArray(_addr))
                        addr = _addr.split(".");
                    else
                        addr = this.newArray(_addr);
                    if (!obj)
                        obj = this.docs;
                    if (addr.length == 1) {
                        if (this.isArray(obj) && value === undefined)
                            obj.splice(addr[0], 1);
                        else if (value === undefined)
                            delete obj[addr[0]];
                        else {
                            obj[addr[0]] = value;
                        }
                        this.internalStreemSubject.next(true);
                    }
                    else if (addr.length > 1) {
                        if (obj[addr[0]] == undefined) {
                            if (parseInt(addr[1]).toString() == addr[1].toString())
                                obj[addr[0]] = [];
                            else
                                obj[addr[0]] = {};
                        }
                        if (obj[addr[0]].push && parseInt(addr[1]).toString() == addr[1].toString() && obj[addr[0]].length < parseInt(addr[1])) {
                            var newI = parseInt(addr[1]);
                            while (newI < obj[addr[0]].length) {
                                obj[addr[0]].push({});
                            }
                        }
                        if (this.isString(obj[addr[0]])) {
                            obj[addr[0]] = {};
                        }
                        if (this.isArray(obj[addr[0]])) {
                            obj[addr[0]] = this.newArray(obj[addr[0]]);
                        }
                        else if (this.isObject(obj[addr[0]]) && !this.isDate(obj[addr[0]])) {
                            obj[addr[0]] = this.newObject(obj[addr[0]]);
                        }
                        var i = addr.shift();
                        this.set(addr, value, obj[i]);
                    }
                };
                Query.prototype.newArray = function (oldArray) {
                    var newArray = new Array(oldArray.length);
                    oldArray.forEach(function (item, i) {
                        newArray[i] = item;
                    });
                    return newArray;
                };
                Query.prototype.newObject = function (oldObj) {
                    var newObj = {};
                    ;
                    for (var i in oldObj) {
                        newObj[i] = oldObj[i];
                    }
                    return newObj;
                };
                return Query;
            }());
            exports_1("Query", Query);
        }
    }
});
//# sourceMappingURL=momgo.js.map