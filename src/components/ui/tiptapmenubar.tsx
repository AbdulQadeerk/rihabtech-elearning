

// Add this Tiptap menu component
export const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="border-b p-2 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1 px-2 ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
      >
        bold
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1 px-2 ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
      >
        italic
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`p-1 px-2 ${editor.isActive('underline') ? 'bg-gray-200' : ''}`}
      >
        underline
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={`p-1 px-2 ${editor.isActive('paragraph') ? 'bg-gray-200' : ''}`}
      >
        paragraph
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-1 px-2 ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}`}
      >
        h1
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-1 px-2 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}`}
      >
        h2
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1 px-2 ${editor.isActive('bulletList') ? 'bg-gray-200' : ''}`}
      >
        bullet list
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1 px-2 ${editor.isActive('orderedList') ? 'bg-gray-200' : ''}`}
      >
        ordered list
      </button>
    </div>
  );
};