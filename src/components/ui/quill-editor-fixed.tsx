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
      // Initialize Quill with minimal configuration
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

      // Ensure toolbar remains visible
      if (quillRef.current) {
        const toolbar = quillRef.current.getModule('toolbar');
        if (toolbar) {
          // Force toolbar to remain visible
          const toolbarElement = quillRef.current.container.querySelector('.ql-toolbar') as HTMLElement;
          const editorElement = quillRef.current.root;
          
          if (toolbarElement) {
            toolbarElement.style.position = 'sticky';
            toolbarElement.style.top = '0';
            toolbarElement.style.zIndex = '10';
            toolbarElement.style.backgroundColor = 'white';
          }
          
          // Ensure content area has proper top padding
          if (editorElement) {
            editorElement.style.paddingTop = '60px';
            editorElement.style.minHeight = '120px';
          }
        }
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
    }
  }, [value, isInitialized]);

  return (
    <div 
      className={`quill-editor-wrapper ${error ? 'border-red-500' : 'border-gray-300'} border rounded-lg`}
      style={{ 
        height: height,
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden'
      }}
    >
      <div 
        ref={editorRef}
        style={{ 
          height: `calc(${height} - 42px)`,
          width: '100%',
          maxWidth: '100%',
          overflow: 'hidden'
        }}
      />
    </div>
  );
};

export default QuillEditor;
