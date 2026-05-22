"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Accordion from '@/app/components/Accordion';
import ProgressBar from '@/app/components/ProgressBar';

export default function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [docData, setDocData] = useState<any>(null);
  const [explanation, setExplanation] = useState("");
  const [userRequest, setUserRequest] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("view");
  const [docId, setDocId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [reviewedClausesCount, setReviewedClausesCount] = useState(0);
  const [accumulatedChanges, setAccumulatedChanges] = useState<Map<string, string>>(new Map());
  
  // Persisted states for buttons
  const [appliedClauses, setAppliedClauses] = useState<Set<string>>(new Set());
  const [reviewedClauses, setReviewedClauses] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function unwrapParams() {
      const { id } = await params;
      setDocId(id);
    }
    unwrapParams();
  }, [params]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const loadDoc = async () => {
      if (!docId) return;
      try {
        const response = await fetch(`/api/document/${docId}`);
        const data = await response.json();
        setDocData(data);
        if (data.editedText && data.editedText !== data.originalText) {
          setActiveTab("edited");
        }
      } catch (error) {
        console.error("Failed to load document:", error);
      }
    };
    loadDoc();
  }, [docId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const dropdown = document.getElementById('export-dropdown');
      const target = e.target as HTMLElement;
      if (dropdown && !dropdown.classList.contains('hidden') && !target.closest('.relative')) {
        dropdown.classList.add('hidden');
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleExplain = async () => {
    if (!docData) return;
    setLoading(true);
    try {
      const response = await fetch("/api/negotiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId: docId,
          action: "explain",
          documentText: docData.originalText
        })
      });
      const data = await response.json();
      
      if (data.clauses && Array.isArray(data.clauses)) {
        setAnalysis(data);
        setActiveTab("explain");
      } else if (data.result) {
        setExplanation(data.result);
        setActiveTab("explain");
      } else {
        setExplanation(JSON.stringify(data, null, 2));
        setActiveTab("explain");
      }
    } catch (error) {
      console.error("Explain failed:", error);
      alert("Failed to explain terms");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, isError: boolean = false) => {
    const toast = window.document.createElement('div');
    toast.className = `fixed bottom-4 right-4 text-white px-4 py-3 rounded-lg shadow-lg z-50 animate-fade-in ${isError ? 'bg-red-600' : 'bg-green-600'}`;
    toast.innerHTML = message;
    window.document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const handleApplySuggestion = async (clauseId: string, suggestedChange: string, originalText: string) => {
    // Mark as applied immediately
    setAppliedClauses(prev => new Set(prev).add(clauseId));
    
    try {
      const response = await fetch("/api/negotiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId: docId,
          action: "applySuggestion",
          clauseId: clauseId,
          originalText: originalText,
          suggestedChange: suggestedChange
        })
      });
      
      const data = await response.json();
      const rewrittenClause = data.rewrittenClause;
      
      const newChanges = new Map(accumulatedChanges);
      newChanges.set(clauseId, rewrittenClause);
      setAccumulatedChanges(newChanges);
      
      let modifiedDocument = docData.originalText;
      for (const [id, newText] of newChanges) {
        const clause = analysis?.clauses?.find((c: any) => c.id === id);
        if (clause && clause.originalText) {
          modifiedDocument = modifiedDocument.replace(clause.originalText, newText);
        }
      }
      
      setDocData({ ...docData, editedText: modifiedDocument });
      showToast(`✅ Clause ${clauseId} rewritten and applied`);
      
    } catch (error) {
      console.error("Apply suggestion failed:", error);
      showToast(`❌ Failed to apply clause ${clauseId}`, true);
      // Remove applied mark on error
      setAppliedClauses(prev => {
        const newSet = new Set(prev);
        newSet.delete(clauseId);
        return newSet;
      });
    }
  };

  const handleClauseReview = (clauseId: string) => {
    if (!reviewedClauses.has(clauseId)) {
      setReviewedClauses(prev => new Set(prev).add(clauseId));
      setReviewedClausesCount(prev => Math.min(prev + 1, analysis?.totalClauses || 0));
    }
  };

  const handleEdit = async () => {
    if (!userRequest.trim() || !docData) return;
    
    setLoading(true);
    try {
      const response = await fetch("/api/negotiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId: docId,
          action: "edit",
          userRequest: userRequest,
          documentText: docData.originalText
        })
      });
      const data = await response.json();
      setDocData({ ...docData, editedText: data.result });
      setActiveTab("edited");
      setUserRequest("");
      setAccumulatedChanges(new Map());
      showToast(`✅ AI changes applied! Check the "Edited" tab.`);
      
    } catch (error) {
      console.error("Edit failed:", error);
      alert("Failed to edit document");
    } finally {
      setLoading(false);
    }
  };

  const exportAsPDF = () => {
    const textToExport = docData?.editedText || docData?.originalText;
    const win = window.open();
    win?.document.write(`
      <html>
        <head>
          <title>Contract</title>
          <style>
            body { 
              font-family: 'Times New Roman', serif; 
              margin: 1in; 
              line-height: 1.5;
              font-size: 12pt;
            }
            pre { 
              white-space: pre-wrap; 
              font-family: 'Times New Roman', serif;
              margin: 0;
              padding: 0;
            }
          </style>
        </head>
        <body>
          <pre>${textToExport?.replace(/</g, '&lt;').replace(/>/g, '&gt;') || ''}</pre>
          <script>window.print();</script>
        </body>
      </html>
    `);
  };

  const exportAsTXT = () => {
    const textToExport = docData?.editedText || docData?.originalText;
    const blob = new Blob([textToExport || ''], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docData?.fileName?.replace(/\.(txt|pdf)$/i, '') || 'contract'}_negotiated.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (status === "loading" || !docData) {
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
            <button
              onClick={() => router.push("/dashboard")}
              className="bg-white/10 text-white px-4 py-2 rounded-xl hover:bg-white/20 transition-all flex items-center gap-2"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">{docData.fileName}</h1>
              <p className="text-gray-400 text-sm">Legal Document Editor</p>
            </div>
          </div>
          
          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                const dropdown = document.getElementById('export-dropdown');
                if (dropdown) dropdown.classList.toggle('hidden');
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2"
            >
              📄 Export <span className="text-xs">▼</span>
            </button>
            <div 
              id="export-dropdown" 
              className="absolute right-0 mt-2 bg-gray-800 rounded-xl border border-white/20 shadow-lg overflow-hidden z-50 hidden min-w-[160px]"
            >
              <button
                onClick={() => {
                  exportAsPDF();
                  document.getElementById('export-dropdown')?.classList.add('hidden');
                }}
                className="block w-full px-4 py-2 text-left text-white hover:bg-white/10 transition-colors"
              >
                📄 Export as PDF
              </button>
              <button
                onClick={() => {
                  exportAsTXT();
                  document.getElementById('export-dropdown')?.classList.add('hidden');
                }}
                className="block w-full px-4 py-2 text-left text-white hover:bg-white/10 transition-colors border-t border-white/10"
              >
                📝 Export as TXT
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20 p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-3">
              <button
                onClick={handleExplain}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
              >
                🔍 {loading ? "Analyzing..." : "Analyze Contract"}
              </button>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab("view")}
                  className={`px-4 py-2.5 rounded-xl transition-all ${activeTab === "view" ? "bg-blue-600 text-white" : "bg-white/10 text-gray-400 hover:text-white"}`}
                >
                  📄 Original
                </button>
                {docData?.editedText && (
                  <button
                    onClick={() => setActiveTab("edited")}
                    className={`px-4 py-2.5 rounded-xl transition-all ${activeTab === "edited" ? "bg-green-600 text-white" : "bg-white/10 text-gray-400 hover:text-white"}`}
                  >
                    ✏️ Edited {accumulatedChanges.size > 0 && `(${accumulatedChanges.size})`}
                  </button>
                )}
                {(explanation || analysis) && (
                  <button
                    onClick={() => setActiveTab("explain")}
                    className={`px-4 py-2.5 rounded-xl transition-all ${activeTab === "explain" ? "bg-yellow-600 text-white" : "bg-white/10 text-gray-400 hover:text-white"}`}
                  >
                    📊 Analysis
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20 p-4 mb-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-gray-300 text-sm mb-2">🤖 Request AI Changes</label>
              <input
                type="text"
                value={userRequest}
                onChange={(e) => setUserRequest(e.target.value)}
                placeholder="e.g., Remove clause 3.2, Increase liability cap to $50,000"
                className="w-full p-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
                onKeyPress={(e) => e.key === 'Enter' && handleEdit()}
              />
            </div>
            <button
              onClick={handleEdit}
              disabled={loading || !userRequest.trim()}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
            >
              ✏️ Apply
            </button>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20 p-6 min-h-[500px]">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-4xl mb-4">⏳</div>
                <p className="text-white">Processing...</p>
              </div>
            </div>
          )}
          
          {!loading && (
            <>
              {activeTab === "view" && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">📄 Original Document</h3>
                  <pre className="whitespace-pre-wrap font-sans text-gray-300 bg-black/30 p-4 rounded-xl overflow-auto max-h-[600px]">
                    {docData.originalText}
                  </pre>
                </div>
              )}
              
              {activeTab === "edited" && docData?.editedText && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white">✏️ Edited Document</h3>
                    {accumulatedChanges.size > 0 && (
                      <span className="text-xs bg-green-500/30 text-green-300 px-2 py-1 rounded">
                        {accumulatedChanges.size} suggestion(s) applied
                      </span>
                    )}
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-gray-300 bg-black/30 p-4 rounded-xl overflow-auto max-h-[600px]">
                    {docData.editedText}
                  </pre>
                </div>
              )}
              
              {activeTab === "explain" && analysis && analysis.clauses && (
                <div>
                  <ProgressBar 
                    totalClauses={analysis.totalClauses}
                    highRiskCount={analysis.highRiskCount}
                    mediumRiskCount={analysis.mediumRiskCount}
                    lowRiskCount={analysis.lowRiskCount}
                    reviewedClauses={reviewedClausesCount}
                  />
                  <div className="mt-6">
                    <Accordion 
                      clauses={analysis.clauses} 
                      appliedClauses={appliedClauses}
                      reviewedClausesSet={reviewedClauses}
                      onClauseReview={handleClauseReview}
                      onApplySuggestion={handleApplySuggestion}
                    />
                  </div>
                </div>
              )}
              
              {activeTab === "explain" && explanation && !analysis && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">📊 Analysis</h3>
                  <div className="text-gray-300 whitespace-pre-wrap bg-black/30 p-4 rounded-xl">
                    {explanation}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}