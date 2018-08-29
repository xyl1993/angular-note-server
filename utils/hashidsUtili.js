var Hashids = require('hashids');

module.exports = {
  /**
   * 加密
   */
  encode: function (id, key) {
    let hashids = new Hashids(key, 8);
    return hashids.encode(id);
  },
  /**
   * 解密
   */
  decode:function(id,key){
    let hashids = new Hashids(key,8);
    let numbers = hashids.decode(id);
		return numbers.length>0?numbers[0]:null;
  }
}