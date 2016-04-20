System.register(['angular2/platform/browser', 'angular2/core', 'rx-server/clientScripts/rxServer'], function(exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var __extends = (this && this.__extends) || function (d, b) {
        for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
    var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
        var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
        if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
        else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
        return c > 3 && r && Object.defineProperty(target, key, r), r;
    };
    var __metadata = (this && this.__metadata) || function (k, v) {
        if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
    };
    var __param = (this && this.__param) || function (paramIndex, decorator) {
        return function (target, key) { decorator(target, key, paramIndex); }
    };
    var browser_1, core_1, rxServer_1;
    var myServer, testing, AppComponent;
    return {
        setters:[
            function (browser_1_1) {
                browser_1 = browser_1_1;
            },
            function (core_1_1) {
                core_1 = core_1_1;
            },
            function (rxServer_1_1) {
                rxServer_1 = rxServer_1_1;
            }],
        execute: function() {
            myServer = (function (_super) {
                __extends(myServer, _super);
                function myServer() {
                    _super.call(this, 'http://localhost:3000');
                }
                myServer = __decorate([
                    core_1.Injectable(), 
                    __metadata('design:paramtypes', [])
                ], myServer);
                return myServer;
            }(rxServer_1.serverRx));
            testing = (function () {
                function testing(myServer) {
                    this.ids = [];
                    this.docs = {};
                    this.savedDocs = {};
                    this.myServer = myServer;
                }
                testing.prototype.get = function () {
                    var me = this;
                    return me.myServer.publicFunction('testPF').map(function (data) {
                        if (data.rId) {
                            me.rId = data.rId;
                        }
                        if (data._ids) {
                            me.ids = data._ids;
                        }
                        if (data.doc) {
                            me.docs[data.doc._id] = data.doc;
                            me.savedDocs[data.doc._id] = me.clone(data.doc);
                        }
                        if (data.update) {
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
                        return me.ids.map(function (_id) {
                            return me.docs[_id];
                        }).filter(function (doc) {
                            return doc ? true : false;
                        });
                    });
                };
                testing.prototype.save = function (_id) {
                    var me = this;
                    var doc = me.docs[_id];
                    var savedDoc = me.savedDocs[_id];
                    if (doc && savedDoc) {
                        var clonedDoc_1 = me.clone(doc);
                        return me.myServer.publicFunction('save', { _id: _id, save: me.objDeepMatch(doc, savedDoc).save, from_rId: me.rId }).subscribe(null, null, function () {
                            me.savedDocs[_id] = clonedDoc_1;
                        });
                    }
                };
                testing.prototype.objDeepMatch = function (odj1, odj2, location, returnObj) {
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
                            else if (this.isArray(odj1[i])) {
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
                            else if (this.isObject(odj1[i])) {
                                this.objDeepMatch(odj1[i], odj2[i], this.addToAddrArray(location, i), returnObj);
                            }
                            else {
                                if (odj1[i] != odj2[i]) {
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
                                if (!returnObj.save.$unset)
                                    returnObj.save.$unset = {};
                                returnObj.save.$unset[this.addrArrayToStr(this.addToAddrArray(location, i))] = "";
                                if (this.isArray(odj2)) {
                                    if (!returnObj.save.$pull)
                                        returnObj.save.$pull = {};
                                    returnObj.save.$pull[this.addrArrayToStr(location)] = null;
                                }
                            }
                        }
                    }
                    return returnObj;
                };
                testing.prototype.isFunction = function (functionToCheck) {
                    var getType = {};
                    return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
                };
                testing.prototype.isArray = function (val) {
                    return (Object.prototype.toString.call(val) === '[object Array]');
                };
                testing.prototype.isObject = function (val) {
                    return (typeof val === 'object');
                };
                testing.prototype.isDate = function (val) {
                    if (val != undefined && val != null && !this.isString(val))
                        return !!val.getUTCFullYear;
                    else
                        false;
                };
                testing.prototype.isString = function (val) {
                    return (typeof val == 'string' || val instanceof String);
                };
                testing.prototype.clone = function (obj) {
                    return JSON.parse(JSON.stringify(obj));
                };
                testing.prototype.addrArrayToStr = function (addr) {
                    var str = addr[0], i = 0;
                    if (addr.length > 1) {
                        do {
                            i++;
                            str += '.' + addr[i];
                        } while (addr.length - 1 > i);
                    }
                    return str;
                };
                testing.prototype.addToAddrArray = function (a, obj) {
                    var newArray = [];
                    if (a) {
                        a.forEach(function (i) {
                            newArray.push(i);
                        });
                    }
                    newArray.push(obj);
                    return newArray;
                };
                testing.prototype.objAddrOfParent = function (obj, addr) {
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
                testing = __decorate([
                    core_1.Injectable(),
                    __param(0, core_1.Inject(myServer)), 
                    __metadata('design:paramtypes', [myServer])
                ], testing);
                return testing;
            }());
            AppComponent = (function () {
                function AppComponent(testing) {
                    this.testing = testing;
                    this.test = [];
                    var vm = this;
                    testing.get().subscribe(function (_x) {
                        vm.test = _x;
                        vm.test.forEach(function (doc) {
                            doc.other = { a: 1, b: 2, c: 3 };
                        });
                    });
                }
                AppComponent.prototype.save = function (_id) {
                    this.testing.save(_id);
                };
                AppComponent = __decorate([
                    core_1.Component({
                        selector: 'my-app',
                        template: "<h1>My First Angular 2 App</h1><div>{{test|json}}</div>\n    <div *ngFor=\"#item of test\">\n        <input [value]=\"item.test\" (input)=\"item.test = $event.target.value; save(item._id)\" />\n        <input [value]=\"item.other.a\" (input)=\"item.other.a = $event.target.value; \" />\n        <input [value]=\"item.other.b\" (input)=\"item.other.b = $event.target.value; \" />\n        <input [value]=\"item.other.c\" (input)=\"item.other.c = $event.target.value; \" />\n    </div>",
                        providers: [testing]
                    }), 
                    __metadata('design:paramtypes', [testing])
                ], AppComponent);
                return AppComponent;
            }());
            exports_1("AppComponent", AppComponent);
            browser_1.bootstrap(AppComponent, [myServer]);
        }
    }
});
//# sourceMappingURL=main.js.map