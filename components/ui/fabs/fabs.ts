/// <amd-module name="Fabs"/>
// import tools = G.tools;
// import d = G.d;
// interface locPara{
// 	top?:number,
// 	bottom?:number,
// 	left?:number,
// 	right?:number
// }
//
// interface FabsPara{
// 	pos : locPara,
// 	btns : Btn[],
// 	container?: HTMLElement;
// 	callback?(btn : Btn, i : number);
// }
// export class Fabs{
// 	private container:HTMLElement = null;
// 	private mainButton:HTMLElement = null;
// 	private posData:locPara = null;
// 	private isOpen:boolean = false;
// 	constructor(private para:FabsPara){
// 		this.posData = para.pos;
// 		this.init();
// 		this.getData(para);
// 		if(para.callback) {
// 			d.on(this.container, 'click', 'div.item', function (e) {
// 				para.callback(para.btns[this.dataset.index], parseInt(this.dataset.index));
// 			});
// 		}
// 	}
// 	private getData(para:FabsPara){
// 		let data = para.btns;
// 		if(data.length==1){
// 			this.mainButton.innerHTML = data[0].icon?data[0].icon:data[0].title;
// 		}
// 		else {
// 			for (let i = 0; i < data.length; i++) {
// 				let div = document.createElement("div");
// 				div.className = "item";
// 				div.dataset.index = i.toString();
// 				div.style.transitionDelay = i / 3 + "";
// 				let span = document.createElement("span");
// 				span.innerHTML = data[i].icon ? data[i].icon : data[i].title;
// 				div.appendChild(span);
// 				this.container.appendChild(div);
// 			}
// 		}
// 		para.container ? para.container.appendChild(this.container) :document.body.appendChild(this.container);
// 	}
// 	private init(){
// 		this.container = document.createElement("div");
// 		this.container.className = "fabs-wrapper";
// 		this.mainButton = document.createElement("div");
// 		this.mainButton.className = "mainButton";
// 		this.mainButton.innerText = "按钮";
// 		this.container.appendChild(this.mainButton);
// 		if(this.posData){
// 			for (let prop in this.posData){
// 				this.container.style[prop] = this.posData[prop] + "px";
// 			}
// 		}
// 		let that = this;
// 		this.mainButton.addEventListener("click",function(){
// 			if(!that.isOpen)
// 				that.show();
// 			else
// 				that.hide();
// 		})
// 	}
// 	show(){
// 		let animateDiv = document.querySelectorAll(".item");
// 		for(let i=0;i<animateDiv.length;i++){
// 			animateDiv[i].setAttribute("style","top:-"+50*(i+1)+"px; opacity:1;");
// 		}
// 		this.isOpen = true;
// 	}
// 	hide(){
// 		let animateDiv = document.querySelectorAll(".item");
// 		for(let i=0;i<animateDiv.length;i++){
// 			animateDiv[i].setAttribute("style","top:-40px; opacity:0;");
// 		}
// 		this.isOpen = false;
// 	}
// }
//
//
//
//
