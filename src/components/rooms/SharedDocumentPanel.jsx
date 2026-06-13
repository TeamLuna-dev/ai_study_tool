import { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Image, Presentation, File, FolderOpen,
  Loader2, ChevronDown, Plus, Library,
} from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { shareExistingDocument } from '../../services/roomService';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

/**
 * Panel displaying shared documents in the room.
 * Supports sharing from user's document library and preview cards
 * with PDF thumbnails / image previews.
 */
export function SharedDocumentPanel({
  documents, roomId, user,
  userDocuments = [], userDocsLoading = false,
}) {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [uploadError, setUploadError] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sharing, setSharing] = useState(null); // sourceDocId currently being shared

  // Close dropdown on outside click
  const handleClickOutside = useCallback((e) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setDropdownOpen(false);
    }
  }, []);

  useEffect(() => {
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen, handleClickOutside]);

  const handleShareFromLibrary = async (sourceDocId) => {
    setSharing(sourceDocId);
    setUploadError(null);
    try {
      await shareExistingDocument(roomId, sourceDocId, user);
      setDropdownOpen(false);
    } catch (err) {
      setUploadError(err.message ?? 'Failed to share document.');
    } finally {
      setSharing(null);
    }
  };

  const getFileIcon = (fileType) => {
    const icons = {
      pdf: FileText,
      docx: FileText,
      pptx: Presentation,
      png: Image,
      jpg: Image,
    };
    return icons[fileType] || File;
  };

  const getFileColor = (fileType) => {
    const colors = {
      pdf: "text-red-500 bg-red-50 dark:bg-red-900/20",
      docx: "text-blue-500 bg-blue-50 dark:bg-blue-900/20",
      pptx: "text-orange-500 bg-orange-50 dark:bg-orange-900/20",
      png: "text-purple-500 bg-purple-50 dark:bg-purple-900/20",
      jpg: "text-purple-500 bg-purple-50 dark:bg-purple-900/20",
    };
    return colors[fileType] || "text-gray-500 bg-gray-50 dark:bg-gray-800";
  };

  const isImageType = (fileType) => ['png', 'jpg', 'jpeg'].includes(fileType);

  return (
    <div className="
        rounded-2xl border p-5 lg:p-6
        border-gray-200 bg-white
        dark:border-gray-700 dark:bg-gray-900
        shadow-sm transition-colors
      ">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Shared Documents</h3>

        {/* Select Files Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            disabled={!user?.uid}
            className="
              flex items-center gap-1 text-sm font-medium transition
              text-blue-600 hover:text-blue-700
              dark:text-blue-400 dark:hover:text-blue-300
              disabled:cursor-not-allowed disabled:opacity-50
            "
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Select Files</span>
            <ChevronDown className={`h-3 w-3 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="
                absolute right-0 top-full z-20 mt-1 w-64 rounded-xl border
                border-gray-200 bg-white shadow-lg
                dark:border-gray-700 dark:bg-gray-800
                max-h-72 overflow-y-auto
              ">
              {/* Navigate to library upload page */}
              <button
                onClick={() => { setDropdownOpen(false); navigate('/file-upload'); }}
                className="
                  flex w-full items-center gap-2 px-3 py-2.5 text-sm
                  text-gray-700 hover:bg-gray-50
                  dark:text-gray-200 dark:hover:bg-gray-700
                  border-b border-gray-100 dark:border-gray-700
                  transition
                "
              >
                <Library className="h-4 w-4 text-indigo-500" />
                Upload to Library
              </button>

              {/* User's library documents */}
              {userDocsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              ) : userDocuments.length === 0 ? (
                <p className="px-3 py-3 text-xs text-gray-400 dark:text-gray-500 text-center">
                  No documents in your library
                </p>
              ) : (
                <>
                  <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    Your Library
                  </p>
                  {userDocuments.map((libDoc) => {
                    const Icon = getFileIcon(libDoc.fileType);
                    const isSharing = sharing === libDoc.id;
                    return (
                      <button
                        key={libDoc.id}
                        onClick={() => handleShareFromLibrary(libDoc.id)}
                        disabled={isSharing}
                        className="
                          flex w-full items-center gap-2 px-3 py-2 text-sm
                          text-gray-700 hover:bg-gray-50
                          dark:text-gray-200 dark:hover:bg-gray-700
                          disabled:opacity-50 transition
                        "
                      >
                        {isSharing ? (
                          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        ) : (
                          <Icon className="h-4 w-4 flex-shrink-0 text-gray-400" />
                        )}
                        <span className="truncate">{libDoc.fileName}</span>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Inline upload error */}
      {uploadError && (
        <p className="
            mb-3 rounded-lg border px-3 py-2 text-xs
            border-red-300 bg-red-50 text-red-700
            dark:border-red-800 dark:bg-red-900/20 dark:text-red-300
          ">
          {uploadError}
        </p>
      )}

      {/* Document Preview Grid or Empty State */}
      {documents.length === 0 ? (
        <div className="text-center py-8">
          <div className="
              mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full
              bg-gray-100 dark:bg-gray-800
            ">
            <FolderOpen className="h-6 w-6 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">No documents shared yet</p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Upload a file to share with your group</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {documents.map((doc) => {
            const Icon = getFileIcon(doc.fileType);
            const colorClass = getFileColor(doc.fileType);

            return (
              <a
                key={doc.id}
                href={doc.storageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  group block rounded-xl border p-2 transition
                  border-gray-200 hover:border-gray-300 hover:shadow-sm
                  dark:border-gray-700 dark:hover:border-gray-600
                "
              >
                {/* Preview area */}
                <div className="
                    mb-2 flex h-28 items-center justify-center overflow-hidden rounded-lg
                    bg-gray-50 dark:bg-gray-800
                  ">
                  {doc.fileType === 'pdf' && doc.storageUrl ? (
                    <Document
                      file={doc.storageUrl}
                      loading={<Loader2 className="h-5 w-5 animate-spin text-gray-400" />}
                      error={<Icon className={`h-8 w-8 ${colorClass.split(' ')[0]}`} />}
                    >
                      <Page
                        pageNumber={1}
                        width={140}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                      />
                    </Document>
                  ) : isImageType(doc.fileType) && doc.storageUrl ? (
                    <img
                      src={doc.storageUrl}
                      alt={doc.fileName}
                      className="h-full w-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className={`w-12 h-12 rounded-lg ${colorClass} flex items-center justify-center`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  )}
                </div>

                {/* File info */}
                <p className="truncate text-xs font-medium text-gray-900 dark:text-gray-100">
                  {doc.fileName}
                </p>
                <p className="truncate text-[10px] text-gray-400 dark:text-gray-500">
                  {doc.uploaderName}
                </p>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
