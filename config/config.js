const path = require('path');
module.exports = {
  'appServerIp':'http://localhost:4200',
  'defaultImg': 'topimg.jpg',    //默认头像
  'secret': 'SUMMERNOTE',
  QNdomain: 'http://oq4pg1mfz.bkt.clouddn.com/',
  //七牛云 配置
  qiniuConfig: {
    //需要填写你的 Access Key 和 Secret Key
    accessKey: 'uT6LleER80-2JATrId1mzcoR_i6XanKvrpzDUaX-',
    secretKey: '5VxbwMa7Pb5Pe2euYjvQhhybrkQe_yHnuSXCeQZZ',
    bucket: 'summerlog',
    origin: 'http://oq4pg1mfz.bkt.clouddn.com',
    uploadURL: 'http://up-z2.qiniup.com/',
    /**
     * 华东的存储空间 使用 up-z0.qiniu.com 或者 up.qiniu.com
      华北的存储空间 使用 up-z1.qiniu.com
      华南的存储空间 使用 up-z2.qiniu.com
     */
  },
  OAuthConfig: {
    GITHUB_CLIENT_ID: '5243a5ae1ee330c9e0d8',
    GITHUB_CLIENT_SCOPE: ['user'],
    GITHUB_CLIENT_SECRET: '4cb010dfb39fab61d0142e4ba289b9f359ca76d4',
    GITHUB_REDIRECT_URL:'http://localhost:3001/oAuth/github_callback'
  }
}