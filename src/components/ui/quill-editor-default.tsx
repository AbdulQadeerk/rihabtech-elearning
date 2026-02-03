import React, { useRef, useEffect, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

interface QuillEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  height?: string;
  error?: boolean;
  maxLength?: number; // optional prop
}

const QuillEditor: React.FC<QuillEditorProps> = ({
  value,
  onChange,
  placeholder = "Enter content...",
  height = "200px",
  error = false,
  maxLength = 10000 // default to 10000 characters
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [htmlLength, setHtmlLength] = useState(0);
  const lastValidHtmlRef = useRef<string>('');

  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
        placeholder: placeholder,
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ align: [] }],
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

      // Set initial content
      if (value) {
        quillRef.current.root.innerHTML = value;
        setHtmlLength(value.length);
        lastValidHtmlRef.current = value;
      } else {
        setHtmlLength(0);
        lastValidHtmlRef.current = '';
      }

      // ✅ Character limit logic - count HTML string length (including tags) to match API validation
      quillRef.current.on('text-change', (delta, oldDelta, source) => {
        if (quillRef.current) {
          const html = quillRef.current.root.innerHTML;
          const currentHtmlLength = html.length;
          
          // Enforce limit: if HTML string exceeds maxLength, revert to last valid HTML
          if (currentHtmlLength > maxLength) {
            // Revert to last valid HTML
            quillRef.current.root.innerHTML = lastValidHtmlRef.current;
            setHtmlLength(lastValidHtmlRef.current.length);
            return; // Don't call onChange if we reverted
          }
          
          // Update last valid HTML and counter
          lastValidHtmlRef.current = html;
          setHtmlLength(currentHtmlLength);
          
          // Call onChange with valid HTML
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

  // Update content if value changes from outside
  useEffect(() => {
    if (quillRef.current && isInitialized && value !== quillRef.current.root.innerHTML) {
      const newValue = value || '';
      quillRef.current.root.innerHTML = newValue;
      setHtmlLength(newValue.length);
      lastValidHtmlRef.current = newValue;
    }
  }, [value, isInitialized]);

  return (
    <div 
      className={`quill-editor ${error ? 'border-red-500' : 'border-gray-300'} border rounded-lg`}
      style={{ width: '100%' }}
    >
      <div
        ref={editorRef}
        style={{ 
          height: `calc(${height} - 42px)`,
          width: '100%'
        }}
      />
      <div className="text-sm text-gray-500 text-right mt-1 pr-2">
        {isInitialized && quillRef.current ? `${htmlLength}/${maxLength}` : `${(value || '').length}/${maxLength}`}
      </div>
    </div>
  );
};

export default QuillEditor;
