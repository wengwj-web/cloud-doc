const qiniu = require('qiniu')
const path = require('path')
const QiniuManager = require('./src/utils/QiniuManager')


var accessKey = '2frdri7jB0brSIDaMnawbFAOYYYlXcVpuVj49Z6s';
var secretKey = 'x6cHiLtyNHe268AN8RwcSpUuKjZHuaib5aCmeh87';
var localFile = "C:/Users/wwj/Documents/hello.md";
var key = 'first 1.md';
const downloadPath = path.join(__dirname, key)
const manager = new QiniuManager(accessKey, secretKey, 'clouddocs')
// manager.uploadFile(key, localFile).then((data) => {
//   console.log('上传成功', data)
//   return manager.deleteFile(key)
// }).then((data) => {
//   console.log('删除成功')
// })
// manager.getBucketDomain().then((data) => {
//   console.log(data)
// })
// manager.generateDownloadLink(key).then(data => {
//   console.log(data)
//   return manager.generateDownloadLink('abc.md')
// }).then(data => {
//   console.log(data)
// })
// manager.downloadFile(key, downloadPath).then(() => {
//   console.log('下载写入文件完毕')
// })
// manager.deleteFile(key)
// var publicBucketDomain = 'http://q619af51y.bkt.clouddn.com';