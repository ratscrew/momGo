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
    query(){
        let me = this;
        return me.get().map((_docs)=>{
            _docs.forEach((_doc)=>{
                if(_doc.other === undefined){
                   // console.log({fire:_doc._id})
                   me.set([_doc._id,'other'], {a:1,b:2,c:3}); 
                } 
                if(_doc.test === undefined){
                    //console.log({fire:_doc._id})
                   me.set([_doc._id,'test'], ""); 
                } 
                
                if(_doc.subs === undefined) {
                   // console.log({fire:_doc._id})
                    me.set([_doc._id,'subs'], [{val:""},{val:""},{val:""},{val:""},{val:""},{val:""}]);
                }
            })
            return _docs.filter((_doc)=>{
                if(_doc.other !== undefined && _doc.subs !== undefined && _doc.test !== undefined){
                    return true;
                }
                else {
                    //console.log(_doc._id)
                    return false;
                };
            });
        })
    }
}

@Component({
    selector: 'my-app',
    template: `<h1>My First Angular 2 App</h1>
    <div *ngFor="#item of test; trackBy: getId" style="width: 1746px;" >
        <input [value]="item.test" (input)="save([item._id,'test'],$event.target.value)" />
        
        <input [value]="item.other.a" (input)="save([item._id,'other','a'],$event.target.value)" />
        <input [value]="item.other.b" (input)="save([item._id,'other','a'],$event.target.value)" />
        <input [value]="item.other.c" (input)="save([item._id,'other','a'],$event.target.value)" />
        
        <input *ngFor="#subItem of item.subs; #i = index; trackBy: getIndex" [value]="subItem.val" (input)="save([item._id,'subs',i,'val'],$event.target.value)" />
        
    </div>`,
    providers:[testPF]
})
export class AppComponent {
    test:Array<any> = [];
    saveSubject:Subject<any> = new Subject(); 
    saveOberverable:Observable<any> = this.saveSubject.asObservable();
    idsToSave = {};
    constructor(private testPF:testPF){
        let vm = this;
        testPF.query().subscribe((_x)=>{
            vm.test = _x;
            vm.test.forEach((_doc)=>{
                //if(!_doc.other) _doc.other = {a:1,b:2,c:3};
                //if(!_doc.test) _doc.test = "";
                
                //if(!_doc.subs) testPF.set([_doc._id,'subs'], [{val:""},{val:""},{val:""},{val:""},{val:""},{val:""}]);
            })
        })
        
        vm.saveOberverable.map((_id)=>{
            vm.idsToSave[_id] = true;
            return vm.idsToSave;
        }).debounceTime(300).subscribe(()=>{
            for(var _id in vm.idsToSave){
                vm.testPF.save(_id)
            }
            vm.idsToSave = {};
        })
    }
    
    getId(i,doc){
        return doc._id
    }
    
    getIndex(i,doc){
        return i
    }
    
    save(addr,value){
        this.testPF.set(addr,value);
        this.saveSubject.next(addr[0]);
    }
}
enableProdMode()
bootstrap(AppComponent,[myServer]);
