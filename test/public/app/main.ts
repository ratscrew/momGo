import {bootstrap}    from 'angular2/platform/browser';
import {Injectable,Component} from 'angular2/core';


import {serverRx} from 'rx-server/clientScripts/rxServer';

@Injectable()
class myServer extends serverRx{
    constructor(){
        super('http://localhost:3000');
    }
}

@Component({
    selector: 'my-app',
    template: '<h1>My First Angular 2 App</h1><div>{{test|json}}</div>'
})
export class AppComponent {
    test:any = "start";
    constructor(serverRx:myServer){
        let vm = this;
        serverRx.publicFunction('testPF').subscribe((_x)=>{
            vm.test = _x;
        })
    }
}

bootstrap(AppComponent,[myServer]);
