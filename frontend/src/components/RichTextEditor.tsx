'use client';

import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

const QuillEditor = dynamic(() => import('react-quill'), { ssr: false });

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'code-block'],
    ['link'],
    ['clean'],
  ],
};

const formats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet',
  'blockquote', 'code-block',
  'link',
];

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  return (
    <div className="rich-text-editor">
      <QuillEditor
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
      />
      <style jsx global>{`
        .rich-text-editor .ql-toolbar {
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          border-color: #d1d5db;
          background: #f9fafb;
        }
        .dark .rich-text-editor .ql-toolbar {
          background: #374151;
          border-color: #4b5563;
        }
        .rich-text-editor .ql-container {
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
          border-color: #d1d5db;
          min-height: 120px;
          font-size: 0.875rem;
          background: #fff;
        }
        .dark .rich-text-editor .ql-container {
          background: #374151;
          border-color: #4b5563;
          color: #f3f4f6;
        }
        .rich-text-editor .ql-editor {
          min-height: 120px;
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }
        .dark .rich-text-editor .ql-toolbar .ql-stroke {
          stroke: #d1d5db;
        }
        .dark .rich-text-editor .ql-toolbar .ql-fill {
          fill: #d1d5db;
        }
        .dark .rich-text-editor .ql-toolbar .ql-picker {
          color: #d1d5db;
        }
        .dark .rich-text-editor .ql-toolbar .ql-picker-options {
          background: #374151;
          border-color: #4b5563;
        }
        .rich-text-editor .ql-container:focus-within {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }
      `}</style>
    </div>
  );
}
