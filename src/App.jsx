import { useState } from 'react'
import './App.css'

function App() {
  const [mode, setMode] = useState(null) // 'add' or 'remove'
  const [inputCode, setInputCode] = useState('')
  const [outputCode, setOutputCode] = useState('')

  const handleInputChange = (value) => {
    setInputCode(value)
    
    if (mode === 'add') {
      // Replace actual newlines with \n string and double quotes with single quotes
      const converted = value.replace(/\n/g, '\\n').replace(/"/g, "'")
      setOutputCode(converted)
    } else if (mode === 'remove') {
      // Replace \n string with actual newlines
      const converted = value.replace(/\\n/g, '\n')
      setOutputCode(converted)
    }
  }

  const handleModeSelect = (selectedMode) => {
    setMode(selectedMode)
    setInputCode('')
    setOutputCode('')
  }

  const handleBack = () => {
    setMode(null)
    setInputCode('')
    setOutputCode('')
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(outputCode)
      // .then(() => alert('Copied to clipboard!'))
      // .catch(err => alert('Failed to copy: ' + err))
  }

  if (!mode) {
    return (
      <div className="home-container">
        <h1>Code Formatter</h1>
        <p className="description">Convert your code between single-line and multi-line format</p>
        <div className="button-container">
          <button 
            className="mode-button add-button"
            onClick={() => handleModeSelect('add')}
          >
            Add \n
            <span className="button-desc">Convert multi-line code to single line with \n</span>
          </button>
          <button 
            className="mode-button remove-button"
            onClick={() => handleModeSelect('remove')}
          >
            Remove \n
            <span className="button-desc">Convert \n to actual new lines</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="editor-container">
      <div className="header">
        <button className="back-button" onClick={handleBack}>← Back</button>
        <h2>{mode === 'add' ? 'Add \\n' : 'Remove \\n'}</h2>
        <button className="copy-button" onClick={copyToClipboard}>Copy Output</button>
      </div>
      <div className="text-boxes">
        <div className="text-box-wrapper">
          <label>Input Code</label>
          <textarea
            className="text-box"
            value={inputCode}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={mode === 'add' ? 'Paste your multi-line code here...' : 'Paste your code with \\n here...'}
          />
        </div>
        <div className="text-box-wrapper">
          <label>Output Code</label>
          <textarea
            className="text-box"
            value={outputCode}
            readOnly
            placeholder="Converted code will appear here..."
          />
        </div>
      </div>
    </div>
  )
}

export default App
