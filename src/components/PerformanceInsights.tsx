
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Clock, CheckCircle, AlertTriangle, Zap } from "lucide-react";

interface PerformanceInsightsProps {
  totalSent: number;
  successRate: number;
  avgResponseTime: number;
  peakRate: number;
  isActive?: boolean;
}

const PerformanceInsights = ({ 
  totalSent, 
  successRate, 
  avgResponseTime, 
  peakRate, 
  isActive = false 
}: PerformanceInsightsProps) => {
  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return "text-emerald-300 bg-emerald-500/20 border-emerald-400/30";
    if (rate >= 85) return "text-amber-300 bg-amber-500/20 border-amber-400/30";
    return "text-rose-300 bg-rose-500/20 border-rose-400/30";
  };

  const getResponseTimeColor = (time: number) => {
    if (time <= 200) return "text-emerald-300";
    if (time <= 500) return "text-amber-300";
    return "text-rose-300";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Sent */}
      <Card className="bg-slate-800/90 border-slate-600/50 backdrop-blur-sm shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-cyan-300 text-sm font-medium mb-2">Total Sent</p>
              <p className="text-4xl font-bold text-white mb-2">
                {totalSent.toLocaleString()}
              </p>
              <div className="flex items-center text-xs text-cyan-200">
                <TrendingUp className="w-3 h-3 mr-1" />
                <span>{isActive ? 'Sending...' : 'Completed'}</span>
              </div>
            </div>
            <div className="bg-cyan-500/20 p-4 rounded-xl border border-cyan-400/20">
              <CheckCircle className="w-8 h-8 text-cyan-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Rate */}
      <Card className="bg-slate-800/90 border-slate-600/50 backdrop-blur-sm shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className={`text-sm font-medium mb-2 ${
                successRate >= 95 ? 'text-emerald-300' : 
                successRate >= 85 ? 'text-amber-300' : 'text-rose-300'
              }`}>
                Success Rate
              </p>
              <p className="text-4xl font-bold text-white mb-2">
                {successRate.toFixed(1)}%
              </p>
              <Badge className={`text-xs font-medium px-2 py-1 ${getSuccessRateColor(successRate)}`}>
                {successRate >= 95 ? 'Excellent' : successRate >= 85 ? 'Good' : 'Poor'}
              </Badge>
            </div>
            <div className={`p-4 rounded-xl border ${
              successRate >= 95 ? 'bg-emerald-500/20 border-emerald-400/20' : 
              successRate >= 85 ? 'bg-amber-500/20 border-amber-400/20' : 'bg-rose-500/20 border-rose-400/20'
            }`}>
              {successRate >= 85 ? (
                <CheckCircle className={`w-8 h-8 ${
                  successRate >= 95 ? 'text-emerald-400' : 'text-amber-400'
                }`} />
              ) : (
                <AlertTriangle className="w-8 h-8 text-rose-400" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Average Response Time */}
      <Card className="bg-slate-800/90 border-slate-600/50 backdrop-blur-sm shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-violet-300 text-sm font-medium mb-2">Avg Response</p>
              <p className={`text-4xl font-bold mb-2 ${getResponseTimeColor(avgResponseTime)}`}>
                {avgResponseTime}ms
              </p>
              <div className="flex items-center text-xs text-violet-200">
                <Clock className="w-3 h-3 mr-1" />
                <span>{avgResponseTime <= 200 ? 'Fast' : avgResponseTime <= 500 ? 'Moderate' : 'Slow'}</span>
              </div>
            </div>
            <div className="bg-violet-500/20 p-4 rounded-xl border border-violet-400/20">
              <Clock className="w-8 h-8 text-violet-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Peak Rate */}
      <Card className="bg-slate-800/90 border-slate-600/50 backdrop-blur-sm shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-orange-300 text-sm font-medium mb-2">Peak Rate</p>
              <p className="text-4xl font-bold text-white mb-2">
                {peakRate.toFixed(1)}
              </p>
              <div className="flex items-center text-xs text-orange-200">
                <Zap className="w-3 h-3 mr-1" />
                <span>emails/sec</span>
              </div>
            </div>
            <div className="bg-orange-500/20 p-4 rounded-xl border border-orange-400/20">
              <Zap className="w-8 h-8 text-orange-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceInsights;
