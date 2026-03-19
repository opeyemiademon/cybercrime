'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import { Search, Download, Calendar, User, Activity, Shield, Loader2, AlertCircle } from 'lucide-react';
import { getAllCustodyLogs } from '@/lib/api_services';
import { formatDate } from '@/lib/utils';
import Select from 'react-select';

export default function AuditTrailPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('All');
  const [displayCount, setDisplayCount] = useState(10);
  const ITEMS_PER_PAGE = 10;

  const { data, isLoading, error } = useQuery({
    queryKey: ['auditLogs', { action: actionFilter, search: searchTerm }],
    queryFn: () => getAllCustodyLogs({
      action: actionFilter !== 'All' ? actionFilter : undefined,
      search: searchTerm || undefined,
    }),
  });

  const logs = data?.logs || [];
  const total = data?.total || 0;

  const displayedLogs = useMemo(() => logs.slice(0, displayCount), [logs, displayCount]);
  const hasMore = displayCount < logs.length;

  const uniqueEvidenceCount = useMemo(
    () => new Set(logs.map(l => l.evidenceId)).size,
    [logs]
  );

  const verifiedCount = useMemo(
    () => logs.filter(l => l.currentHash).length,
    [logs]
  );

  const integrityPct = total > 0
    ? Math.round((verifiedCount / logs.length) * 100)
    : 100;

  const loadMore = () => setDisplayCount(prev => prev + ITEMS_PER_PAGE);

  const actionOptions = [
    { value: 'All', label: 'All Actions' },
    { value: 'Collected', label: 'Collected' },
    { value: 'Transferred', label: 'Transferred' },
    { value: 'Analyzed', label: 'Analyzed' },
    { value: 'Stored', label: 'Stored' },
    { value: 'Released', label: 'Released' },
  ];

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      'Collected': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'Transferred': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      'Analyzed': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'Stored': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      'Released': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    };
    return colors[action] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  const exportToCSV = () => {
    const headers = ['Timestamp', 'Evidence ID', 'Case ID', 'Action', 'Performed By', 'Location', 'Purpose', 'Hash Chain'];
    const rows = logs.map(log => [
      formatDate(log.createdAt),
      log.evidenceId,
      log.caseId,
      log.action,
      log.performedByName,
      log.location || 'N/A',
      log.purpose || 'N/A',
      log.currentHash ? log.currentHash.substring(0, 16) + '...' : 'N/A',
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div>
      <Header
        title="Audit Trail"
        subtitle="Complete chain-of-custody event log"
      />

      <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-2">
              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Events</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {isLoading ? '—' : total}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-2">
              <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Unique Evidence Items</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {isLoading ? '—' : uniqueEvidenceCount}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-2">
              <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Hash Chain Integrity</h3>
            </div>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {isLoading ? '—' : `${integrityPct}%`}
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 flex flex-col md:flex-row items-stretch md:items-center space-y-3 md:space-y-0 md:space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or purpose..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setDisplayCount(10); }}
                className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
              />
            </div>

            <div className="w-full md:w-64">
              <Select
                value={actionOptions.find(opt => opt.value === actionFilter)}
                onChange={(option) => { setActionFilter(option?.value || 'All'); setDisplayCount(10); }}
                options={actionOptions}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Filter by action..."
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: '42px',
                    borderColor: '#d1d5db',
                    '&:hover': { borderColor: '#9ca3af' },
                  }),
                }}
              />
            </div>
          </div>

          <button
            onClick={exportToCSV}
            disabled={logs.length === 0}
            className="px-4 py-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-5 h-5" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm transition-colors">

          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mr-3" />
              <p className="text-gray-600 dark:text-gray-400">Loading audit logs...</p>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-16 space-x-3">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <p className="text-red-600 dark:text-red-400">Failed to load audit logs. Please try again.</p>
            </div>
          )}

          {!isLoading && !error && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">Timestamp</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">Evidence ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">Action</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">Performed By</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">Location / Purpose</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 text-sm">Hash Chain</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedLogs.map((log, index) => (
                    <tr
                      key={log.id}
                      className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                        index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'
                      }`}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center text-sm">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                          <span className="text-gray-900 dark:text-white">{formatDate(log.createdAt)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-xs font-mono text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          {log.evidenceId.substring(0, 12)}...
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center text-sm">
                          <User className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                          <span className="font-medium text-gray-900 dark:text-white">{log.performedByName}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 max-w-xs">
                        {log.location && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">📍 {log.location}</p>
                        )}
                        {log.purpose && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{log.purpose}</p>
                        )}
                        {!log.location && !log.purpose && (
                          <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {log.currentHash ? (
                          <div className="text-xs">
                            <p className="font-mono text-gray-600 dark:text-gray-400 truncate max-w-[120px]" title={log.currentHash}>
                              {log.currentHash.substring(0, 12)}...
                            </p>
                            {log.previousHash && (
                              <p className="text-gray-400 dark:text-gray-500 mt-0.5">
                                ← {log.previousHash.substring(0, 8)}...
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500">N/A</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {logs.length === 0 && (
                <div className="text-center py-12">
                  <Activity className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No audit logs found</h3>
                  <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="flex justify-center">
            <button
              onClick={loadMore}
              className="px-6 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-400 rounded-lg font-medium transition-all flex items-center space-x-2"
            >
              <Activity className="w-5 h-5" />
              <span>Load More ({logs.length - displayCount} remaining)</span>
            </button>
          </div>
        )}

        {logs.length > 0 && (
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            Showing {displayedLogs.length} of {logs.length} events
          </div>
        )}
      </div>
    </div>
  );
}
