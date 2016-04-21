import {bootstrap}    from 'angular2/platform/browser';
import {Injectable,Component,Inject,enableProdMode} from 'angular2/core';
import {Observable, Subject} from 'rxjs/rx';

import {serverRx} from 'rx-server/clientScripts/rxServer';
import {Query} from '../../../clientScripts/momgo'

@Injectable()
class myServer extends serverRx{
    constructor(){
        super('http://4VJSSY1:3000');
    }
}

@Injectable()
class testPF extends Query {
    constructor(@Inject(myServer) myServer:myServer) {
        super(myServer,"testPF","save")
    }
}

@Component({
    selector: 'my-app',
    template: `<h1>My First Angular 2 App</h1>
    <div *ngFor="#item of test" style="width: 1746px;" >
        <input [value]="item.test" (input)="item.test = $event.target.value; save(item._id)" />
        
        <input [value]="item.other.a" (input)="item.other.a = $event.target.value; save(item._id)" />
        <input [value]="item.other.b" (input)="item.other.b = $event.target.value; save(item._id)" />
        <input [value]="item.other.c" (input)="item.other.c = $event.target.value; save(item._id)" />
        
        <input *ngFor="#subItem of item.subs" [value]="subItem.val" (input)="subItem.val = $event.target.value; save(item._id)" />
        
    </div>`,
    providers:[testPF]
})
export class AppComponent {
    test:Array<any> = [];
    saveSubject:Subject<any> = new Subject(); 
    saveOberverable:Observable<any> = this.saveSubject.asObservable();
    idsToSave = [];
    constructor(private testPF:testPF){
        let vm = this;
        testPF.get().subscribe((_x)=>{
            vm.test = _x;
            vm.test.forEach((_doc)=>{
                if(!_doc.other) _doc.other = {a:1,b:2,c:3};
                if(!_doc.test) _doc.test = "";
                
                if(!_doc.subs) _doc.subs = [{val:""},{val:""},{val:""},{val:""},{val:""},{val:""}];
            })
        })
        
        vm.saveOberverable.map((_id)=>{
            vm.idsToSave.push(_id);
            return vm.idsToSave;
        }).debounceTime(300).subscribe(()=>{
            vm.idsToSave.forEach((_id)=>{
                vm.testPF.save(_id)
            })
            vm.idsToSave = [];
        })
    }
    
    
    
    save(_id){
        this.saveSubject.next(_id);
    }
}
enableProdMode()
bootstrap(AppComponent,[myServer]);
