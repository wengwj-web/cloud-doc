import React, { useState, useEffect } from 'react';
import { faPlus, faFileImport, faSave } from '@fortawesome/free-solid-svg-icons'
import SimpleMDE from 'react-simplemde-editor'
import uuidv4 from 'uuid/v4'
import { flattenArr, objToArr, timestampToString } from './utils/helper'
import fileHelper from './utils/fileHelper'
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css'
import "easymde/dist/easymde.min.css"
import FileSearch from './components/FileSearch'
import FileList from './components/FileList'
import BottonBtn from './components/BottomBtn'
import TabList from './components/TabList'
import defaultFiles from './utils/defaultFiles'
import useIpcRenderer from './hooks/useIpcRenderer'
const { join, basename, extname, dirname } = window.require('path')
const { remote, ipcRenderer } = window.require('electron')

const Store = window.require('electron-store')

// const store = new Store()
// store.set('name','viking')
// console.log(store.get('name'))

// store.delete('name')
// console.log(store.get('name'))

const fileStore = new Store({ 'name': 'Files Data' })
const settingsStore = new Store({ name: 'Settings' })
const getAutoSync = () => ['accessKey', 'secretKey', 'bucketName', 'enableAutoSync'].every(key => !!settingsStore.get(key))
const saveFilesToStore = (files) => {
  const fileStoreObj = objToArr(files).reduce((result, file) => {
    const { id, path, title, createdAt, isSynced, updatedAt } = file
    result[id] = {
      id,
      path,
      title,
      createdAt,
      isSynced,
      updatedAt
    }
    return result
  }, {})
  fileStore.set('files', fileStoreObj)
}

