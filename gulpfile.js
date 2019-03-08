let gulp = require('gulp'),
    GulpCommon = require('../gulp-common'),
    through = require('through2'),
    config = require('./gulp.conf'),
    fs = require('fs'),
    compiler = new GulpCommon('../tsconfig.json', './', config);

let globalPath = '../../dist/',
    globalMinPath = '../../dist.min/';

gulp.task('G_Watch', function () {
    let mbScss = '**/*.mb',
        pcScss = '**/*.pc';

    compiler.scss('style/global.mb', 'global.mb.css', globalPath, ['**/*', `!${pcScss}`]);
    compiler.scss('style/global.pc', 'global.pc.css', globalPath, ['**/*', `!${mbScss}`]);

    /*global*/
    compiler.ts([
        'polyfill',
        'shim',
        'tools',
        'dom',
        'ajax',
        'spa',
        'shell',
        'rule',
        'storage',
        'requireConfig',
        '*',
        'core/*',
        'action/*',
        '**/*',
        '!test',
        'components/**/*',
        'components/**/**/*',
        '!components/dialog/*',
        '!components/table/*',
        '!components/scrollbar/*',
        '!components/feedback/*',
        '!utils/statisticWorker'
        // '!components/newTable/**/*'
    ], 'global.js', globalPath);
    // test
    compiler.ts(['test'], 'test.js', '../../test/');
    compiler.ts(['utils/statisticWorker'], 'statisticWorker.js', globalPath);

});

// gulp.task('Table_Start', ['G_Watch'], function () {
//     compiler.ts([
//         'components/table/*.ts',
//     ], 'demo/table/table.js', globalPath);
//     gulp.start('demo/table/table.js');
// });

//启动页
gulp.task('G_StartPage',function () {
    compiler.ts(['ajax','tools','shell'], 'global.js','../../../../blueWhale/startPage')
});

gulp.task('G_Start', ['G_Watch'], function () {
    gulp.start(compiler.allTask);
});
// //编译生成index.ts文件
// gulp.task('G_CreateIndex', function () {
//     gulp.src([
//         "*.ts",
//         "**/*.ts",
//         "!.gulp-scss-cache/**/*.ts",
//         "!.sass-cache/**/*.ts",
//         "!index.ts"
//     ]).pipe(createIndex('./index.ts'));
//     let once = true;
//     function createIndex(url){
//         return through({objectMode: true, allowHalfOpen: false}, function(file, enc, cb) {
//             let path = file.path.toString().replace(/.+global\\/,'').replace(/\\/g, '/');
//             if (!fs.existsSync(url) || once) {
//                 once = false;
//                 fs.writeFileSync(url, '/**\n' +
//                     ' * 本文件用于gulp打包时引用，防止找不到变量G\n' +
//                     ' */\n\n');
//             }
//             let result = fs.readFileSync(url).toString();
//             result += '/// <reference path="'+ path +'"/>\n';
//             fs.writeFileSync(url, result);
//             cb();
//         }, function (){
//             console.log('index.ts 编译成功');
//         })
//     }
// });

gulp.task('G_Compressor', function () {

    GulpCommon.compressor('css', `${globalPath}*.css`, globalMinPath);
    GulpCommon.compressor('js', `${globalPath}*.js`, globalMinPath);
});