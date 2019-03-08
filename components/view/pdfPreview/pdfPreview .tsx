/// <amd-module name="PDFPreview" />

import {Modal} from "../../feedback/modal/Modal";

interface PDFObject{
    pdfobjectversion: string;
    supportsPDFs: boolean;
    embed: (url: string, el: string | HTMLElement, options?: obj) => HTMLEmbedElement;
}

export interface IPDFPreviewPara{
    url: string; // pdf 文件地址
}

export class PDFPreview{

    constructor(para: IPDFPreviewPara){
        let body = <div className='pdf-preview-content'/>;
        let modal = new Modal({
            body: body,
            isShow: true,
            header: {
                title: 'PDF预览',
                isFullScreen: true,
            },
            isBackground: false,
            className: 'pdf-preview-modal',
            isOnceDestroy: true,
            width: '70%',
            height: '70%'
        });
        // if(G.tools.isMb){
        requirejs(['pdfjs', 'pdfh5'], (pdfjsLib, Pdfh5) => {
            window['pdfjsLib'] = pdfjsLib; // padh5需要使用作为全局变量的pdfjsLib

            // 给pdfjsLib设置解析worker依赖配置
            pdfjsLib.GlobalWorkerOptions.workerSrc = requirejs.toUrl('../plugin/pdfjs/pdf.worker.js');

            // 实例化pdf展示
            new Pdfh5(body, {
                scrollEnable: true,//是否允许pdf滚动
                pdfurl: para.url
            });
        });
        // }else{
        //     require(['pdfObject'], (pdfObject: PDFObject) => {
        //         if(pdfObject.supportsPDFs){
        //             pdfObject.embed(para.url, body);
        //         }else{
        //             Modal.alert('该浏览器不支持PDF预览');
        //             modal.isShow = false;
        //         }
        //     })
        // }
    }
}