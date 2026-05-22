"use client";

import { useState } from "react";

interface Clause {
  id: string;
  title: string;
  risk: string;
  originalText: string;
  plainEnglish: string;
  whyItMatters: string;
  suggestedChange: string;
}

interface AccordionProps {
  clauses: Clause[];
  appliedClauses?: Set<string>;
  reviewedClausesSet?: Set<string>;
  onClauseReview?: (clauseId: string) => void;
  onApplySuggestion?: (clauseId: string, suggestedChange: string, originalText: string) => Promise<void>;
}

export default function Accordion({ 
  clauses, 
  appliedClauses = new Set(), 
  reviewedClausesSet = new Set(),
  onClauseReview, 
  onApplySuggestion 
}: AccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleMarkReviewed = (clauseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onClauseReview?.(clauseId);
  };

  const handleApplySuggestion = async (clause: Clause, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (applyingId === clause.id || appliedClauses.has(clause.id)) return;
    
    setApplyingId(clause.id);
    
    try {
      if (onApplySuggestion) {
        await onApplySuggestion(clause.id, clause.suggestedChange, clause.originalText);
      }
    } catch (error) {
      console.error("Apply failed:", error);
    } finally {
      setApplyingId(null);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-500/20 border-red-500/50 text-red-400';
      case 'medium': return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400';
      case 'low': return 'bg-green-500/20 border-green-500/50 text-green-400';
      default: return 'bg-gray-500/20 border-gray-500/50 text-gray-400';
    }
  };

  const getRiskEmoji = (risk: string) => {
    switch (risk) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const getRiskText = (risk: string) => {
    switch (risk) {
      case 'high': return 'High Risk';
      case 'medium': return 'Medium Risk';
      case 'low': return 'Low Risk';
      default: return 'Unknown';
    }
  };

  if (!clauses || clauses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>No complex clauses found in this document.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">📋 Key Clauses</h3>
        <span className="text-sm text-gray-400">{clauses.length} clauses found</span>
      </div>
      
      {clauses.map((clause, index) => {
        const isReviewed = reviewedClausesSet.has(clause.id);
        const isApplied = appliedClauses.has(clause.id);
        const isApplying = applyingId === clause.id;
        const riskColor = getRiskColor(clause.risk);
        const riskEmoji = getRiskEmoji(clause.risk);
        const riskText = getRiskText(clause.risk);
        
        return (
          <div 
            key={clause.id} 
            className={`rounded-xl border transition-all ${riskColor} ${isReviewed ? 'opacity-75' : ''}`}
          >
            <button
              onClick={() => toggleAccordion(index)}
              className="w-full p-4 text-left flex items-center justify-between hover:bg-white/5 transition-colors rounded-xl"
            >
              <div className="flex items-center gap-3 flex-1">
                <span className="text-xl">{riskEmoji}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs opacity-70 bg-black/30 px-2 py-0.5 rounded">
                      Clause {clause.id}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded ${riskColor} bg-opacity-50`}>
                      {riskText}
                    </span>
                    {isReviewed && (
                      <span className="text-xs bg-green-500/30 text-green-300 px-2 py-0.5 rounded">
                        ✓ Reviewed
                      </span>
                    )}
                    {isApplied && (
                      <span className="text-xs bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded">
                        ✓ Applied
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-white mt-1">{clause.title}</h3>
                </div>
              </div>
              <span className="text-2xl transition-transform duration-200 ml-3" style={{ transform: openIndex === index ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                ▼
              </span>
            </button>
            
            {openIndex === index && (
              <div className="p-4 pt-0 border-t border-white/10 mt-2 space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">📖 Original Text</h4>
                  <p className="text-white/90 text-sm italic bg-black/30 p-3 rounded-lg border-l-4 border-l-blue-500">
                    "{clause.originalText}"
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">💡 Plain English</h4>
                  <p className="text-white bg-black/20 p-3 rounded-lg">
                    {clause.plainEnglish}
                  </p>
                </div>
                
                <div className="bg-yellow-500/5 rounded-lg p-3 border-l-4 border-l-yellow-500">
                  <h4 className="text-sm font-semibold text-yellow-400 mb-2">⚠️ Why It Matters</h4>
                  <p className="text-yellow-300/90">{clause.whyItMatters}</p>
                </div>
                
                <div className="bg-green-500/5 rounded-lg p-3 border-l-4 border-l-green-500">
                  <div className="flex justify-between items-start gap-3 flex-wrap">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-green-400 mb-2">✏️ Suggested Change</h4>
                      <p className="text-green-400/90">{clause.suggestedChange}</p>
                    </div>
                    <button
                      onClick={(e) => handleApplySuggestion(clause, e)}
                      disabled={isApplied || isApplying}
                      className={`mt-1 text-sm px-4 py-2 rounded-lg transition-all font-medium whitespace-nowrap flex items-center gap-2 ${
                        isApplied 
                          ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed' 
                          : isApplying
                          ? 'bg-green-600/70 text-white cursor-wait'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {isApplying ? (
                        <>
                          <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          Applying...
                        </>
                      ) : isApplied ? (
                        "✓ Applied"
                      ) : (
                        "📝 Apply Change"
                      )}
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={(e) => handleMarkReviewed(clause.id, e)}
                  disabled={isReviewed}
                  className={`w-full mt-2 text-sm px-4 py-2 rounded-lg transition-all font-medium ${
                    isReviewed 
                      ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isReviewed ? "✓ Already Reviewed" : "✓ Mark as Reviewed"}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}