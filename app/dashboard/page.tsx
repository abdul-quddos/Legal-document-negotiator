"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [documents, setDocuments] = useState<any[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [docToDelete, setDocToDelete] = useState<string | null>(null);
  const [docNameToDelete, setDocNameToDelete] = useState("");
  
  // State for paste text feature
  const [uploadMethod, setUploadMethod] = useState<'file' | 'paste'>('file');
  const [pastedText, setPastedText] = useState("");
  const [pasteFileName, setPasteFileName] = useState("");

  const loadDocuments = async () => {
    try {
      const response = await fetch("/api/documents");
      const data = await response.json();
      if (Array.isArray(data)) {
        setDocuments(data);
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error("Failed to load documents:", error);
      setDocuments([]);
    }
  };

  const confirmDelete = (docId: string, docName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDocToDelete(docId);
    setDocNameToDelete(docName);
    setShowDeleteModal(true);
  };

  const executeDelete = async () => {
    if (!docToDelete) return;
    
    setDeletingId(docToDelete);
    try {
      const response = await fetch(`/api/document/${docToDelete}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setDocuments(documents.filter(doc => doc.id !== docToDelete));
        setShowDeleteModal(false);
        setDocToDelete(null);
        setDocNameToDelete("");
      } else {
        alert('Failed to delete document');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      loadDocuments();
    }
  }, [status, router]);

  const handleFileUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      if (response.ok) {
        setShowUploadModal(false);
        setFile(null);
        setPastedText("");
        setPasteFileName("");
        setUploadMethod('file');
        loadDocuments();
      } else {
        const error = await response.json();
        alert("Upload failed: " + error.error);
      }
    } catch (error) {
      console.error("Upload failed", error);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handlePasteUpload = async () => {
    if (!pastedText.trim()) {
      alert("Please paste some text");
      return;
    }
    
    setUploading(true);
    const fileName = pasteFileName.trim() || `pasted-contract-${Date.now()}.txt`;
    
    try {
      const response = await fetch("/api/upload-paste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: fileName,
          content: pastedText
        }),
      });
      
      if (response.ok) {
        setShowUploadModal(false);
        setFile(null);
        setPastedText("");
        setPasteFileName("");
        setUploadMethod('file');
        loadDocuments();
      } else {
        const error = await response.json();
        alert("Upload failed: " + error.error);
      }
    } catch (error) {
      console.error("Upload failed", error);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = () => {
    if (uploadMethod === 'file') {
      handleFileUpload();
    } else {
      handlePasteUpload();
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="bg-white/5 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-xl">⚖️</span>
            </div>
            <h1 className="text-2xl font-bold text-white">Legal Negotiator</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-5 py-2 rounded-xl hover:from-green-700 hover:to-green-800 transition-all font-medium shadow-lg"
            >
              + New Document
            </button>
            <button
              onClick={() => signOut()}
              className="bg-white/10 text-white px-5 py-2 rounded-xl hover:bg-white/20 transition-all border border-white/20"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl border border-white/20 p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Welcome back, {session.user?.name || session.user?.email} 👋</h2>
          <p className="text-gray-300">Upload legal documents and let AI help you negotiate better terms.</p>
        </div>
        
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20 p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Your Documents</h3>
          
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📄</div>
              <p className="text-gray-400 mb-4">No documents yet</p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-all"
              >
                Upload your first document
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {documents.map((doc, index) => (
                <div 
                  key={doc.id || index} 
                  onClick={() => router.push(`/document/${doc.id}`)}
                  className="bg-white/10 rounded-xl p-4 border border-white/10 cursor-pointer hover:bg-white/20 transition-all group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-white font-medium">{doc.fileName || "Untitled"}</p>
                      <p className="text-gray-400 text-sm mt-1">
                        Uploaded: {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : "Unknown date"}
                      </p>
                      <p className="text-gray-400 text-sm">Click to negotiate with AI</p>
                    </div>
                    <button
                      onClick={(e) => confirmDelete(doc.id, doc.fileName, e)}
                      disabled={deletingId === doc.id}
                      className="bg-red-500/20 hover:bg-red-500/40 text-red-400 hover:text-red-200 px-3 py-1.5 rounded-lg transition-all text-sm font-medium border border-red-500/30 hover:border-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingId === doc.id ? "⏳ Deleting..." : "🗑️ Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-2xl border border-white/20 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-4">Add Document</h2>
            
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => {
                  setUploadMethod('file');
                  setFile(null);
                  setPastedText("");
                  setPasteFileName("");
                }}
                className={`flex-1 py-2.5 rounded-xl transition-all font-medium ${
                  uploadMethod === 'file' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white/10 text-gray-400 hover:text-white'
                }`}
              >
                📁 Upload File
              </button>
              <button
                onClick={() => {
                  setUploadMethod('paste');
                  setFile(null);
                }}
                className={`flex-1 py-2.5 rounded-xl transition-all font-medium ${
                  uploadMethod === 'paste' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white/10 text-gray-400 hover:text-white'
                }`}
              >
                📝 Paste Text
              </button>
            </div>
            
            {uploadMethod === 'file' ? (
              <>
                <p className="text-gray-400 mb-4">Upload a TXT file(No PDF)</p>
                <input
                  key="file-input"
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  accept=".pdf,.txt"
                  className="w-full p-3 bg-white/5 border border-white/20 rounded-xl text-white mb-4"
                />
                {file && (
                  <p className="text-sm text-gray-400 mb-4">Selected: {file.name}</p>
                )}
              </>
            ) : (
              <>
                <p className="text-gray-400 mb-4">Paste your contract text below</p>
                <input
                  key="paste-filename-input"
                  type="text"
                  value={pasteFileName}
                  onChange={(e) => setPasteFileName(e.target.value)}
                  placeholder="File name (optional, e.g., my-contract.txt)"
                  className="w-full p-3 bg-white/5 border border-white/20 rounded-xl text-white mb-4"
                />
                <textarea
                  key="paste-textarea"
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste your contract text here..."
                  className="w-full h-64 p-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <p className="text-gray-500 text-xs mt-2">
                  {pastedText.length} characters pasted
                </p>
              </>
            )}
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpload}
                disabled={uploading || (uploadMethod === 'file' ? !file : !pastedText.trim())}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl transition-all disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload Document"}
              </button>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setFile(null);
                  setPastedText("");
                  setPasteFileName("");
                  setUploadMethod('file');
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white p-3 rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 w-full max-w-md border border-red-500/30 shadow-2xl transform transition-all">
            <div className="text-center">
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🗑️</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Delete Document</h2>
              <p className="text-gray-400 mb-2">
                Are you sure you want to delete <span className="text-white font-medium">{docNameToDelete}</span>?
              </p>
              <p className="text-gray-500 text-sm mb-6">This action cannot be undone.</p>
              
              <div className="flex gap-3">
                <button
                  onClick={executeDelete}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white p-3 rounded-xl transition-all font-medium shadow-lg"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDocToDelete(null);
                    setDocNameToDelete("");
                  }}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white p-3 rounded-xl transition-all font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}