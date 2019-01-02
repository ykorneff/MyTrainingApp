'use strickt';

const ERROR = '[ERROR]';
const WARN = '[WARNING]';
const INFO = '[INFO]';
const DEBUG = '[DEBUG]';

let levels = new Map();
levels.set(1, ERROR);
levels.set(3, WARN);
levels.set(5, INFO);
levels.set(7, DEBUG);

function timeStamp(){
    let now = new Date(Date.now());
    return `<${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}.${now.getMilliseconds()}>`;
}

function leveledTrace (message, level){
    if (level<=traceLevel) {
        console.log(`${timeStamp()}${levels.get(level)}::${message}`);
    }
}
