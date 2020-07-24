var fs = require("fs");
var path = require("path");
const gExtension = ".html";
const cheerio = require("cheerio");
// let html_tmp = '<audio src="./${fileName}" controls id="audio"></audio> <select id="select" onchange="changeRate()"> <option value="0.8" selected>0.8</option> <option value="1" selected>1</option> <option value="1.2">1.2</option> <option value="1.5">1.5</option> <option value="1.7">1.7</option> <option value="2">2</option> </select> <script> const audio = document.getElementById(\'audio\'); const select = document.getElementById(\'select\'); function changeRate() {audio.playbackRate = select.options[select.selectedIndex].value; } </script>'
let playbackRate =
    ' <select id="select" onchange="changeRate()"> <option value="0.8" selected>0.8</option> <option value="1" selected>1</option> <option value="1.2">1.2</option> <option value="1.5">1.5</option> <option value="1.7">1.7</option> <option value="2">2</option> </select> <script> const audio = document.getElementById(\'audio\'); const select = document.getElementById(\'select\'); function changeRate() {audio.playbackRate = select.options[select.selectedIndex].value; } </script>';

// console.log(process.execPath);//返回启动 Node.js 进程的可执行文件的绝对路径名
// console.log(__dirname);//是被执行的js文件的地址
// console.log(process.cwd());//是当前执行node命令的目录地址

// ***  重要设置： 解析需要遍历的文件夹，必须设置
const targetFile = "/Users/cindy/Documents/skill-doc/35-面试现场/";
// const targetFile = './'  // 本地调试用到
const fileTypes = ["mp3", "m4a"];

var filePath = path.resolve(targetFile);
//调用文件遍历方法
fileDisplay(filePath);

/**
 * 文件遍历方法
 * @param filePath 需要遍历的文件路径
 */
function fileDisplay(filePath) {
    //根据文件路径读取文件，返回文件列表
    fs.readdir(filePath, function (err, files) {
        if (err) {
            console.warn(err);
        } else {
            //遍历读取到的文件列表
            files.forEach(function (filename) {
                //获取当前文件的绝对路径
                var filedir = path.join(filePath, filename);
                //根据文件路径获取文件信息，返回一个fs.Stats对象
                fs.stat(filedir, function (eror, stats) {
                    if (eror) {
                        console.warn("获取文件stats失败");
                    } else {
                        var isFile = stats.isFile(); //是文件
                        var isDir = stats.isDirectory(); //是文件夹
                        if (isFile) {
                            if (gExtension == path.extname(filedir)) {
                                doReplace({ filedir });
                            }
                        }
                        if (isDir) {
                            fileDisplay(filedir); //递归，如果是文件夹，就继续遍历该文件夹下面的文件
                        }
                    }
                });
            });
        }
    });
}

/**
 * 获取音频文件名称， 主要是后缀有不同
 * @param {string} fileName 带路径的文件名，不含后缀
 * @returns {string} 不带路径的文件名，有后缀
 */

function getAudioFileName(fileName) {
    // console.log('getAudioFileName param  fileName: '+ fileName )
    let file = '';
    fileTypes.some((type, index) => {
        try {
            fs.accessSync(`${fileName}.${type}`);
            file = `${fileName}.${type}`
            // console.log('getAudioFileName try access file: '+ file )
            return true;
        } catch (e) {
            file = '';
            return false;
        }
    });
    // console.log('getAudioFileName return : '+ file )

    if(!file.length){
        console.warn(`音频文件没找到，请确认文件后缀是否为 ${fileTypes.toString()}`)
    }

    return file.length?path.basename(file):'';
}
/**
 * 替换内容
 * @param {string} srcStr 替换前的字符串
 * @param {string} replaceSrc 替换后的字符串
 * @param {string} filedir 文件路径
 */

function doReplace({ srcStr, replaceSrc, filedir }) {
    fs.readFile(filedir, "utf8", function (err, data) {
        // 获取文件名，去除文件路径
        let fileName = path.basename(filedir);
        let $ = cheerio.load(data, { decodeEntities: false });

        // delete base element
        $("base").remove();
        // get file path without file name
        let filePath = filedir.replace(fileName, "");
        let selectId = "div";
        // 删除audio的上一个兄弟节点（图片，影响操作）
        $(selectId).find("audio").prev().remove();

        // 音频文件目前只配置了mp3, m4a，找不到文件时看下这个方法是不是有问题
        let audioFile = getAudioFileName(filedir.replace('.html', ''))

        // 使用下面的元素替换原有 audio 元素
        let ele = `<div> <audio src="./${audioFile}" controls id="audio"></audio> ${playbackRate} </div>`;
        $(selectId).find("audio").replaceWith(ele);

        const result = $.html();
        // writeFile改写文件内容
        // let saveName = 'fortest.html'        // 4  debug 
        // fs.writeFile(filePath+'/'+saveName, result, 'utf8', function (err) { // 4  debug 
        fs.writeFile(filedir, result, "utf8", function (err) {
            if (err) return console.log(err);
            console.log("done .... " + fileName);
        });
    });
}
