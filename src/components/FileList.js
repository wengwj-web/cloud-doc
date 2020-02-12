import React, { useState, useEffect, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEdit, faTrash, faTimes } from '@fortawesome/free-solid-svg-icons'
import { faMarkdown } from '@fortawesome/free-brands-svg-icons'
import PropTypes from 'prop-types'
import useKeyPress from '../hooks/useKeyPress'
const FileList = ({ files, onFileClick, onSaveEdit, onFileDelete }) => {
  const [editStatus, setEditStatus] = useState(false)
  const [value, setValue] = useState('')
  let node = useRef(null)
  const enterPressed = useKeyPress(13)
  const escPressed = useKeyPress(27)
  const closeSearch = (editItem) => {
    setEditStatus(false)
    setValue('')
    if (editItem.isNew) {
      onFileDelete(editItem.id)
    }
  }
  useEffect(() => {
    const newFile = files.find(file => file.isNew)
    console.log(newFile)
    if (newFile) {
      setEditStatus(newFile.id)
      setValue(newFile.value)
    }
  }, [files])
  useEffect(() => {
    const editItem = files.find(file => file.id === editStatus)
    if (enterPressed && editStatus && value.trim() !== "") {
      onSaveEdit(editItem.id, value)
      setEditStatus(false)
      setValue('')
    }
    if (escPressed && editStatus) {
      closeSearch(editItem)
    }
  })
  useEffect(() => {
    if (editStatus) {
      node.current.focus()
    }
  }, [editStatus])
  return (
    <ul className="list-group list-group-flush file-list">
      {
        files.map(file => {
          return (
            <li
              className="list-group-item bg-light row d-flex justify-content-between align-items-center  file-items mr-0"
              key={file.id}
            >
              {(file.id !== editStatus && !file.isNew) &&
                <>
                  <span className="col-2">
                    <FontAwesomeIcon icon={faMarkdown} size="lg" />
                  </span>
                  <span
                    className="col-6 c-link"
                    onClick={() => { onFileClick(file.id) }}
                  >{file.title}</span>
                  <button type="button" className="icon-button col-2"
                    onClick={() => { setEditStatus(file.id); setValue(file.title) }}
                  >
                    <FontAwesomeIcon icon={faEdit} title="编辑" size="lg" />
                  </button>
                  <button type="button" className="icon-button col-2"
                    onClick={() => { onFileDelete(file.id) }}
                  >
                    <FontAwesomeIcon icon={faTrash} title="删除" size="lg" />
                  </button>
                </>
              }
              {((file.id === editStatus || file.isNew)) &&
                <>
                  <input ref={node} className="form-control col-10" value={value || ''}
                    onChange={(e) => { setValue(e.target.value) }}
                    placeholder="请输入文件名称"
                  />
                  <button type="button" className="icon-button col-2"
                    onClick={() => { closeSearch(file) }}
                  >
                    <FontAwesomeIcon icon={faTimes} title="关闭" size="lg" />
                  </button>
                </>

              }
            </li>
          )
        })
      }
    </ul >
  )
}

FileList.propTypes = {
  file: PropTypes.array,
  onFileClick: PropTypes.func,
  onFileDelete: PropTypes.func,
  onSaveEdit: PropTypes.func
}

export default FileList