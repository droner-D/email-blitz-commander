
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
    if (rate >= 95) return "text-green-400 bg-green-400/10 border-green-400/20";
    if (rate >= 85) return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
    return "text-red-400 bg-red-400/10 border-red-400/20";
  };

  const getResponseTimeColor = (time: number) => {
    if (time <= 200) return "text-green-400";
    if (time <= 500) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Sent */}
      <Card className="bg-gradient-to-br from-blue-600/10 to-blue-800/10 border-blue-500/30 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-300 text-sm font-medium mb-1">Total Sent</p>
              <p className="text-3xl font-bold text-white mb-1">
                {totalSent.toLocaleString()}
              </p>
              <div className="flex items-center text-xs text-blue-200">
                <TrendingUp className="w-3 h-3 mr-1" />
                {isActive ? 'Sending...' : 'Completed'}
              </div>
            </div>
            <div className="bg-blue-500/20 p-3 rounded-full">
              <CheckCircle className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Rate */}
      <Card className={`bg-gradient-to-br border backdrop-blur-sm ${
        successRate >= 95 
          ? 'from-green-600/10 to-green-800/10 border-green-500/30' 
          : successRate >= 85 
            ? 'from-yellow-600/10 to-yellow-800/10 border-yellow-500/30'
            : 'from-red-600/10 to-red-800/10 border-red-500/30'
      }`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium mb-1 ${
                successRate >= 95 ? 'text-green-300' : 
                successRate >= 85 ? 'text-yellow-300' : 'text-red-300'
              }`}>
                Success Rate
              </p>
              <p className="text-3xl font-bold text-white mb-1">
                {successRate.toFixed(1)}%
              </p>
              <Badge className={`text-xs ${getSuccessRateColor(successRate)}`}>
                {successRate >= 95 ? 'Excellent' : successRate >= 85 ? 'Good' : 'Poor'}
              </Badge>
            </div>
            <div className={`p-3 rounded-full ${
              successRate >= 95 ? 'bg-green-500/20' : 
              successRate >= 85 ? 'bg-yellow-500/20' : 'bg-red-500/20'
            }`}>
              {successRate >= 85 ? (
                <CheckCircle className={`w-6 h-6 ${
                  successRate >= 95 ? 'text-green-400' : 'text-yellow-400'
                }`} />
              ) : (
                <AlertTriangle className="w-6 h-6 text-red-400" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Average Response Time */}
      <Card className="bg-gradient-to-br from-purple-600/10 to-purple-800/10 border-purple-500/30 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-300 text-sm font-medium mb-1">Avg Response</p>
              <p className={`text-3xl font-bold mb-1 ${getResponseTimeColor(avgResponseTime)}`}>
                {avgResponseTime}ms
              </p>
              <div className="flex items-center text-xs text-purple-200">
                <Clock className="w-3 h-3 mr-1" />
                {avgResponseTime <= 200 ? 'Fast' : avgResponseTime <= 500 ? 'Moderate' : 'Slow'}
              </div>
            </div>
            <div className="bg-purple-500/20 p-3 rounded-full">
              <Clock className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Peak Rate */}
      <Card className="bg-gradient-to-br from-orange-600/10 to-orange-800/10 border-orange-500/30 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-300 text-sm font-medium mb-1">Peak Rate</p>
              <p className="text-3xl font-bold text-white mb-1">
                {peakRate.toFixed(1)}
              </p>
              <div className="flex items-center text-xs text-orange-200">
                <Zap className="w-3 h-3 mr-1" />
                emails/sec
              </div>
            </div>
            <div className="bg-orange-500/20 p-3 rounded-full">
              <Zap className="w-6 h-6 text-orange-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceInsights;
