'use client';

import Header from '@/components/Header';
import { FolderOpen, Shield, CheckCircle, AlertTriangle, TrendingUp, Clock, Activity, ArrowUpRight, Users, FileText, ChevronRight, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, getAllCases, getAllCustodyLogs } from '@/lib/api_services';

export default function DashboardPage() {
  // Fetch dashboard statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: getDashboardStats,
  });

  // Fetch all cases
  const { data: casesResponse, isLoading: casesLoading } = useQuery({
    queryKey: ['cases'],
    queryFn: () => getAllCases(),
  });

  // Fetch all custody logs
  const { data: logsResponse, isLoading: logsLoading } = useQuery({
    queryKey: ['allCustodyLogs'],
    queryFn: () => getAllCustodyLogs(),
  });

  const recentCases = casesResponse?.cases?.slice(0, 5) || [];
  const recentActivity = logsResponse?.logs?.slice(0, 6) || [];

  const isLoading = statsLoading || casesLoading || logsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <Header 
          title="Dashboard" 
          subtitle="Overview of your evidence management system"
        />
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 mx-auto animate-spin mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Header 
        title="Dashboard" 
        subtitle="Overview of your evidence management system"
      />

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Cases Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <FolderOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="flex items-center text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                <TrendingUp className="w-3 h-3 mr-1" />
                +12%
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Cases</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats?.totalCases || 0}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">+3 from last month</p>
          </div>

          {/* Active Cases Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <span className="flex items-center text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-full">
                <Clock className="w-3 h-3 mr-1" />
                Active
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Active Cases</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats?.activeCases || 0}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Currently investigating</p>
          </div>

          {/* Evidence Items Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-full">
                Secured
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Evidence Items</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats?.totalEvidence || 0}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Across all cases</p>
          </div>

          {/* Verifications Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">
                100%
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Verifications</h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats?.verifications || 0}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">This month</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Cases - Takes 2 columns */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <FolderOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Cases</h2>
              </div>
              <Link href="/cases" className="flex items-center space-x-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors group">
                <span>View All</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="space-y-3">
              {recentCases.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>No cases found</p>
                </div>
              ) : (
                recentCases.map((caseItem: any, index: number) => (
                <Link
                  key={caseItem.id}
                  href={`/cases/${caseItem.id}`}
                  className="block p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-200 group"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-mono text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">{caseItem.caseId}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          caseItem.status === 'Active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
                          caseItem.status === 'Closed' ? 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300' :
                          'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                        }`}>
                          {caseItem.status}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{caseItem.title}</h3>
                      {caseItem.description && (
                        <div
                          className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 mb-2 rich-text-content"
                          dangerouslySetInnerHTML={{ __html: caseItem.description }}
                        />
                      )}
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>{caseItem.investigatorName}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <FileText className="w-3 h-3" />
                          <span>{caseItem.evidenceCount} evidence</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(caseItem.createdAt)}</span>
                        </span>
                      </div>
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                  </div>
                </Link>
              ))
              )}
            </div>
          </div>

          {/* Recent Activity - Takes 1 column */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Activity</h2>
            </div>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>No recent activity</p>
                </div>
              ) : (
                recentActivity.map((log: any, index: number) => (
                  <div key={log.id} className="relative pl-6 pb-4 border-l-2 border-gray-200 dark:border-gray-700 last:border-0 last:pb-0" style={{ animationDelay: `${index * 50}ms` }}>
                    <div className={`absolute -left-2 top-0 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${
                      log.action === 'Collected' ? 'bg-blue-500' :
                      log.action === 'Transferred' ? 'bg-purple-500' :
                      log.action === 'Analyzed' ? 'bg-green-500' :
                      log.action === 'Verified' ? 'bg-emerald-500' :
                      'bg-gray-500'
                    }`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                        {log.action}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 line-clamp-1">
                        Evidence ID: {log.evidenceId}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500 dark:text-gray-500">{log.performedByName}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(log.createdAt).split(',')[0]}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* System Alerts */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-amber-900 dark:text-amber-200 mb-3 text-lg">System Alerts & Notifications</h3>
              <div className="space-y-3">
                {stats && stats.totalEvidence - stats.verifications > 0 && (
                  <div className="flex items-start space-x-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                    <div className="w-2 h-2 bg-amber-500 rounded-full mt-1.5"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {stats.totalEvidence - stats.verifications} evidence items pending verification
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Action required for integrity checks</p>
                    </div>
                  </div>
                )}
                {stats && stats.activeCases > 0 && (
                  <div className="flex items-start space-x-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {stats.activeCases} active cases in progress
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Currently under investigation</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start space-x-3 p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">System operational</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">All systems running normally</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
