System.register(['angular2/platform/browser', 'angular2/core', 'rxjs/rx', 'rx-server/clientScripts/rxServer', '../../../clientScripts/momgo'], function(exports_1, context_1) {
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
    var browser_1, core_1, rx_1, rxServer_1, momgo_1;
    var myServer, testPF, AppComponent;
    return {
        setters:[
            function (browser_1_1) {
                browser_1 = browser_1_1;
            },
            function (core_1_1) {
                core_1 = core_1_1;
            },
            function (rx_1_1) {
                rx_1 = rx_1_1;
            },
            function (rxServer_1_1) {
                rxServer_1 = rxServer_1_1;
            },
            function (momgo_1_1) {
                momgo_1 = momgo_1_1;
            }],
        execute: function() {
            myServer = (function (_super) {
                __extends(myServer, _super);
                function myServer() {
                    _super.call(this, 'http://4VJSSY1:3000');
                }
                myServer = __decorate([
                    core_1.Injectable(), 
                    __metadata('design:paramtypes', [])
                ], myServer);
                return myServer;
            }(rxServer_1.serverRx));
            testPF = (function (_super) {
                __extends(testPF, _super);
                function testPF(myServer) {
                    _super.call(this, myServer, "testPF", "save");
                }
                testPF = __decorate([
                    core_1.Injectable(),
                    __param(0, core_1.Inject(myServer)), 
                    __metadata('design:paramtypes', [myServer])
                ], testPF);
                return testPF;
            }(momgo_1.Query));
            AppComponent = (function () {
                function AppComponent(testPF) {
                    this.testPF = testPF;
                    this.test = [];
                    this.saveSubject = new rx_1.Subject();
                    this.saveOberverable = this.saveSubject.asObservable();
                    this.idsToSave = [];
                    var vm = this;
                    testPF.get().subscribe(function (_x) {
                        vm.test = _x;
                        vm.test.forEach(function (_doc) {
                            if (!_doc.other)
                                _doc.other = { a: 1, b: 2, c: 3 };
                            if (!_doc.test)
                                _doc.test = "";
                            if (!_doc.subs)
                                _doc.subs = [{ val: "" }, { val: "" }, { val: "" }, { val: "" }, { val: "" }, { val: "" }];
                        });
                    });
                    vm.saveOberverable.map(function (_id) {
                        vm.idsToSave.push(_id);
                        return vm.idsToSave;
                    }).debounceTime(300).subscribe(function () {
                        vm.idsToSave.forEach(function (_id) {
                            vm.testPF.save(_id);
                        });
                        vm.idsToSave = [];
                    });
                }
                AppComponent.prototype.save = function (_id) {
                    this.saveSubject.next(_id);
                };
                AppComponent = __decorate([
                    core_1.Component({
                        selector: 'my-app',
                        template: "<h1>My First Angular 2 App</h1>\n    <div *ngFor=\"#item of test\" style=\"width: 1746px;\" >\n        <input [value]=\"item.test\" (input)=\"item.test = $event.target.value; save(item._id)\" />\n        \n        <input [value]=\"item.other.a\" (input)=\"item.other.a = $event.target.value; save(item._id)\" />\n        <input [value]=\"item.other.b\" (input)=\"item.other.b = $event.target.value; save(item._id)\" />\n        <input [value]=\"item.other.c\" (input)=\"item.other.c = $event.target.value; save(item._id)\" />\n        \n        <input *ngFor=\"#subItem of item.subs\" [value]=\"subItem.val\" (input)=\"subItem.val = $event.target.value; save(item._id)\" />\n        \n    </div>",
                        providers: [testPF]
                    }), 
                    __metadata('design:paramtypes', [testPF])
                ], AppComponent);
                return AppComponent;
            }());
            exports_1("AppComponent", AppComponent);
            core_1.enableProdMode();
            browser_1.bootstrap(AppComponent, [myServer]);
        }
    }
});
//# sourceMappingURL=main.js.map