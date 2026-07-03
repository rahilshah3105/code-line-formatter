import { useState } from 'react';
import ResourceLinks from '../components/ResourceLinks';
import './ToolPage.css';

const LOREM_WORDS = ["lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore", "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud", "exercitation", "ullamco", "laboris", "nisi", "ut", "aliquip", "ex", "ea", "commodo", "consequat", "duis", "aute", "irure", "dolor", "in", "reprehenderit", "in", "voluptate", "velit", "esse", "cillum", "dolore", "eu", "fugiat", "nulla", "pariatur", "excepteur", "sint", "occaecat", "cupidatat", "non", "proident", "sunt", "in", "culpa", "qui", "officia", "deserunt", "mollit", "anim", "id", "est", "laborum"];

export default function LoremIpsum() {
  const [paragraphs, setParagraphs] = useState(3);
  const [text, setText] = useState('');

  const generateLorem = () => {
    let result = [];
    for (let p = 0; p < paragraphs; p++) {
      let sentenceCount = Math.floor(Math.random() * 5) + 3; // 3 to 7 sentences per paragraph
      let paragraphStrings = [];
      for (let s = 0; s < sentenceCount; s++) {
        let wordCount = Math.floor(Math.random() * 10) + 5; // 5 to 14 words per sentence
        let sentenceWords = [];
        for (let w = 0; w < wordCount; w++) {
          sentenceWords.push(LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)]);
        }
        let sentence = sentenceWords.join(' ') + '.';
        sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
        paragraphStrings.push(sentence);
      }
      result.push(paragraphStrings.join(' '));
    }
    setText(result.join('\n\n'));
  };

  const copyToClipboard = () => {
    if (text) navigator.clipboard.writeText(text);
  };

  const resources = [
    { title: "What is Lorem Ipsum?", url: "https://lipsum.com/" }
  ];

  return (
    <div className="tool-page h-full flex flex-col overflow-y-auto">
      <header className="tool-header">
        <div>
          <h2>Lorem Ipsum Generator</h2>
          <p>Generate placeholder dummy text for your mockups.</p>
        </div>
        <div className="flex gap-2 items-center">
          <label className="text-sm text-[var(--text-secondary)]">Paragraphs:</label>
          <input
            type="number"
            min="1"
            max="50"
            value={paragraphs}
            onChange={(e) => setParagraphs(parseInt(e.target.value) || 1)}
            className="tool-number-input"
          />
          <button className="primary-button" onClick={generateLorem}>Generate</button>
          <button className="secondary-button" onClick={copyToClipboard}>Copy Output</button>
        </div>
      </header>

      <div className="flex-1 glass-panel rounded-xl overflow-hidden shadow border-[var(--border-light)] mb-4 p-6 custom-scrollbar overflow-y-auto text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed">
        {text ? text : <span className="opacity-40 italic h-full flex items-center justify-center">Click Generate to build placeholder text</span>}
      </div>

      <ResourceLinks links={resources} />
    </div>
  );
}
