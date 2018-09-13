var isUtf8 = require('is-utf8');


module.exports = {
    getSizeOfStringInKB: function(string) {
        var sizeInBytes = getBytes(string);
 		return (sizeInBytes/ (1024 * 1024));
    },
    isUtfString: function(string){
    	return true;
    },
    parseHrtimeToSeconds: function(hrtime) {
    var seconds = (hrtime[0] + (hrtime[1] / 1e9)).toFixed(3);
    return seconds;
    },
    getTimePassedInSeconds: function(){
    	return Math.round(+new Date()/1000);
    }
}

function getBytes(string){
  return Buffer.byteLength(string, 'utf8')
}
 