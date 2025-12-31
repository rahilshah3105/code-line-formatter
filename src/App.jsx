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
      // Properly escape for JSON payload while preserving original code structure
      let converted = value
        // Remove whitespace around newlines first
        .replace(/[ \t]*\n[ \t]*/g, '\n')
        // Now do JSON escaping in the correct order:
        // 1. Escape backslashes (MUST be first to avoid double-escaping)
        .replace(/\\/g, '\\\\')
        // 2. Escape double quotes
        .replace(/"/g, '\\"')
        // 3. Convert actual newlines to \n
        .replace(/\n/g, '\\n')
        // 4. Escape control characters that break JSON
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t')
        .replace(/\f/g, '\\f')


      setOutputCode(converted)
    } else if (mode === 'remove') {
      // Reverse the escaping: convert \n back to actual newlines and unescape
      try {
        // Try using JSON.parse for proper unescaping
        const converted = JSON.parse('"' + value + '"')
        setOutputCode(converted)
      } catch (e) {
        // If JSON parsing fails, do manual unescaping in reverse order
        let converted = value
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\f/g, '\f')

          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\') // Unescape backslashes last
        setOutputCode(converted)
      }
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

      let func, result
      let syntaxErrorInfo = null

      // Try to detect syntax errors with better line tracking
      try {
        // For better syntax error line detection, use eval with sourceURL
        const wrappedCode = `(function(){\n${inputCode}\n})();\n//# sourceURL=user-code.js`
        result = eval(wrappedCode)
      } catch (evalError) {
        // If eval fails, try Function constructor as fallback
        if (evalError instanceof SyntaxError) {
          syntaxErrorInfo = evalError
          // Try to extract line number from syntax error message
          const lineMatch = evalError.message.match(/line (\d+)/i)
          if (lineMatch) {
            syntaxErrorInfo.detectedLine = parseInt(lineMatch[1])
          }
          throw evalError
        }
        func = new Function(inputCode)
        result = func()
      }

      if (result !== undefined) {
        logOutput.push({ type: 'log', message: `Return value: ${typeof result === 'object' ? JSON.stringify(result, null, 2) : result}` })
      }

      logOutput.push({ type: 'info', message: '=== Code Execution Completed ===' })
      logOutput.push({ type: 'success', message: '✓ No errors detected - Code executed successfully!' })
    } catch (error) {
      // Enhanced line number extraction
      const extractLineNumber = (stack, errorMsg) => {
        if (!stack) return null

        // Try multiple patterns to extract line numbers
        let match

        // Pattern 1: <anonymous>:line:column
        match = stack.match(/<anonymous>:(\d+):(\d+)/)
        if (match) {
          return { line: parseInt(match[1]), column: parseInt(match[2]) }
        }

        // Pattern 2: user-code.js:line:column
        match = stack.match(/user-code\.js:(\d+):(\d+)/)
        if (match) {
          // Adjust for wrapped code (subtract 1 for the wrapper function line)
          return { line: Math.max(1, parseInt(match[1]) - 1), column: parseInt(match[2]) }
        }

        // Pattern 3: eval at line
        match = stack.match(/eval.*?:(\d+):(\d+)/)
        if (match) {
          return { line: parseInt(match[1]), column: parseInt(match[2]) }
        }

        // Pattern 4: Check error message for line info
        if (errorMsg) {
          match = errorMsg.match(/line (\d+)/i)
          if (match) {
            return { line: parseInt(match[1]), column: null }
          }
        }

        return null
      }

      const lineInfo = extractLineNumber(error.stack, error.message)
      let errorLine = lineInfo ? lineInfo.line : null
      let errorColumn = lineInfo ? lineInfo.column : null

      // For syntax errors in single-line code, try to find the position
      if (error instanceof SyntaxError && totalLines === 1 && !errorLine) {
        // Try to parse the error message for position hints
        const posMatch = error.message.match(/position (\d+)/)
        if (posMatch) {
          errorColumn = parseInt(posMatch[1])
          errorLine = 1
        }
      }

      // Get the actual line of code that caused the error
      let problematicCode = null
      if (errorLine && errorLine <= lines.length) {
        problematicCode = lines[errorLine - 1]
      }

      // Detailed error reporting
      logOutput.push({ type: 'info', message: '=== Code Execution Failed ===' })

      if (error instanceof SyntaxError) {
        logOutput.push({ type: 'error', message: '╔══════════════════════════════════════╗' })
        logOutput.push({ type: 'error', message: '║   COMPILE-TIME SYNTAX ERROR          ║' })
        logOutput.push({ type: 'error', message: '╚══════════════════════════════════════╝' })
        logOutput.push({ type: 'error', message: `Error Type: SyntaxError` })
        logOutput.push({ type: 'error', message: `Message: ${error.message}` })

        // Special handling for single-line code
        if (totalLines === 1) {
          logOutput.push({ type: 'warn', message: `\n⚠️  Note: Code appears to be on a single line (${inputCode.length} characters)` })
          logOutput.push({ type: 'warn', message: `   This makes it difficult to pinpoint the exact error location.` })
          logOutput.push({ type: 'warn', message: `   Tip: If you used "Add \\n", try using "Remove \\n" first to see the code properly formatted.` })

          // Try to show the problematic area
          if (errorColumn) {
            const start = Math.max(0, errorColumn - 40)
            const end = Math.min(inputCode.length, errorColumn + 40)
            const snippet = inputCode.substring(start, end)
            const pointerPos = errorColumn - start

            logOutput.push({ type: 'error', message: `\n📍 Error near position ${errorColumn}:` })
            logOutput.push({ type: 'error', message: `   ...${snippet}...` })
            logOutput.push({ type: 'error', message: `   ${' '.repeat(pointerPos + 3)}^` })
          } else {
            // Show first part of the code
            const preview = inputCode.length > 100 ? inputCode.substring(0, 100) + '...' : inputCode
            logOutput.push({ type: 'error', message: `\n📝 Code Preview:` })
            logOutput.push({ type: 'error', message: `   ${preview}` })
          }
        } else if (errorLine) {
          logOutput.push({ type: 'error', message: `\n📍 Error Location:` })
          logOutput.push({ type: 'error', message: `   Line: ${errorLine}${errorColumn ? `, Column: ${errorColumn}` : ''}` })

          if (problematicCode) {
            logOutput.push({ type: 'error', message: `\n📝 Problematic Code:` })
            logOutput.push({ type: 'error', message: `   ${errorLine} | ${problematicCode.trim()}` })
            if (errorColumn) {
              const pointer = ' '.repeat(String(errorLine).length + 3 + errorColumn) + '^'
              logOutput.push({ type: 'error', message: pointer })
            }
          }
        } else {
          logOutput.push({ type: 'warn', message: `\n⚠️  Could not determine exact line number from error` })
          // Show first few lines anyway
          logOutput.push({ type: 'error', message: `\n📝 Code Preview (first 5 lines):` })
          for (let i = 0; i < Math.min(5, totalLines); i++) {
            logOutput.push({ type: 'error', message: `   ${i + 1} | ${lines[i]}` })
          }
        }

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

        if (errorLine) {
          logOutput.push({ type: 'error', message: `\n📍 Error Location:` })
          logOutput.push({ type: 'error', message: `   Line: ${errorLine}${errorColumn ? `, Column: ${errorColumn}` : ''}` })

          if (problematicCode) {
            logOutput.push({ type: 'error', message: `\n📝 Problematic Code:` })
            logOutput.push({ type: 'error', message: `   ${errorLine} | ${problematicCode.trim()}` })
            if (errorColumn) {
              const pointer = ' '.repeat(String(errorLine).length + 3 + errorColumn) + '^'
              logOutput.push({ type: 'error', message: pointer })
            }
          }
        }

        logOutput.push({ type: 'warn', message: `\nℹ️  Context: Variable or function not defined.` })
        logOutput.push({ type: 'warn', message: `   Solution: Check spelling or define the variable before using it.` })

        // Try to extract the undefined variable name
        const varMatch = error.message.match(/(\w+) is not defined/)
        if (varMatch) {
          logOutput.push({ type: 'warn', message: `   Undefined: "${varMatch[1]}"` })
        }

      } else if (error instanceof TypeError) {
        logOutput.push({ type: 'error', message: '╔══════════════════════════════════════╗' })
        logOutput.push({ type: 'error', message: '║   RUNTIME TYPE ERROR                 ║' })
        logOutput.push({ type: 'error', message: '╚══════════════════════════════════════╝' })
        logOutput.push({ type: 'error', message: `Error Type: TypeError` })
        logOutput.push({ type: 'error', message: `Message: ${error.message}` })

        if (errorLine) {
          logOutput.push({ type: 'error', message: `\n📍 Error Location:` })
          logOutput.push({ type: 'error', message: `   Line: ${errorLine}${errorColumn ? `, Column: ${errorColumn}` : ''}` })

          if (problematicCode) {
            logOutput.push({ type: 'error', message: `\n📝 Problematic Code:` })
            logOutput.push({ type: 'error', message: `   ${errorLine} | ${problematicCode.trim()}` })
            if (errorColumn) {
              const pointer = ' '.repeat(String(errorLine).length + 3 + errorColumn) + '^'
              logOutput.push({ type: 'error', message: pointer })
            }
          }
        }

        logOutput.push({ type: 'warn', message: `\nℹ️  Context: Operation on incompatible type.` })
        logOutput.push({ type: 'warn', message: `   Solution: Verify data types and method availability.` })

      } else {
        logOutput.push({ type: 'error', message: '╔══════════════════════════════════════╗' })
        logOutput.push({ type: 'error', message: '║   RUNTIME ERROR                      ║' })
        logOutput.push({ type: 'error', message: '╚══════════════════════════════════════╝' })
        logOutput.push({ type: 'error', message: `Error Type: ${error.name || 'Unknown'}` })
        logOutput.push({ type: 'error', message: `Message: ${error.message}` })

        if (errorLine) {
          logOutput.push({ type: 'error', message: `\n📍 Error Location:` })
          logOutput.push({ type: 'error', message: `   Line: ${errorLine}${errorColumn ? `, Column: ${errorColumn}` : ''}` })

          if (problematicCode) {
            logOutput.push({ type: 'error', message: `\n📝 Problematic Code:` })
            logOutput.push({ type: 'error', message: `   ${errorLine} | ${problematicCode.trim()}` })
            if (errorColumn) {
              const pointer = ' '.repeat(String(errorLine).length + 3 + errorColumn) + '^'
              logOutput.push({ type: 'error', message: pointer })
            }
          }
        }
      }

      // Enhanced Stack trace with context
      if (error.stack) {
        logOutput.push({ type: 'error', message: `\n📚 Full Stack Trace:` })
        const stackLines = error.stack.split('\n').slice(0, 8)
        stackLines.forEach(line => {
          logOutput.push({ type: 'error', message: `   ${line.trim()}` })
        })
      }

      // Show context around error line
      if (errorLine && errorLine > 1) {
        logOutput.push({ type: 'info', message: `\n📖 Code Context:` })

        const startLine = Math.max(1, errorLine - 2)
        const endLine = Math.min(totalLines, errorLine + 2)

        for (let i = startLine; i <= endLine; i++) {
          const lineCode = lines[i - 1]
          const prefix = i === errorLine ? '❌' : '  '
          logOutput.push({
            type: i === errorLine ? 'error' : 'info',
            message: `   ${prefix} ${i} | ${lineCode}`
          })
        }
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

  const highlightText = (text, searchTerm) => {
    if (!searchTerm) return text

    const parts = []
    const lowerText = text.toLowerCase()
    const lowerSearch = searchTerm.toLowerCase()
    let lastIndex = 0

    let index = lowerText.indexOf(lowerSearch)
    while (index !== -1) {
      // Add text before match
      if (index > lastIndex) {
        parts.push({ text: text.substring(lastIndex, index), highlight: false })
      }
      // Add matched text
      parts.push({ text: text.substring(index, index + searchTerm.length), highlight: true })
      lastIndex = index + searchTerm.length
      index = lowerText.indexOf(lowerSearch, lastIndex)
    }
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({ text: text.substring(lastIndex), highlight: false })
    }

    return parts
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
          inputMatches.push({ line: index + 1, text: line, highlighted: highlightText(line, term) })
        }
      })
    }

    // Search in output (for add/remove modes) or logs (for run mode)
    if (mode === 'run') {
      logs.forEach((log, index) => {
        if (log.message.toLowerCase().includes(searchLower)) {
          outputMatches.push({
            line: index + 1,
            text: log.message,
            type: log.type,
            highlighted: highlightText(log.message, term)
          })
        }
      })
    } else if (outputCode) {
      const outputLines = outputCode.split('\n')
      outputLines.forEach((line, index) => {
        if (line.toLowerCase().includes(searchLower)) {
          outputMatches.push({ line: index + 1, text: line, highlighted: highlightText(line, term) })
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
            {searchTerm && searchResults.input.length > 0 ? (
              <div className="search-results-container">
                {searchResults.input.map((match, idx) => (
                  <div key={idx} className="search-result-item">
                    <span className="result-line-number">Line {match.line}:</span>
                    <div className="result-text">
                      {match.highlighted.map((part, i) => (
                        <span key={i} className={part.highlight ? 'highlight' : ''}>
                          {part.text}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
                <textarea
                  className="text-box"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="Write or paste your JavaScript code here..."
                />
            )}
          </div>
          <div className="resize-handle" onMouseDown={handleMouseDown}>
            <div className="resize-line"></div>
          </div>
          <div className="text-box-wrapper" style={{ width: `${100 - leftPanelWidth}%` }}>
            <label>Output & Logs</label>
            {searchTerm && searchResults.output.length > 0 ? (
              <div className="search-results-container">
                {searchResults.output.map((match, idx) => (
                  <div key={idx} className="search-result-item">
                    <span className="result-line-number">Log {match.line}:</span>
                    <div className="result-text">
                      {match.highlighted.map((part, i) => (
                        <span key={i} className={part.highlight ? 'highlight' : ''}>
                          {part.text}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
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
            )}
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
          {searchTerm && searchResults.input.length > 0 ? (
            <div className="search-results-container">
              {searchResults.input.map((match, idx) => (
                <div key={idx} className="search-result-item">
                  <span className="result-line-number">Line {match.line}:</span>
                  <div className="result-text">
                    {match.highlighted.map((part, i) => (
                      <span key={i} className={part.highlight ? 'highlight' : ''}>
                        {part.text}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
              <textarea
                className="text-box"
                value={inputCode}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder={mode === 'add' ? 'Paste your multi-line code here...' : 'Paste your code with \\n here...'}
              />
          )}
        </div>
        <div className="resize-handle" onMouseDown={handleMouseDown}>
          <div className="resize-line"></div>
        </div>
        <div className="text-box-wrapper" style={{ width: `${100 - leftPanelWidth}%` }}>
          <label>Output Code</label>
          {searchTerm && searchResults.output.length > 0 ? (
            <div className="search-results-container">
              {searchResults.output.map((match, idx) => (
                <div key={idx} className="search-result-item">
                  <span className="result-line-number">Line {match.line}:</span>
                  <div className="result-text">
                    {match.highlighted.map((part, i) => (
                      <span key={i} className={part.highlight ? 'highlight' : ''}>
                        {part.text}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
              <textarea
                className="text-box"
                value={outputCode}
                readOnly
                placeholder="Converted code will appear here..."
              />
          )}
        </div>
      </div>
    </div>
  )
}

export default App