function App() {
  const [files, setFiles] = useState(fileStore.get('files') || {})
  // console.log(files)
  const [activeFileID, setActiveFileID] = useState('')
  const [openedFileIDs, setOpenedFileIDs] = useState([])
  const [unsavedFileIDs, setUnsavedFileIDs] = useState([])
  const [searchFiles, setSearchFiles] = useState([])
  const fileArr = objToArr(files)
  const saveLocation = remote.app.getPath('documents')
  const activeFile = files[activeFileID]
  const openedFiles = openedFileIDs.map(openID => {
    return files[openID]
  })
  const fileListArr = (searchFiles.length > 0) ? searchFiles : fileArr

  // console.log(fileArr)
  const fileClick = (fileID) => {
    setActiveFileID(fileID)
    const currentFile = files[fileID]
    const { id, title, path, isLoaded } = currentFile
    if (!isLoaded) {
      if (getAutoSync()) {
        ipcRenderer.send('download-file', {
          key: `${title}.md`,
          path,
          id
        })
      } else {
        fileHelper.readFile(currentFile.path).then(value => {
          const newFile = { ...files[fileID], body: value, isLoaded: true }
          setFiles({ ...files, [fileID]: newFile })
        })
      }
    }
    if (!openedFileIDs.includes(fileID)) {
      setOpenedFileIDs([...openedFileIDs, fileID])
    }
  }
  const tabClick = (fileID) => {
    setActiveFileID(fileID)
  }
  const tabClose = (id) => {
    const tabsWithout = openedFileIDs.filter(fileID => fileID !== id)
    setOpenedFileIDs(tabsWithout)
    if (tabsWithout.length > 0) {
      setActiveFileID(tabsWithout[0])
    } else {
      setActiveFileID('')
    }
  }
  const fileChange = (id, value) => {
    if (value !== files[id].body) {
      const newFile = { ...files[id], body: value }
      setFiles({ ...files, [id]: newFile })
      if (!unsavedFileIDs.includes(id)) {
        setUnsavedFileIDs([...unsavedFileIDs, id])
      }
    }
    // const newFiles = files.map(file => {
    //   if (file.id === id) {
    //     file.body = value
    //   }
    //   return file
    // })

  }
  const deleteFile = (id) => {
    console.log(files)
    if (files[id].isNew) {
      const { [id]: value, ...afterDelete } = files
      console.log(afterDelete)
      setFiles(afterDelete)
    } else {
      fileHelper.deleteFile(files[id].path).then(() => {
        const { [id]: value, ...afterDelete } = files
        setFiles(afterDelete)
        saveFilesToStore(afterDelete)
        tabClose(id)
      })
    }
    // const newFiles = files.filter(file => file.id !== id)

  }
  const updateFileName = (id, title, isNew) => {
    const newPath = isNew ? join(saveLocation, `${title}.md`) :
      join(dirname(files[id].path), `${title}.md`)
    // const newFiles = files.map(file => {
    //   if (file.id === id) {
    //     file.title = title
    //     file.isNew = false
    //   }
    //   return file
    // })
    const modifiedFile = { ...files[id], title, isNew: false, path: newPath }
    const newFiles = { ...files, [id]: modifiedFile }
    if (isNew) {
      fileHelper.writeFile(newPath, files[id].body).then(() => {
        setFiles(newFiles)
        saveFilesToStore(newFiles)
      })
    } else {
      const oldPath = files[id].path
      fileHelper.renameFile(oldPath, newPath).then(() => {
        setFiles(newFiles)
        saveFilesToStore(newFiles)
      })
    }
  }
  const fileSearch = (keyword) => {
    const newFiles = fileArr.filter(file => file.title.includes(keyword))
    setSearchFiles(newFiles)
  }
  const createNewFile = () => {
    const newID = uuidv4()
    // const newFiles = [
    //   ...files, {
    //     id: newID,
    //     title: '',
    //     body: '## 请输入 Markdown',
    //     createdAt: new Date().getTime(),
    //     isNew: true
    //   }
    // ]
    const newFile = {
      id: newID,
      title: '',
      body: '## 请输入 Markdown',
      createdAt: new Date().getTime(),
      isNew: true
    }
    setFiles({ ...files, [newID]: newFile })
  }
  const saveCurrentFile = () => {
    const { path, body, title } = activeFile
    fileHelper.writeFile(path, body).then(() => {
      setUnsavedFileIDs(unsavedFileIDs.filter(id => id !== activeFile.id))
      if (getAutoSync()) {
        ipcRenderer.send('upload-file', {
          key: `${title}.md`, path
        })
      }
    })
  }
  const importFiles = () => {
    remote.dialog.showOpenDialog({
      title: '选择导入的MarkDown文件',
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'MarkDown files', extensions: ['md'] }
      ]
    }).then(result => {
      const paths = result.filePaths
      if (Array.isArray(paths)) {
        const filteredPaths = paths.filter(path => {
          const alreadyAdded = Object.values(files).find(file => {
            return file.path === path
          })
          return !alreadyAdded
        })
        const importFilesArr = filteredPaths.map(path => {
          return {
            id: uuidv4(),
            title: basename(path, extname(path)),
            path
          }
        })
        console.log(importFilesArr)

        const newFiles = { ...files, ...flattenArr(importFilesArr) }
        console.log(newFiles)
        setFiles(newFiles)
        saveFilesToStore(newFiles)
        if (importFilesArr.length > 0) {
          remote.dialog.showMessageBox({
            type: 'info',
            title: `成功导入了${importFilesArr.length}个文件`,
            message: `成功导入了${importFilesArr.length}个文件`
          })
        }
      }
    })
  }
  const activeFileUploaded = () => {
    const { id } = activeFile
    const modifiedFile = { ...files[id], isSynced: true, updatedAt: new Date().getTime() }
    const newFiles = { ...files, [id]: modifiedFile }
    setFiles(newFiles)
    saveFilesToStore(newFiles)
  }
  const activeFileDownloaded = (event, message) => {
    const currentFile = files[message.id]
    const { id, path } = currentFile
    fileHelper.readFile(path).then(value => {
      let newFile
      if (message.status === 'download-success') {
        newFile = {
          ...files[id], body: value, isLoaded: true, isSynced: true,
          updatedAt: new Date().getTime()
        }
      } else {
        newFile = { ...files[id], body: value, isLoaded: true }
      }
      const newFiles = { ...files, [id]: newFile }
      setFiles(newFiles)
      saveFilesToStore(newFiles)
    })
  }
  useIpcRenderer({
    'create-new-file': createNewFile,
    'import-file': importFiles,
    'save-edit-file': saveCurrentFile,
    'search-file': fileSearch,
    'active-file-uploaded': activeFileUploaded,
    'file-downloaded': activeFileDownloaded
  })
  return (
    <div className="App container-fluid px-0">
      <div className="row no-gutters">
        <div className="col-3 bg-light left-panel">
          <FileSearch onFileSearch={fileSearch} />
          <FileList
            files={fileListArr}
            onFileClick={fileClick}
            onFileDelete={deleteFile}
            onSaveEdit={updateFileName}
          />
          <div className="row no-gutters button-group">
            <div className="col">
              <BottonBtn
                text="新建"
                colorClass="btn-primary"
                icon={faPlus}
                onBtnClick={createNewFile}
              />
            </div>
            <div className="col">
              <BottonBtn
                text="导入"
                colorClass="btn-success"
                icon={faFileImport}
                onBtnClick={importFiles}
              />
            </div>
          </div>
        </div>
        <div className="col-9 right-panel">
          {!activeFile && <div className="start-page">
            选择或者创建新的 Markdown 文档
          </div>}
          {
            activeFile &&
            <>
              <TabList
                files={openedFiles}
                activeId={activeFileID}
                unsaveIds={unsavedFileIDs}
                onTabClick={tabClick}
                onCloseTab={tabClose}
              />
              <SimpleMDE
                key={activeFile && activeFile.id}
                value={activeFile && activeFile.body}
                onChange={(value) => { fileChange(activeFileID, value) }}
                options={{
                  minHeight: '515px',
                }}
              />
              {/* <BottonBtn
                text="保存"
                colorClass="btn-primary"
                icon={faSave}
                onBtnClick={saveCurrentFile}
              /> */}
              {activeFile.isSynced && <span className="sync-status">已同步，上次同步{timestampToString(activeFile.updateAt)}</span>}
            </>
          }
        </div>
      </div>
    </div>
  );
}

export default App;
