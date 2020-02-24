const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron')
const isDev = require('electron-is-dev')
const { autoUpdater } = require('electron-updater')
const path = require('path')
const AppWindow = require('./src/AppWindow')
const menuTemplate = require('./src/menuTemplate')
const Store = require('electron-store')
const QiniuManager = require('./src/utils/QiniuManager')
const settingsStore = new Store({ name: 'Settings' })
const fileStore = new Store({ name: 'Files Data' })
let mainWindow, settingsWindow

const createManager = () => {
  const accessKey = settingsStore.get('accessKey')
  const secretKey = settingsStore.get('secretKey')
  const bucketName = settingsStore.get('bucketName')
  return new QiniuManager(accessKey, secretKey, bucketName)
}
app.on('ready', () => {
  // 更新相关
  // if (isDev) {
  //   autoUpdater.updateConfigPath = path.join(__dirname, 'dev-app-update.yml')
  // }
  // autoUpdater.autoDownload = false
  // autoUpdater.checkForUpdates()
  // autoUpdater.checkForUpdatesAndNotify()
  // autoUpdater.on('error', (error) => {
  //   dialog.showErrorBox('Error:', error == null ? "unknown" : (error))
  // })
  // autoUpdater.on('checking-for-update', () => {
  //   console.log('Checking for update ...')
  // })
  // autoUpdater.on('update-available', () => {
  //   dialog.showMessageBox({
  //     type: 'info',
  //     title: '应用有新的版本',
  //     message: '发现新版本，是否现在更新?',
  //     buttons: ['是', '否']
  //   }, (buttonIndex) => {
  //     if (buttonIndex === 0) {
  //       autoUpdater.downloadUpdate()
  //     }
  //   })
  // })
  // autoUpdater.on('update-not-available', () => {
  //   dialog.showMessageBox({
  //     title: '没有新版本',
  //     message: '当前已经是最新版本'
  //   })
  // })
  // autoUpdater.on('download-progress', (progressObj) => {
  //   let log_message = "Download speed: " + progressObj.bytesPerSecond;
  //   log_message = log_message + ' - Download ' + progressObj.percent + '%'
  //   log_message = log_message + ' (' + progressObj.transferred + '/' + progressObj.total + ''
  //   console.log(log_message)
  // })
  // autoUpdater.on('update-downloaded', () => {
  //   dialog.showMessageBox({
  //     title: '安装成功',
  //     message: '更新下载完毕，应用将重启并进行安装'
  //   }, () => {
  //     setImmediate(() => autoUpdater.quitAndInstall())
  //   })
  // })

  // mainWindow = new BrowserWindow({
  //   width: 1024,
  //   height: 600,
  //   webPreferences: {
  //     nodeIntegration: true
  //   }
  // })

  const mainWindowConfig = {
    width: 1440,
    height: 768,
  }

  const urlLocation = isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, './index.html')}`
  // mainWindow.loadURL(urlLocation)
  mainWindow = new AppWindow(mainWindowConfig, urlLocation)
  mainWindow.on('closed', () => {
    mainWindow = null
  })
  mainWindow.webContents.openDevTools()

  let menu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(menu)
  ipcMain.on('open-settings-window', () => {
    const settingsWindowConfig = {
      width: 500,
      height: 400,
      parent: mainWindow
    }
    const settingsFileLocation = `file://${path.join(__dirname, './settings/settings.html')}`
    settingsWindow = new AppWindow(settingsWindowConfig, settingsFileLocation)
    settingsWindow.removeMenu()
    settingsWindow.on('closed', () => {
      settingsWindow = null
    })
  })
  ipcMain.on('upload-file', (event, data) => {
    const manager = createManager()
    manager.uploadFile(data.key, data.path).then(data => {
      console.log('上传成功', data)
      mainWindow.webContents.send('active-file-uploaded')
    }).catch(() => {
      dialog.showErrorBox('同步失败', '请检查七牛云参数是否正确')
    })
  })
  ipcMain.on('download-file', (event, data) => {
    const manager = createManager()
    const filesObj = fileStore.get('files')
    const { key, path, id } = data
    manager.getStat(data.key).then((resp) => {
      const serverUpdatedTime = Math.round(resp.putTime / 10000)
      console.log('qiniu', serverUpdatedTime)
      const localUpdatedTime = filesObj[id].updatedAt
      console.log('local', localUpdatedTime)
      if (serverUpdatedTime > localUpdatedTime || !localUpdatedTime) {
        console.log('new file downloaded')
        manager.downloadFile(key, path).then(() => {
          mainWindow.webContents.send('file-downloaded', { status: 'download-success', id })
        })
      } else {
        console.log('no new file')
        mainWindow.webContents.send('file-downloaded', { status: 'no-new-file', id })
      }
    }, (error) => {
      console.log(error)
      if (error.statusCode === 612) {
        mainWindow.webContents.send('file-downloaded', { status: 'no-file', id })
      }
    })
  })
  ipcMain.on('upload-all-to-qiniu', () => {
    mainWindow.webContents.send('loading-status', true)
    setTimeout(() => {
      mainWindow.webContents.send('loading-status', false)
    }, 2000);
  })
  ipcMain.on('config-is-saved', () => {
    let qiniuMenu = process.platform === 'darwin' ? menu.items[3] : menu.items[2]
    const switchItems = (toggle) => {
      [1, 2, 3].forEach(number => {
        qiniuMenu.submenu.items[number].enabled = toggle
      })
    }
    const qiniuIsConfiged = ['accessKey', 'secretKey', 'bucketName'].every(key => !!settingsStore.get(key))
    if (qiniuIsConfiged) {
      switchItems(true)
    } else {
      switchItems(false)
    }
  })
  // let secondWindow = new BrowserWindow({
  //   width: 400,
  //   height: 300,
  // })
  // secondWindow.loadFile('./settings/settings.html')
  // secondWindow.webContents.openDevTools()
})