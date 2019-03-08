// /// <amd-module name="TableLite"/>
// interface TableLitePara {
//     cols:COL[];
//     data:obj[];
//     table:HTMLElement;
// }
// export class TableLite{
//     private thead: HTMLTableSectionElement;
//     private tbody: HTMLTableSectionElement;
//     constructor(private para:TableLitePara){
//         this.thead = document.createElement('thead');
//         this.tbody = document.createElement('tbody');
//         this.initThead();
//         this.initTbody();
//     }
//     private initThead(){
//         console.log('into initThead...');
//         Array.isArray(this.para.cols) && this.para.cols.forEach((col) => {
//             let th = document.createElement('th');
//             th.innerHTML = col.title?col.title:'';
//             this.thead.appendChild(th);
//         });
//         debugger;
//         this.para.table.appendChild(this.thead);
//     }
//     private initTbody(){
//         Array.isArray(this.para.data) && this.para.data.forEach((o)=>{
//            this.row.addByData(o);
//         });
//         this.para.table.appendChild(this.tbody);
//     }
//     public row = (function (self) {
//         let addByData = function(data:any){
//             let tr = document.createElement('tr');
//             Array.isArray(self.para.cols) && self.para.cols.forEach((col) => {
//                 let td = document.createElement('td');
//                 td.innerHTML = data[col.name];
//                 tr.appendChild(td);
//             });
//             self.tbody.appendChild(tr);
//         };
//         let addByTr = function (tr:HTMLTableRowElement) {
//             console.log(tr);
//             self.tbody.appendChild(tr);
//         }
//         return {
//             addByData: addByData,
//             addByTr: addByTr
//         }
//     }(this));
// }