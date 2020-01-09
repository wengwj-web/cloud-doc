import React from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css'
import FileSearch from './components/FileSearch'
import FileList from './components/FileList'
import defaultFiles from './utils/defaultFiles'

function App() {
  return (
    <div className="App container-fluid">
      <div className="row">
        <div className="col bg-light left-panel">
          <FileSearch onFileSearch={(value) => { console.log(value) }} />
          <FileList files={defaultFiles}/>
        </div>
        <div className="col bg-primary right-panel">
            <h1>this is right</h1>
          </div>
        </div>
      </div>
      );
    }
    
    export default App;
