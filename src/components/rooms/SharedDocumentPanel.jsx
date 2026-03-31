import { useRef, useState } from 'react';
import { FileText, Image, Presentation, File, Upload, FolderOpen, Loader2 } from 'lucide-react';
import { uploadRoomDocument } from '../../services/roomService';

const ACCEPTED_FILE_TYPES = '.pdf,.pptx,.docx,.png,.jpg,.jpeg';

/**
 * Panel displaying shared documents in the room.
 * Single responsibility: list documents and trigger room-scoped uploads.
 * No Firebase imports — all storage/Firestore calls go through roomService.
 */
export function SharedDocumentPanel({ documents, roomId, user }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const handleUploadClick = () => {
    if (!uploading && user?.uid) {
      setUploadError(null);
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    // Reset the input so the same file can be re-selected after an error
    e.target.value = '';
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    try {
      await uploadRoomDocument(roomId, file, user);
      // The onSnapshot listener in useRoomDetail updates the list automatically
    } catch (err) {
      setUploadError(err.message ?? 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
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
      pdf: 'text-red-500 bg-red-50',
      docx: 'text-blue-500 bg-blue-50',
      pptx: 'text-orange-500 bg-orange-50',
      png: 'text-purple-500 bg-purple-50',
      jpg: 'text-purple-500 bg-purple-50',
    };
    return colors[fileType] || 'text-gray-500 bg-gray-50';
  };

  const formatTime = (date) => {
    return date instanceof Date
      ? date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      : '';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Shared Documents</h3>
        <button
          onClick={handleUploadClick}
          disabled={uploading || !user?.uid}
          className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">{uploading ? 'Uploading…' : 'Upload'}</span>
        </button>
        {/* Hidden file input — triggered programmatically by the button above */}
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_FILE_TYPES}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      {/* Inline upload error */}
      {uploadError && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-3">
          {uploadError}
        </p>
      )}

      {/* Document List or Empty State */}
      {documents.length === 0 ? (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
            <FolderOpen className="h-6 w-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">No documents shared yet</p>
          <p className="text-xs text-gray-400 mt-1">Upload a file to share with your group</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {documents.map((doc) => {
            const Icon = getFileIcon(doc.fileType);
            const colorClass = getFileColor(doc.fileType);

            return (
              <li
                key={doc.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer group"
              >
                {/* File Icon */}
                <div className={`w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center`}>
                  <Icon className="h-5 w-5" />
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {doc.fileName}
                  </p>
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">{doc.uploaderName}</span>
                    <span className="mx-1">•</span>
                    <span>{formatTime(doc.uploadedAt)}</span>
                  </p>
                </div>

                {/* File Type Badge */}
                <span className="text-xs uppercase text-gray-400 font-medium">
                  {doc.fileType}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
