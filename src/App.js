import React from 'react';
import { faPlus, faFileImport } from '@fortawesome/free-solid-svg-icons'
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css'
import FileSearch from './components/FileSearch'
import FileList from './components/FileList'
import BottonBtn from './components/BottomBtn'
import defaultFiles from './utils/defaultFiles'
import TabList from './components/TabList'
function App() {
  return (
    <div className="App container-fluid px-0">
      <div className="row no-gutters">
        <div className="col-3 bg-light left-panel">
          <FileSearch onFileSearch={(value) => { console.log(value) }} />
          <FileList
            files={defaultFiles}
            onFileClick={(id) => { console.log(id) }}
            onFileDelete={(id) => { console.log(id) }}
            onSaveEdit={(id, value) => { console.log(id); console.log(value) }}
          />
          <div className="row no-gutters">
            <div className="col">
              <BottonBtn
                text="新建"
                colorClass="btn-primary"
                icon={faPlus}
              />
            </div>
            <div className="col">
              <BottonBtn
                text="导入"
                colorClass="btn-success"
                icon={faFileImport}
              />
            </div>
          </div>
        </div>
        <div className="col-9 right-panel">
          <TabList files={defaultFiles}
            activeId="1"
            onTabClick={(id) => { console.log(id) }}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
