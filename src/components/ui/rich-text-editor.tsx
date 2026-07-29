import React from 'react';
// @ts-ignore
import ReactQuill from 'react-quill-new';
// @ts-ignore
import 'quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  height?: string;
}

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block'],
    [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
    [{ 'align': [] }],
    [{ 'color': [] }, { 'background': [] }],
    ['link', 'image', 'video'],
    ['clean']
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block',
  'list', 'bullet', 'indent',
  'link', 'image', 'video', 'align', 'color', 'background'
];

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Enter content...",
  className = "",
  height = "200px"
}) => {
  return (
    <div className={`rich-text-editor-container ${className}`} style={{ minHeight: height }}>
      <ReactQuill 
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
      <style>{`
        .rich-text-editor-container {
           display: flex;
           flex-direction: column;
        }
        .rich-text-editor-container .quill {
           display: flex;
           flex-direction: column;
           flex: 1;
           min-height: ${height};
        }
        .rich-text-editor-container .ql-container {
           flex: 1;
           overflow-y: auto;
           border-bottom-left-radius: 0.375rem;
           border-bottom-right-radius: 0.375rem;
           border: 1px solid #d1d5db;
           border-top: none;
           min-height: 120px;
        }
        .rich-text-editor-container .ql-toolbar {
           border-top-left-radius: 0.375rem;
           border-top-right-radius: 0.375rem;
           border: 1px solid #d1d5db;
           background-color: #f9fafb;
        }
        .rich-text-editor-container .ql-editor {
           min-height: 100%;
        }
        /* Ensure images inside quill editor are responsive */
        .rich-text-editor-container .ql-editor img {
           max-width: 100%;
           height: auto;
        }
        /* Prevent browser scroll jump to hidden clipboard container during paste/focus */
        .rich-text-editor-container .ql-clipboard {
           position: fixed;
           opacity: 0;
           left: 50%;
           top: 50%;
           width: 1px;
           height: 1px;
           overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;