import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [mode, setMode] = useState(null) // 'add', 'remove', or 'run'
  const [inputCode, setInputCode] = useState('')
  const [outputCode, setOutputCode] = useState('')
  const [logs, setLogs] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState({ input: [], output: [] })
  const [leftPanelWidth, setLeftPanelWidth] = useState(50) // Percentage
  const [isResizing, setIsResizing] = useState(false)

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

  const runCode = () => {
    const logOutput = []
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info
    }

    // Count lines for better error reporting
    const lines = inputCode.split('\n')
    const totalLines = lines.length

    // Override console methods to capture logs
    console.log = (...args) => {
      logOutput.push({
        type: 'log', message: args.map(arg =>
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ')
      })
      originalConsole.log(...args)
    }
    console.error = (...args) => {
      logOutput.push({
        type: 'error', message: args.map(arg =>
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ')
      })
      originalConsole.error(...args)
    }
    console.warn = (...args) => {
      logOutput.push({
        type: 'warn', message: args.map(arg =>
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ')
      })
      originalConsole.warn(...args)
    }
    console.info = (...args) => {
      logOutput.push({
        type: 'info', message: args.map(arg =>
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ')
      })
      originalConsole.info(...args)
    }

    try {
      // Try to execute the code
      logOutput.push({ type: 'info', message: '=== Code Execution Started ===' })
      logOutput.push({ type: 'info', message: `Total Lines: ${totalLines}` })
      logOutput.push({ type: 'info', message: `Code Length: ${inputCode.length} characters` })

      // Create a function from the code and execute it
      const func = new Function(inputCode)
      const result = func()

      if (result !== undefined) {
        logOutput.push({ type: 'log', message: `Return value: ${typeof result === 'object' ? JSON.stringify(result, null, 2) : result}` })
      }

      logOutput.push({ type: 'info', message: '=== Code Execution Completed ===' })
      logOutput.push({ type: 'success', message: '✓ No errors detected - Code executed successfully!' })
    } catch (error) {
      // Detailed error reporting
      logOutput.push({ type: 'info', message: '=== Code Execution Failed ===' })

      if (error instanceof SyntaxError) {
        logOutput.push({ type: 'error', message: '╔══════════════════════════════════════╗' })
        logOutput.push({ type: 'error', message: '║   COMPILE-TIME SYNTAX ERROR          ║' })
        logOutput.push({ type: 'error', message: '╚══════════════════════════════════════╝' })
        logOutput.push({ type: 'error', message: `Error Type: SyntaxError` })
        logOutput.push({ type: 'error', message: `Message: ${error.message}` })

        // Provide helpful context based on error message
        if (error.message.includes('import')) {
          logOutput.push({ type: 'warn', message: `\nℹ️  Context: ES6 import statements are not supported in this runtime.` })
          logOutput.push({ type: 'warn', message: `   Solution: Use require() or write plain JavaScript without imports.` })
          logOutput.push({ type: 'warn', message: `   Example: Instead of "import { x } from 'y'", use inline code.` })
        } else if (error.message.includes('Unexpected token')) {
          logOutput.push({ type: 'warn', message: `\nℹ️  Context: Invalid JavaScript syntax detected.` })
          logOutput.push({ type: 'warn', message: `   Solution: Check for missing brackets, quotes, or semicolons.` })
        } else if (error.message.includes('Unexpected identifier')) {
          logOutput.push({ type: 'warn', message: `\nℹ️  Context: Unexpected word or variable name found.` })
          logOutput.push({ type: 'warn', message: `   Solution: Check for typos or missing operators.` })
        }

        logOutput.push({ type: 'error', message: `\n📄 Code Info:` })
        logOutput.push({ type: 'error', message: `   - Total Lines: ${totalLines}` })
        logOutput.push({ type: 'error', message: `   - Character Count: ${inputCode.length}` })

      } else if (error instanceof ReferenceError) {
        logOutput.push({ type: 'error', message: '╔══════════════════════════════════════╗' })
        logOutput.push({ type: 'error', message: '║   RUNTIME REFERENCE ERROR            ║' })
        logOutput.push({ type: 'error', message: '╚══════════════════════════════════════╝' })
        logOutput.push({ type: 'error', message: `Error Type: ReferenceError` })
        logOutput.push({ type: 'error', message: `Message: ${error.message}` })
        logOutput.push({ type: 'warn', message: `\nℹ️  Context: Variable or function not defined.` })
        logOutput.push({ type: 'warn', message: `   Solution: Check spelling or define the variable before using it.` })

      } else if (error instanceof TypeError) {
        logOutput.push({ type: 'error', message: '╔══════════════════════════════════════╗' })
        logOutput.push({ type: 'error', message: '║   RUNTIME TYPE ERROR                 ║' })
        logOutput.push({ type: 'error', message: '╚══════════════════════════════════════╝' })
        logOutput.push({ type: 'error', message: `Error Type: TypeError` })
        logOutput.push({ type: 'error', message: `Message: ${error.message}` })
        logOutput.push({ type: 'warn', message: `\nℹ️  Context: Operation on incompatible type.` })
        logOutput.push({ type: 'warn', message: `   Solution: Verify data types and method availability.` })

      } else {
        logOutput.push({ type: 'error', message: '╔══════════════════════════════════════╗' })
        logOutput.push({ type: 'error', message: '║   RUNTIME ERROR                      ║' })
        logOutput.push({ type: 'error', message: '╚══════════════════════════════════════╝' })
        logOutput.push({ type: 'error', message: `Error Type: ${error.name || 'Unknown'}` })
        logOutput.push({ type: 'error', message: `Message: ${error.message}` })
      }

      // Stack trace
      if (error.stack) {
        logOutput.push({ type: 'error', message: `\n📚 Stack Trace:` })
        const stackLines = error.stack.split('\n').slice(0, 5) // Limit stack trace
        stackLines.forEach(line => {
          logOutput.push({ type: 'error', message: `   ${line.trim()}` })
        })
      }

      logOutput.push({ type: 'error', message: `\n❌ Execution failed - Please fix the errors and try again.` })
    } finally {
      // Restore original console methods
      console.log = originalConsole.log
      console.error = originalConsole.error
      console.warn = originalConsole.warn
      console.info = originalConsole.info
    }

    setLogs(logOutput)
  }

  const handleModeSelect = (selectedMode) => {
    setMode(selectedMode)
    setInputCode('')
    setOutputCode('')
    setLogs([])
    setSearchTerm('')
    setSearchResults({ input: [], output: [] })
  }

  const handleBack = () => {
    setMode(null)
    setInputCode('')
    setOutputCode('')
    setLogs([])
    setSearchTerm('')
    setSearchResults({ input: [], output: [] })
  }

  const clearLogs = () => {
    setLogs([])
  }

  const handleSearch = (term) => {
    setSearchTerm(term)

    if (!term) {
      setSearchResults({ input: [], output: [] })
      return
    }

    const inputMatches = []
    const outputMatches = []
    const searchLower = term.toLowerCase()

    // Search in input
    if (inputCode) {
      const inputLines = inputCode.split('\n')
      inputLines.forEach((line, index) => {
        if (line.toLowerCase().includes(searchLower)) {
          inputMatches.push({ line: index + 1, text: line })
        }
      })
    }

    // Search in output (for add/remove modes) or logs (for run mode)
    if (mode === 'run') {
      logs.forEach((log, index) => {
        if (log.message.toLowerCase().includes(searchLower)) {
          outputMatches.push({ line: index + 1, text: log.message, type: log.type })
        }
      })
    } else if (outputCode) {
      const outputLines = outputCode.split('\n')
      outputLines.forEach((line, index) => {
        if (line.toLowerCase().includes(searchLower)) {
          outputMatches.push({ line: index + 1, text: line })
        }
      })
    }

    setSearchResults({ input: inputMatches, output: outputMatches })
  }

  const handleMouseDown = (e) => {
    setIsResizing(true)
    e.preventDefault()
  }

  const handleMouseMove = (e) => {
    if (!isResizing) return

    const container = document.querySelector('.text-boxes')
    if (!container) return

    const containerRect = container.getBoundingClientRect()
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100

    // Limit between 20% and 80%
    if (newWidth >= 20 && newWidth <= 80) {
      setLeftPanelWidth(newWidth)
    }
  }

  const handleMouseUp = () => {
    setIsResizing(false)
  }

  // Add mouse move and up listeners
  useEffect(() => {
    const handleMove = (e) => handleMouseMove(e)
    const handleUp = () => handleMouseUp()

    if (isResizing) {
      document.addEventListener('mousemove', handleMove)
      document.addEventListener('mouseup', handleUp)

      return () => {
        document.removeEventListener('mousemove', handleMove)
        document.removeEventListener('mouseup', handleUp)
      }
    }
  }, [isResizing])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(outputCode)
      .then(() => {
        // Success - could add a toast notification here
      })
      .catch(err => console.error('Failed to copy:', err))
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
          <button
            className="mode-button run-button"
            onClick={() => handleModeSelect('run')}
          >
            Run Code
            <span className="button-desc">Execute JavaScript and see errors & logs</span>
          </button>
        </div>
      </div>
    )
  }

  if (mode === 'run') {
    return (
      <div className="editor-container">
        <div className="header">
          <button className="back-button" onClick={handleBack}>← Back</button>
          <h2>Run JavaScript Code</h2>
          <div className="header-actions">
            <input
              type="text"
              className="search-input"
              placeholder="🔍 Search in code & logs..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
            <button className="clear-button" onClick={clearLogs}>Clear Logs</button>
            <button className="run-button-header" onClick={runCode}>▶ Run</button>
          </div>
        </div>
        {searchTerm && (
          <div className="search-results-bar">
            <span>Found: {searchResults.input.length} in code, {searchResults.output.length} in logs</span>
          </div>
        )}
        <div className="text-boxes">
          <div className="text-box-wrapper" style={{ width: `${leftPanelWidth}%` }}>
            <label>JavaScript Code</label>
            <textarea
              className="text-box"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="Write or paste your JavaScript code here..."
            />
          </div>
          <div className="resize-handle" onMouseDown={handleMouseDown}>
            <div className="resize-line"></div>
          </div>
          <div className="text-box-wrapper" style={{ width: `${100 - leftPanelWidth}%` }}>
            <label>Output & Logs</label>
            <div className="logs-container">
              {logs.length === 0 ? (
                <div className="logs-placeholder">Click "Run" to execute code and see output...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className={`log-entry log-${log.type}`}>
                    <span className="log-type">[{log.type.toUpperCase()}]</span>
                    <span className="log-message">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="editor-container">
      <div className="header">
        <button className="back-button" onClick={handleBack}>← Back</button>
        <h2>{mode === 'add' ? 'Add \\n' : 'Remove \\n'}</h2>
        <div className="header-actions">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Search..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <button className="copy-button" onClick={copyToClipboard}>Copy Output</button>
        </div>
      </div>
      {searchTerm && (
        <div className="search-results-bar">
          <span>Found: {searchResults.input.length} in input, {searchResults.output.length} in output</span>
        </div>
      )}
      <div className="text-boxes">
        <div className="text-box-wrapper" style={{ width: `${leftPanelWidth}%` }}>
          <label>Input Code</label>
          <textarea
            className="text-box"
            value={inputCode}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder={mode === 'add' ? 'Paste your multi-line code here...' : 'Paste your code with \\n here...'}
          />
        </div>
        <div className="resize-handle" onMouseDown={handleMouseDown}>
          <div className="resize-line"></div>
        </div>
        <div className="text-box-wrapper" style={{ width: `${100 - leftPanelWidth}%` }}>
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
