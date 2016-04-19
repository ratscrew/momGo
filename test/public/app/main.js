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
    var browser_1, core_1, core_2, rxServer_1;
    var myServer, AppComponent;
    return {
        setters:[
            function (browser_1_1) {
                browser_1 = browser_1_1;
            },
            function (core_1_1) {
                core_1 = core_1_1;
                core_2 = core_1_1;
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
            AppComponent = (function () {
                function AppComponent(serverRx) {
                    this.test = "start";
                    var vm = this;
                    serverRx.publicFunction('testPF').subscribe(function (_x) {
                        vm.test = _x;
                    });
                }
                AppComponent = __decorate([
                    core_2.Component({
                        selector: 'my-app',
                        template: '<h1>My First Angular 2 App</h1><div>{{test|json}}</div>'
                    }), 
                    __metadata('design:paramtypes', [myServer])
                ], AppComponent);
                return AppComponent;
            }());
            exports_1("AppComponent", AppComponent);
            browser_1.bootstrap(AppComponent, [myServer]);
        }
    }
});
//# sourceMappingURL=main.js.map