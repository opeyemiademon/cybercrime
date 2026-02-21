'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { Search, Filter, Download, Calendar, User, Activity, Shield } from 'lucide-react';
import { mockCustodyLogs, mockEvidence } from '@/lib/mockData';
import { formatDate } from '@/lib/utils';
import Select from 'react-select';

export default function AuditTrailPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('All');
  const [displayCount, setDisplayCount] = useState(10);
  const ITEMS_PER_PAGE = 10;

  const filteredLogs = mockCustodyLogs.filter(log => {
    const matchesSearch = log.performedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.purpose.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === 'All' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const displayedLogs = filteredLogs.slice(0, displayCount);
  const hasMore = displayCount < filteredLogs.length;

  const loadMore = () => {
    setDisplayCount(prev => prev + ITEMS_PER_PAGE);
  };

  const actionOptions = [
    { value: 'All', label: 'All Actions' },
    { value: 'Collected', label: 'Collected' },
    { value: 'Transferred', label: 'Transferred' },
    { value: 'Analyzed', label: 'Analyzed' },
    { value: 'Stored', label: 'Stored' },
    { value: 'Archived', label: 'Archived' },
    { value: 'Retrieved', label: 'Retrieved' },
    { value: 'Verified', label: 'Verified' },
  ];

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      'Collected': 'bg-blue-100 text-blue-800',
      'Transferred': 'bg-purple-100 text-purple-800',
      'Analyzed': 'bg-green-100 text-green-800',
      'Stored': 'bg-gray-100 text-gray-800',
      'Archived': 'bg-orange-100 text-orange-800',
      'Retrieved': 'bg-indigo-100 text-indigo-800',
      'Verified': 'bg-emerald-100 text-emerald-800',
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  const exportToCSV = () => {
    const headers = ['Timestamp', 'Evidence ID', 'Action', 'Performed By', 'Performed To', 'Purpose', 'Log Hash'];
    const rows = filteredLogs.map(log => [
      formatDate(log.timestamp),
      log.evidenceId,
      log.action,
      log.performedBy,
      log.performedTo || 'N/A',
      log.purpose,
      log.logHash || 'N/A'
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${new Date().toISOString()}.csv`;
    a.click();
    alert('Audit trail exported successfully!');
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
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-2">
              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Events</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{mockCustodyLogs.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-2">
              <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Unique Evidence Items</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {new Set(mockCustodyLogs.map(log => log.evidenceId)).size}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-2">
              <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Hash Chain Integrity</h3>
            </div>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">100%</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 flex flex-col md:flex-row items-stretch md:items-center space-y-3 md:space-y-0 md:space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search audit logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-colors"
              />
            </div>
            
            <div className="w-full md:w-64">
              <Select
                value={actionOptions.find(opt => opt.value === actionFilter)}
                onChange={(option) => setActionFilter(option?.value || 'All')}
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
            className="px-4 py-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>Export CSV</span>
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Timestamp</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Evidence ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Action</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Performed By</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Purpose</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Hash Chain</th>
                </tr>
              </thead>
              <tbody>
                {displayedLogs.map((log, index) => {
                  const evidence = mockEvidence.find(e => e.id === log.evidenceId);
                  return (
                    <tr key={log.id} className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-750'}`}>
                      <td className="py-4 px-4">
                        <div className="flex items-center text-sm">
                          <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-gray-900 dark:text-white">{formatDate(log.timestamp)}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm font-mono text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          {evidence?.evidenceId || log.evidenceId}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center text-sm">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{log.performedBy}</p>
                            {log.performedTo && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">→ {log.performedTo}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-gray-700 dark:text-gray-300">{log.purpose}</p>
                      </td>
                      <td className="py-4 px-4">
                        {log.logHash ? (
                          <div className="text-xs">
                            <p className="font-mono text-gray-600 dark:text-gray-400 truncate max-w-xs" title={log.logHash}>
                              {log.logHash.substring(0, 12)}...
                            </p>
                            {log.prevLogHash && (
                              <p className="text-gray-400 dark:text-gray-500 mt-1">
                                ← {log.prevLogHash.substring(0, 8)}...
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500">N/A</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No audit logs found</h3>
              <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filters</p>
            </div>
          )}
        </div>

        {/* Load More Button */}
        {hasMore && (
          <div className="flex justify-center">
            <button
              onClick={loadMore}
              className="px-6 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 hover:text-blue-700 dark:hover:text-blue-400 rounded-lg font-medium transition-all flex items-center space-x-2"
            >
              <Activity className="w-5 h-5" />
              <span>Load More ({filteredLogs.length - displayCount} remaining)</span>
            </button>
          </div>
        )}

        {/* Results Summary */}
        {filteredLogs.length > 0 && (
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            Showing {displayedLogs.length} of {filteredLogs.length} events
          </div>
        )}
      </div>
    </div>
  );
}
