'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, User, FileText, Calendar, Clock, Plus, Shield, CheckCircle, Upload, X, Loader2, AlertCircle, Camera, Video, Mic
} from 'lucide-react';
import MediaCaptureModal from '@/components/MediaCaptureModal';
import { formatDate, formatBytes, generateHash } from '@/lib/utils';
import type { EvidenceType } from '@/types';
import Select from 'react-select';
import Link from 'next/link';
import {
  getCase,
  updateCase,
  UpdateCaseData,
  getAllEvidence,
  createEvidence,
  CreateEvidenceData,
  getCustodyLogsByCase,
  createCustodyLog,
  CreateCustodyLogData
} from '@/lib/api_services';
import { notify } from '@/lib/toast';
import { generatePDFReport, generateExcelReport } from '@/lib/reportGenerator';

export default function CaseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const caseId = params.id as string;
  
  const [activeTab, setActiveTab] = useState<'evidence' | 'custody' | 'reports'>('evidence');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCustodyModal, setShowCustodyModal] = useState(false);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string>('');
  
  // Report options state
  const [reportType, setReportType] = useState<'custody' | 'full' | 'evidence' | 'timeline'>('full');
  const [reportOptions, setReportOptions] = useState({
    includeCaseDetails: true,
    includeEvidenceList: true,
    includeHashValues: true,
    includeCustodyChain: true,
  });
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Fetch case details
  const { data: caseData, isLoading: caseLoading, error: caseError } = useQuery({
    queryKey: ['case', caseId],
    queryFn: () => getCase(caseId),
  });

  // Fetch evidence for this case
  const { data: evidenceData, isLoading: evidenceLoading } = useQuery({
    queryKey: ['evidence', { caseId }],
    queryFn: () => getAllEvidence({ caseId }),
  });

  // Fetch custody logs for this case
  const { data: custodyData, isLoading: custodyLoading } = useQuery({
    queryKey: ['custodyLogs', { caseId }],
    queryFn: () => getCustodyLogsByCase(caseId),
  });

  const caseEvidence = evidenceData?.evidences || [];
  const caseLogs = custodyData?.logs || [];

  // Update case status mutation
  const updateCaseMutation = useMutation({
    mutationFn: (data: UpdateCaseData) => updateCase(caseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      notify('success', 'Case Updated', 'Case status has been updated successfully');
    },
    onError: (error: any) => {
      notify('error', 'Update Failed', error.message || 'Failed to update case status');
    },
  });

  const handleStatusChange = (status: string) => {
    updateCaseMutation.mutate({ status });
  };

  const handleGeneratePDF = () => {
    if (!caseData) {
      notify('error', 'Error', 'Case data not loaded');
      return;
    }

    setIsGeneratingReport(true);
    try {
      generatePDFReport(
        caseData,
        caseEvidence,
        caseLogs,
        { reportType, ...reportOptions }
      );
    } catch (error: any) {
      notify('error', 'Generation Failed', error.message || 'Failed to generate PDF report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleGenerateExcel = () => {
    if (!caseData) {
      notify('error', 'Error', 'Case data not loaded');
      return;
    }

    setIsGeneratingReport(true);
    try {
      generateExcelReport(
        caseData,
        caseEvidence,
        caseLogs,
        { reportType, ...reportOptions }
      );
      notify('success', 'Excel Generated', 'Report has been downloaded successfully');
    } catch (error: any) {
      notify('error', 'Generation Failed', error.message || 'Failed to generate Excel report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  if (caseLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 mx-auto animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading case details...</p>
        </div>
      </div>
    );
  }

  if (caseError || !caseData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Case not found</h3>
          <p className="text-gray-600 dark:text-gray-400">The case you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/cases')}
            className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Back to Cases
          </button>
        </div>
      </div>
    );
  }

  const statusOptions = [
    { value: 'Open', label: 'Open' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Under Review', label: 'Under Review' },
    { value: 'Closed', label: 'Closed' },
  ];

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'Low': 'text-gray-400',
      'Medium': 'text-yellow-400',
      'High': 'text-orange-400',
      'Critical': 'text-red-400',
    };
    return colors[priority] || 'text-gray-400';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">{caseData.caseId}</span>
                <span className="px-2 py-0.5 bg-yellow-500 text-gray-900 dark:text-yellow-300 rounded text-xs font-semibold">
                  {caseData.status}
                </span>
                <span className={`flex items-center space-x-1 text-sm font-medium ${getPriorityColor(caseData.priority)}`}>
                  <span>⚠</span>
                  <span>{caseData.priority}</span>
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{caseData.title}</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Select
              value={statusOptions.find(opt => opt.value === caseData.status)}
              onChange={(option) => handleStatusChange(option?.value || 'Open')}
              options={statusOptions}
              className="w-48"
              isDisabled={updateCaseMutation.isPending}
              styles={{
                control: (base) => ({
                  ...base,
                  backgroundColor: '#fff',
                  borderColor: '#d1d5db',
                  minHeight: '42px',
                  '&:hover': { borderColor: '#9ca3af' },
                }),
                singleValue: (base) => ({
                  ...base,
                  color: '#111827',
                }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: '#fff',
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isFocused ? '#f3f4f6' : '#fff',
                  color: '#111827',
                  '&:hover': { backgroundColor: '#f3f4f6' },
                }),
              }}
            />
            <button 
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-orange-600 dark:bg-orange-500 hover:bg-orange-700 dark:hover:bg-orange-600 text-white rounded-lg font-medium flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Add Evidence</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-colors">
            <div className="flex items-center space-x-3 mb-2">
              <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Lead Investigator</span>
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{caseData.investigatorName}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-colors">
            <div className="flex items-center space-x-3 mb-2">
              <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Evidence Items</span>
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{caseEvidence.length}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-colors">
            <div className="flex items-center space-x-3 mb-2">
              <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Created</span>
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatDate(caseData.createdAt)}</p>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-colors">
            <div className="flex items-center space-x-3 mb-2">
              <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Last Updated</span>
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatDate(caseData.updatedAt)}</p>
          </div>
        </div>

        {/* Description */}
        {caseData.description && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6 transition-colors">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm">{caseData.description}</p>
          </div>
        )}

        {/* Notes */}
        {caseData.notes && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6 transition-colors">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Notes</h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">{caseData.notes}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center space-x-1 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('evidence')}
            className={`px-4 py-2 font-medium transition-colors relative ${
              activeTab === 'evidence'
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Evidence ({caseEvidence.length})</span>
            </div>
            {activeTab === 'evidence' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-500"></div>
            )}
          </button>

          <button
            onClick={() => setActiveTab('custody')}
            className={`px-4 py-2 font-medium transition-colors relative ${
              activeTab === 'custody'
                ? 'text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Chain of Custody</span>
            </div>
            {activeTab === 'custody' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 font-medium transition-colors relative ${
              activeTab === 'reports'
                ? 'text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Reports</span>
            </div>
            {activeTab === 'reports' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
        </div>

        {/* Evidence Grid */}
        {activeTab === 'evidence' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {caseEvidence.map((evidence) => (
              <Link
                key={evidence.id}
                href={`/cases/${caseId}/evidence/${evidence.id}`}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">{evidence.evidenceId}</span>
                  </div>
                  {evidence.verificationStatus === 'Verified' && (
                    <span className="flex items-center space-x-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded text-xs font-medium">
                      <CheckCircle className="w-3 h-3" />
                      <span>Verified</span>
                    </span>
                  )}
                </div>

                <h3 className="text-gray-900 dark:text-white font-semibold mb-3 truncate">{evidence.filename}</h3>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Hash:</span>
                    <span className="text-gray-900 dark:text-white font-mono text-xs">
                      {evidence.hash.substring(0, 20)}...
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Source:</span>
                    <span className="text-gray-900 dark:text-white">{evidence.sourceDevice || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Size:</span>
                    <span className="text-gray-900 dark:text-white">{formatBytes(evidence.fileSize)} • {evidence.fileType}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{evidence.status}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{evidence.evidenceType}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Chain of Custody Tab */}
        {activeTab === 'custody' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chain of Custody Log */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Chain of Custody Log</span>
                </h3>

                <div className="space-y-4">
                  {caseLogs.map((log, index) => {
                    const evidence = caseEvidence.find(e => e.id === log.evidenceId);
                    const getIconColor = (action: string) => {
                      if (action === 'Collected') return 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400';
                      if (action === 'Transferred') return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400';
                      if (action === 'Analyzed') return 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400';
                      return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
                    };

                    return (
                      <div key={log.id} className="relative">
                        {index !== caseLogs.length - 1 && (
                          <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                        )}
                        <div className="flex items-start space-x-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${getIconColor(log.action)}`}>
                            <Shield className="w-6 h-6" />
                          </div>
                          <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <span className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded text-xs font-semibold">
                                {log.action}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(log.createdAt)}</span>
                            </div>
                            <div className="space-y-2 text-sm">
                              {evidence && (
                                <div className="flex items-center space-x-2">
                                  <span className="text-gray-500 dark:text-gray-400">🔖</span>
                                  <span className="text-blue-600 dark:text-blue-400 font-semibold">{evidence.evidenceId}</span>
                                </div>
                              )}
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-500 dark:text-gray-400">👤</span>
                                <span className="text-gray-900 dark:text-white font-medium">{log.performedByName}</span>
                              </div>
                              {log.location && (
                                <div className="flex items-center space-x-2">
                                  <span className="text-gray-500 dark:text-gray-400">📍</span>
                                  <span className="text-gray-700 dark:text-gray-300">{log.location}</span>
                                </div>
                              )}
                              {log.purpose && (
                                <p className="text-gray-600 dark:text-gray-400 mt-2">{log.purpose}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick Add Event Sidebar */}
            <div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Add Event</h3>
                <div className="space-y-2">
                  {caseEvidence.map((evidence) => (
                    <button
                      key={evidence.id}
                      onClick={() => {
                        setSelectedEvidenceId(evidence.id);
                        setShowCustodyModal(true);
                      }}
                      className="w-full flex items-center space-x-2 px-4 py-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors text-left"
                    >
                      <Plus className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-900 dark:text-white truncate">{evidence.evidenceId}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="max-w-3xl">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8">
              <div className="flex items-center space-x-3 mb-8">
                <FileText className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Generate Report</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-base font-semibold text-gray-900 dark:text-white mb-3">Report Type</label>
                  <Select
                    value={{ value: reportType, label: reportType === 'custody' ? 'Chain of Custody Only' : reportType === 'full' ? 'Full Case Report' : reportType === 'evidence' ? 'Evidence Summary' : 'Timeline Report' }}
                    onChange={(option) => setReportType(option?.value as any || 'full')}
                    options={[
                      { value: 'custody', label: 'Chain of Custody Only' },
                      { value: 'full', label: 'Full Case Report' },
                      { value: 'evidence', label: 'Evidence Summary' },
                      { value: 'timeline', label: 'Timeline Report' },
                    ]}
                    className="react-select-container"
                    classNamePrefix="react-select"
                    styles={{
                      control: (base) => ({
                        ...base,
                        backgroundColor: '#f9fafb',
                        borderColor: '#d1d5db',
                        minHeight: '48px',
                        '&:hover': { borderColor: '#9ca3af' },
                      }),
                      singleValue: (base) => ({
                        ...base,
                        color: '#111827',
                      }),
                      menu: (base) => ({
                        ...base,
                        backgroundColor: '#fff',
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isFocused ? '#f3f4f6' : '#fff',
                        color: '#111827',
                        '&:hover': { backgroundColor: '#f3f4f6' },
                      }),
                    }}
                  />
                </div>

                <div>
                  <label className="block text-base font-semibold text-gray-900 dark:text-white mb-3">Include in Report</label>
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reportOptions.includeCaseDetails}
                        onChange={(e) => setReportOptions({ ...reportOptions, includeCaseDetails: e.target.checked })}
                        className="w-5 h-5 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-gray-900 dark:text-white font-medium">Case Details</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reportOptions.includeEvidenceList}
                        onChange={(e) => setReportOptions({ ...reportOptions, includeEvidenceList: e.target.checked })}
                        className="w-5 h-5 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-gray-900 dark:text-white font-medium">Evidence List</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reportOptions.includeHashValues}
                        onChange={(e) => setReportOptions({ ...reportOptions, includeHashValues: e.target.checked })}
                        className="w-5 h-5 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-gray-900 dark:text-white font-medium">Hash Values</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={reportOptions.includeCustodyChain}
                        onChange={(e) => setReportOptions({ ...reportOptions, includeCustodyChain: e.target.checked })}
                        className="w-5 h-5 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span className="text-gray-900 dark:text-white font-medium">Chain of Custody</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <button 
                    onClick={handleGenerateExcel}
                    disabled={isGeneratingReport}
                    className="flex items-center justify-center space-x-2 px-6 py-3 bg-emerald-600 dark:bg-emerald-700 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingReport ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <FileText className="w-5 h-5" />
                    )}
                    <span>Export Excel</span>
                  </button>
                  <button 
                    onClick={handleGeneratePDF}
                    disabled={isGeneratingReport}
                    className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingReport ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <FileText className="w-5 h-5" />
                    )}
                    <span>Export PDF</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showUploadModal && (
        <UploadEvidenceModal 
          onClose={() => setShowUploadModal(false)} 
          caseId={caseId}
        />
      )}

      {showCustodyModal && (
        <AddCustodyEventModal 
          onClose={() => {
            setShowCustodyModal(false);
            setSelectedEvidenceId('');
          }}
          caseId={caseId}
          evidenceId={selectedEvidenceId}
          evidenceData={caseEvidence.find(e => e.id === selectedEvidenceId)}
        />
      )}
    </div>
  );
}

function UploadEvidenceModal({ onClose, caseId }: { onClose: () => void; caseId: string }) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [formData, setFormData] = useState({
    evidenceId: '',
    evidenceType: 'Digital',
    sourceDevice: '',
    capturedAt: '',
    location: '',
    notes: '',
  });
  const [hash, setHash] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showCaptureModal, setShowCaptureModal] = useState(false);
  const [captureType, setCaptureType] = useState<'photo' | 'video' | 'audio'>('photo');

  // Create evidence mutation
  const createEvidenceMutation = useMutation({
    mutationFn: (data: CreateEvidenceData) => createEvidence(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evidence', { caseId }] });
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    },
  });

  const evidenceTypeOptions = [

   
    { value: 'Digital', label: 'Digital' },
    { value: 'Physical', label: 'Physical' },
    { value: 'Document', label: 'Document' },
    
    { value: 'Image', label: 'Image' },
    { value: 'Video', label: 'Video' },
    { value: 'Audio', label: 'Audio' },
    { value: 'Network', label: 'Network' },

    { value: 'Mobile', label: 'Mobile' },
    { value: 'Computer', label: 'Computer' },
    { value: 'Other', label: 'Other' }
  ]; 

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      await processFile(droppedFile);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      await processFile(selectedFile);
    }
  };

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsUploading(true);
    const calculatedHash = await generateHash(selectedFile);
    setHash(calculatedHash);
    setIsUploading(false);
  };

  const handleCaptureClick = (type: 'photo' | 'video' | 'audio') => {
    setCaptureType(type);
    setShowCaptureModal(true);
  };

  const handleMediaCapture = async (capturedFile: File) => {
    await processFile(capturedFile);
    setShowCaptureModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    if (!hash) {
      setError('Hash generation failed. Please try selecting the file again.');
      return;
    }

    try {
     

      // Convert file to base64
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve(reader.result as string);
        };
        reader.onerror = (error) => {
          reject(error);
        };
        reader.readAsDataURL(file);
      });

      const evidenceData: CreateEvidenceData = {
        caseId,
        filename: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        evidenceType: formData.evidenceType,
        hash,
        hashAlgorithm: 'SHA-256',
        sourceDevice: formData.sourceDevice,
        capturedAt: formData.capturedAt,
        location: formData.location,
        notes: formData.notes,
        filePath: `/evidence/${caseId}/${file.name}`,
        fileData: fileBase64,
      };

      const result = await createEvidenceMutation.mutateAsync(evidenceData);
   
      notify('success', 'Evidence Uploaded', `${file.name} has been uploaded successfully`);
      onClose();
      
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to upload evidence';
      setError(errorMessage);
      notify('error', 'Upload Failed', errorMessage);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Upload className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Upload Evidence</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <p className="text-sm text-emerald-800 dark:text-emerald-200 font-medium">Evidence uploaded successfully!</p>
              </div>
            </div>
          )}
          {/* Capture Options */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">Capture Evidence</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleCaptureClick('photo')}
                className="flex flex-col items-center justify-center p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all group"
              >
                <Camera className="w-8 h-8 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-2" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">Capture Photo</span>
              </button>
              <button
                type="button"
                onClick={() => handleCaptureClick('video')}
                className="flex flex-col items-center justify-center p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-red-500 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all group"
              >
                <Video className="w-8 h-8 text-gray-600 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400 mb-2" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-400">Record Video</span>
              </button>
              <button
                type="button"
                onClick={() => handleCaptureClick('audio')}
                className="flex flex-col items-center justify-center p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all group"
              >
                <Mic className="w-8 h-8 text-gray-600 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 mb-2" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400">Record Audio</span>
              </button>
            </div>
          </div>

          {/* File Upload Area */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Or Upload File *</label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-gray-50 dark:bg-gray-700'
              }`}
            >
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                required={!file}
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                <p className="text-gray-700 dark:text-gray-300 mb-1">Click to upload or drag and drop</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Any file type supported</p>
              </label>
              {file && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-gray-900 dark:text-white font-medium">Selected: {file.name}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{formatBytes(file.size)}</p>
                </div>
              )}
            </div>
          </div>

          {isUploading && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-400">Calculating SHA-256 hash...</p>
            </div>
          )}

          {hash && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
              <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium mb-1">SHA-256 Hash Generated:</p>
              <p className="text-xs font-mono text-emerald-800 dark:text-emerald-300 break-all">{hash}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Evidence ID</label>
              <input
                type="text"
                value={formData.evidenceId}
                onChange={(e) => setFormData({ ...formData, evidenceId: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="Auto-generated"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Evidence Type *</label>
              <Select
                value={evidenceTypeOptions.find(opt => opt.value === formData.evidenceType)}
                onChange={(option) => setFormData({ ...formData, evidenceType: option?.value || 'Digital' })}
                options={evidenceTypeOptions}
                className="react-select-container"
                classNamePrefix="react-select"
                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: '#f9fafb',
                    borderColor: '#d1d5db',
                    minHeight: '48px',
                    '&:hover': { borderColor: '#9ca3af' },
                  }),
                  singleValue: (base) => ({
                    ...base,
                    color: '#111827',
                  }),
                  menu: (base) => ({
                    ...base,
                    backgroundColor: '#fff',
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isFocused ? '#f3f4f6' : '#fff',
                    color: '#111827',
                    '&:hover': { backgroundColor: '#f3f4f6' },
                  }),
                }}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Source Device</label>
            <input
              type="text"
              value={formData.sourceDevice}
              onChange={(e) => setFormData({ ...formData, sourceDevice: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="e.g., iPhone 14 Pro, Dell Laptop SN123456"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Captured Date/Time</label>
              <input
                type="datetime-local"
                value={formData.capturedAt}
                onChange={(e) => setFormData({ ...formData, capturedAt: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Collection Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="Where evidence was collected"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
              rows={4}
              placeholder="Additional notes about this evidence"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              disabled={!file || isUploading || createEvidenceMutation.isPending || success}
            >
              {success ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Uploaded!</span>
                </>
              ) : createEvidenceMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span>Upload Evidence</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Media Capture Modal */}
      <MediaCaptureModal
        isOpen={showCaptureModal}
        onClose={() => setShowCaptureModal(false)}
        onCapture={handleMediaCapture}
        captureType={captureType}
      />
    </div>
  );
}

function AddCustodyEventModal({
  onClose,
  caseId,
  evidenceId,
  evidenceData,
}: {
  onClose: () => void;
  caseId: string;
  evidenceId: string;
  evidenceData?: any;
}) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    action: 'Collected',
    location: '',
    purpose: '',
    notes: '',
  });
  const [error, setError] = useState('');

  const createCustodyMutation = useMutation({
    mutationFn: (data: CreateCustodyLogData) => createCustodyLog(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custodyLogs', { caseId }] });
      notify('success', 'Custody Event Added', 'Chain of custody event has been recorded successfully');
    },
    onError: (error: any) => {
      notify('error', 'Failed to Add Event', error.message || 'Failed to record custody event');
    },
  });

  const actionOptions = [
    { value: 'Collected', label: 'Collected' },
    { value: 'Transferred', label: 'Transferred' },
    { value: 'Analyzed', label: 'Analyzed' },
    { value: 'Stored', label: 'Stored' },
    { value: 'Released', label: 'Released' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!evidenceId) {
      setError('Please select an evidence item to log.');
      return;
    }

    try {
      const payload: CreateCustodyLogData = {
        evidenceId,
        caseId,
        action: formData.action,
        location: formData.location,
        purpose: formData.purpose,
        notes: formData.notes,
      };

      await createCustodyMutation.mutateAsync(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record custody event');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🔄</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add Custody Event</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {/* Selected Evidence Display */}
          {evidenceData && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200">Selected Evidence</h3>
              </div>
              <div className="space-y-1 text-sm">
                <p className="text-blue-800 dark:text-blue-300">
                  <span className="font-semibold">ID:</span> {evidenceData.evidenceId}
                </p>
                <p className="text-blue-800 dark:text-blue-300">
                  <span className="font-semibold">File:</span> {evidenceData.filename}
                </p>
                <p className="text-blue-800 dark:text-blue-300">
                  <span className="font-semibold">Type:</span> {evidenceData.evidenceType}
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Action *</label>
            <Select
              value={actionOptions.find(opt => opt.value === formData.action)}
              onChange={(option) => setFormData({ ...formData, action: option?.value || 'Collected' })}
              options={actionOptions}
              className="react-select-container"
              classNamePrefix="react-select"
              styles={{
                control: (base) => ({
                  ...base,
                  backgroundColor: '#f9fafb',
                  borderColor: '#d1d5db',
                  minHeight: '48px',
                  '&:hover': { borderColor: '#9ca3af' },
                }),
                singleValue: (base) => ({
                  ...base,
                  color: '#111827',
                }),
                menu: (base) => ({
                  ...base,
                  backgroundColor: '#fff',
                }),
                option: (base, state) => ({
                  ...base,
                  backgroundColor: state.isFocused ? '#f3f4f6' : '#fff',
                  color: '#111827',
                  '&:hover': { backgroundColor: '#f3f4f6' },
                }),
              }}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              placeholder="Physical or digital location"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">Purpose / Notes</label>
            <textarea
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all resize-none"
              rows={4}
              placeholder="Reason for this action"
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-300">
              This event will be recorded with your identity (opeyemiademon@gmail.com) and timestamped. Chain-of-custody events cannot be modified or deleted once created.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-6 py-3 bg-orange-600 dark:bg-orange-500 text-white rounded-lg hover:bg-orange-700 dark:hover:bg-orange-600 transition-all font-medium shadow-lg"
            >
              Record Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
