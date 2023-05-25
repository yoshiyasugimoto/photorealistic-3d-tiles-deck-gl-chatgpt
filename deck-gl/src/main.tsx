import React from 'react'
import ReactDOM from 'react-dom/client'
import ReactApp from './ReactApp'
import { ThreeApp } from './ThreeApp'
import 'normalize.css'
import './style.css'

const threeRoot = document.querySelector('main')
if (!threeRoot) throw new Error('Three canvas is None.')

const reactRoot = document.createElement('div')
threeRoot.appendChild(reactRoot)

const threeApp = new ThreeApp(threeRoot, reactRoot)

ReactDOM.createRoot(reactRoot).render(
  <React.StrictMode>
    <ReactApp threeApp={threeApp} />
  </React.StrictMode>
)
