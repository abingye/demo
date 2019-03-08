 ///<amd-module name="SQLEditor"/>
import {FormCom, IFormComPara} from "../basic";

declare let ace: any;

interface ISQLEditorPara extends IFormComPara{
    width?: number|string;
    height?: number|string;
}
export class SQLEditor extends FormCom{

    private editor;
    private readonly setSql = 'ace/mode/sql';

    constructor(para: ISQLEditorPara){
        super(para);
        this.editorInit();
        this.width = para.width;
        this.height = para.height;

    }

    protected wrapperInit(){
        return <div className="sql-editor"></div>;
    }

    private editorInit(){
        require(['AceEditor'], () => {
            this.sqlConfigInit();
            this.editor = ace.edit(this.wrapper);
            this.editor.session.setMode(this.setSql);
            this.set(this._value);
        });

    }

    private _width: number | string;
    get width(){
        return this._width;
    }
    set width(num: number | string) {
        if((typeof num === 'number'|| typeof num === 'string') && this._width !== num){

            this.wrapper.style.width =  typeof num === 'number' ? `${num}px` : num;
            this._width = num;
        }
    }

    private _height:number | string;
    set height(num: number|string) {
        if((typeof num === 'number'|| typeof num === 'string') && this._height !==num ){
            this.wrapper.style.height = typeof num === 'number' ? `${num}px`: num;
            this._height = num;
        }
    }
    get height(){
        return this._height;
    }


    private sqlConfigInit() {
        ace.define("ace/mode/sql_highlight_rules",["require","exports","module","ace/lib/oop","ace/mode/text_highlight_rules"], function(require, exports, module) {
            "use strict";

            var oop = require("../lib/oop");
            var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

            var SqlHighlightRules = function() {

                var keywords = (
                    "select|insert|update|delete|from|where|and|or|group|by|order|limit|offset|having|as|case|" +
                    "when|else|end|type|left|right|join|on|outer|desc|asc|union|create|table|primary|key|if|" +
                    "foreign|not|references|default|null|inner|cross|natural|database|drop|grant"
                );

                var builtinConstants = (
                    "true|false"
                );

                var builtinFunctions = (
                    "avg|count|first|last|max|min|sum|ucase|lcase|mid|len|round|rank|now|format|" +
                    "coalesce|ifnull|isnull|nvl"
                );

                var dataTypes = (
                    "int|numeric|decimal|date|varchar|char|bigint|float|double|bit|binary|text|set|timestamp|" +
                    "money|real|number|integer"
                );

                var keywordMapper = this.createKeywordMapper({
                    "support.function": builtinFunctions,
                    "keyword": keywords,
                    "constant.language": builtinConstants,
                    "storage.type": dataTypes
                }, "identifier", true);

                this.$rules = {
                    "start" : [ {
                        token : "comment",
                        regex : "--.*$"
                    },  {
                        token : "comment",
                        start : "/\\*",
                        end : "\\*/"
                    }, {
                        token : "string",           // " string
                        regex : '".*?"'
                    }, {
                        token : "string",           // ' string
                        regex : "'.*?'"
                    }, {
                        token : "string",           // ` string (apache drill)
                        regex : "`.*?`"
                    }, {
                        token : "constant.numeric", // float
                        regex : "[+-]?\\d+(?:(?:\\.\\d*)?(?:[eE][+-]?\\d+)?)?\\b"
                    }, {
                        token : keywordMapper,
                        regex : "[a-zA-Z_$][a-zA-Z0-9_$]*\\b"
                    }, {
                        token : "keyword.operator",
                        regex : "\\+|\\-|\\/|\\/\\/|%|<@>|@>|<@|&|\\^|~|<|>|<=|=>|==|!=|<>|="
                    }, {
                        token : "paren.lparen",
                        regex : "[\\(]"
                    }, {
                        token : "paren.rparen",
                        regex : "[\\)]"
                    }, {
                        token : "text",
                        regex : "\\s+"
                    } ]
                };
                this.normalizeRules();
            };



            oop.inherits(SqlHighlightRules, TextHighlightRules);

            exports.SqlHighlightRules = SqlHighlightRules;
        });

        ace.define(this.setSql,["require","exports","module","ace/lib/oop","ace/mode/text","ace/mode/sql_highlight_rules"], function(require, exports, module) {
            "use strict";

            var oop = require("../lib/oop");
            var TextMode = require("./text").Mode;
            var SqlHighlightRules = require("./sql_highlight_rules").SqlHighlightRules;

            var Mode = function() {
                this.HighlightRules = SqlHighlightRules;
                this.$behaviour = this.$defaultBehaviour;
            };
            oop.inherits(Mode, TextMode);

            (function() {

                this.lineCommentStart = "--";

                this.$id = "ace/mode/sql";
            }).call(Mode.prototype);

            exports.Mode = Mode;

        });

    }
    onSet: (val) => void;


    get(): any {
        return this.editor ? this.editor.getValue() : this._value;
    }

    set(sql:string): void {
        this.editor && this.editor.setValue(sql);
        this._value = sql;
    }
    get value(){
        return this.editor ? this.editor.getValue() : this._value;

    }
    set value(sql){
        this.editor && this.editor.setValue(sql);
        this._value = sql;
    }

}