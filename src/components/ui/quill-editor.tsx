import React, { useRef, useEffect, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import './quill-editor.css';

interface QuillEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  height?: string;
  error?: boolean;
}

const QuillEditor: React.FC<QuillEditorProps> = ({
  value,
  onChange,
  placeholder = "Enter content...",
  height = "200px",
  error = false
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      // Initialize Quill
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
        placeholder: placeholder,
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'align': [] }],
            ['blockquote', 'code-block'],
            ['link'],
            ['clean']
          ],
        },
        formats: [
          'header', 'bold', 'italic', 'underline', 'strike',
          'list', 'bullet', 'align', 'blockquote', 'code-block', 'link'
        ]
      });

      // Configure the editor for proper text wrapping
      if (quillRef.current) {
        const editor = quillRef.current;
        const editorElement = editor.root;
        const container = editor.container;
        
        // Set CSS properties for proper text wrapping
        editorElement.style.wordWrap = 'break-word';
        editorElement.style.whiteSpace = 'pre-wrap';
        editorElement.style.overflowWrap = 'break-word';
        editorElement.style.wordBreak = 'break-word';
        editorElement.style.maxWidth = '100%';
        editorElement.style.width = '100%';
        editorElement.style.boxSizing = 'border-box';
        editorElement.style.overflowX = 'hidden';
        editorElement.style.overflowY = 'auto';
        
        // Also configure the container
        if (container) {
          container.style.width = '100%';
          container.style.maxWidth = '100%';
          container.style.overflow = 'hidden';
        }
        
        // Force a re-render to apply styles
        setTimeout(() => {
          if (editorElement) {
            editorElement.style.wordWrap = 'break-word';
            editorElement.style.overflowWrap = 'break-word';
            editorElement.style.wordBreak = 'break-word';
          }
        }, 100);
      }

      // Set initial content
      if (value) {
        quillRef.current.root.innerHTML = value;
      }

      // Listen for text changes
      quillRef.current.on('text-change', () => {
        if (quillRef.current) {
          const html = quillRef.current.root.innerHTML;
          onChange(html);
        }
      });

      setIsInitialized(true);
    }

    return () => {
      if (quillRef.current) {
        quillRef.current = null;
      }
    };
  }, []);

  // Update content when value prop changes
  useEffect(() => {
    if (quillRef.current && isInitialized && value !== quillRef.current.root.innerHTML) {
      quillRef.current.root.innerHTML = value;
      
      // Reapply text wrapping styles after content update
      setTimeout(() => {
        if (quillRef.current) {
          const editorElement = quillRef.current.root;
          editorElement.style.wordWrap = 'break-word';
          editorElement.style.overflowWrap = 'break-word';
          editorElement.style.wordBreak = 'break-word';
          editorElement.style.maxWidth = '100%';
          editorElement.style.width = '100%';
          editorElement.style.overflowX = 'hidden';
        }
      }, 50);
    }
  }, [value, isInitialized]);

  return (
    <div 
      className={`quill-editor ${error ? 'border-red-500' : 'border-gray-300'} border rounded-lg`}
      style={{ height: height }}
    >
      <div 
        ref={editorRef}
        style={{ 
          height: `calc(${height} - 42px)`,
          overflowY: 'auto',
          overflowX: 'hidden',
          wordWrap: 'break-word',
          whiteSpace: 'pre-wrap'
        }}
      />
    </div>
  );
};

export default QuillEditor;
