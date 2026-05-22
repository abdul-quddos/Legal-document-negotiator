 
"use client";

interface ProgressBarProps {
  totalClauses: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  reviewedClauses?: number;
}

export default function ProgressBar({ 
  totalClauses, 
  highRiskCount, 
  mediumRiskCount, 
  lowRiskCount,
  reviewedClauses = 0 
}: ProgressBarProps) {
  const highRiskPercent = (highRiskCount / totalClauses) * 100;
  const mediumRiskPercent = (mediumRiskCount / totalClauses) * 100;
  const lowRiskPercent = (lowRiskCount / totalClauses) * 100;
  const reviewedPercent = (reviewedClauses / totalClauses) * 100;

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/20 p-6 mb-6">
      <h3 className="text-lg font-semibold text-white mb-4">📊 Negotiation Progress</h3>
      
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Overall Progress</span>
          <span>{Math.round(reviewedPercent)}%</span>
        </div>
        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500"
            style={{ width: `${reviewedPercent}%` }}
          />
        </div>
      </div>
      
      {/* Risk breakdown */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400">{highRiskCount}</div>
          <div className="text-xs text-gray-400">🔴 High Risk</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400">{mediumRiskCount}</div>
          <div className="text-xs text-gray-400">🟡 Medium Risk</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{lowRiskCount}</div>
          <div className="text-xs text-gray-400">🟢 Low Risk</div>
        </div>
      </div>
      
      {/* Risk distribution bar */}
      <div className="h-2 rounded-full overflow-hidden flex">
        <div className="h-full bg-red-500" style={{ width: `${highRiskPercent}%` }} />
        <div className="h-full bg-yellow-500" style={{ width: `${mediumRiskPercent}%` }} />
        <div className="h-full bg-green-500" style={{ width: `${lowRiskPercent}%` }} />
      </div>
      
      <div className="flex justify-between text-xs text-gray-400 mt-2">
        <span>High</span>
        <span>Medium</span>
        <span>Low</span>
      </div>
      
      {/* Next recommendation */}
      {highRiskCount > 0 && reviewedClauses < highRiskCount && (
        <div className="mt-4 p-3 bg-red-500/10 rounded-xl border border-red-500/30">
          <p className="text-red-300 text-sm">
            💡 <strong>Recommendation:</strong> Focus on {highRiskCount} high-risk clause{highRiskCount > 1 ? 's' : ''} first
          </p>
        </div>
      )}
    </div>
  );
}