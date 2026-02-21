'use client';

import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Header from '@/components/Header';
import { Search, FolderOpen, FileText, Calendar, User, ChevronRight, Grid, List, X, FolderPlus, Upload, Edit, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import type { CasePriority } from '@/types';
import Select from 'react-select';
import { 
  getAllCases, 
  createCase, 
  updateCase, 
  deleteCase,
  CaseData,
  CreateCaseData,
  UpdateCaseData,
  createEvidence,
  CreateEvidenceData
} from '@/lib/api_services';

export default function CasesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  const [editingCase, setEditingCase] = useState<CaseData | null>(null);
  const [deletingCase, setDeletingCase] = useState<CaseData | null>(null);
  const [uploadingEvidence, setUploadingEvidence] = useState<CaseData | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [displayCount, setDisplayCount] = useState(12);

  // Fetch all cases
  const { data: casesData, isLoading, error } = useQuery({
    queryKey: ['cases', { status: statusFilter, search: searchTerm }],
    queryFn: () => getAllCases({ 
      status: statusFilter !== 'All' ? statusFilter : undefined,
      search: searchTerm || undefined 
    }),
  });

  const cases = casesData?.cases || [];
  const totalCases = casesData?.total || 0;

  // Filter by priority on frontend
  const filteredCases = useMemo(() => {
    if (priorityFilter === 'All') return cases;
    return cases.filter(c => c.priority === priorityFilter);
  }, [cases, priorityFilter]);

  // Paginated cases for infinite scroll
  const displayedCases = filteredCases.slice(0, displayCount);
  const hasMore = displayedCases.length < filteredCases.length;

  const handleLoadMore = () => {
    setDisplayCount(prev => prev + 12);
  };

  const handleEdit = (caseItem: CaseData) => {
    setEditingCase(caseItem);
    setShowNewCaseModal(true);
  };

  const handleCloseModal = () => {
    setShowNewCaseModal(false);
    setEditingCase(null);
  };

  const handleCloseDeleteModal = () => {
    setDeletingCase(null);
  };

  const handleCloseUploadModal = () => {
    setUploadingEvidence(null);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      'Open': 'bg-blue-500 text-white',
      'In Progress': 'bg-yellow-500 text-white',
      'Under Review': 'bg-purple-500 text-white',
      'Closed': 'bg-gray-500 text-white',
      'Active': 'bg-green-500 text-white',
    };
    return styles[status] || 'bg-gray-500 text-white';
  };

  const getPriorityBadge = (priority: CasePriority) => {
    const styles: Record<CasePriority, { icon: string; text: string; color: string }> = {
      'Low': { icon: '▼', text: 'Low Priority', color: 'text-gray-500' },
      'Medium': { icon: '▲', text: 'Medium Priority', color: 'text-blue-500' },
      'High': { icon: '⚠', text: 'High Priority', color: 'text-orange-500' },
      'Critical': { icon: '⚠', text: 'Critical Priority', color: 'text-red-500' },
    };
    return styles[priority];
  };

  return (
    <div>
      <Header 
        title="Cases" 
        subtitle="Manage investigation cases and evidence"
      />

      <div className="p-6 space-y-6 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1 flex items-center space-x-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search cases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            
            <Select
              value={{ value: statusFilter, label: statusFilter === 'All' ? `All Status (${totalCases})` : statusFilter }}
              onChange={(option) => setStatusFilter(option?.value || 'All')}
              options={[
                { value: 'All', label: `All Status (${totalCases})` },
                { value: 'Open', label: 'Open' },
                { value: 'In Progress', label: 'In Progress' },
                { value: 'Under Review', label: 'Under Review' },
                { value: 'Closed', label: 'Closed' },
              ]}
              className="w-48"
              styles={{
                control: (base) => ({
                  ...base,
                  minHeight: '42px',
                  borderColor: '#d1d5db',
                  '&:hover': { borderColor: '#9ca3af' },
                }),
              }}
            />

            <Select
              value={{ value: priorityFilter, label: priorityFilter === 'All' ? 'All Priority' : priorityFilter }}
              onChange={(option) => setPriorityFilter(option?.value || 'All')}
              options={[
                { value: 'All', label: 'All Priority' },
                { value: 'Low', label: 'Low' },
                { value: 'Medium', label: 'Medium' },
                { value: 'High', label: 'High' },
                { value: 'Critical', label: 'Critical' },
              ]}
              className="w-48"
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

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowNewCaseModal(true)}
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all font-medium shadow-md hover:shadow-lg flex items-center space-x-2"
            >
              <FolderPlus className="w-5 h-5" />
              <span>New Case</span>
            </button>
            
            <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-all ${
                  viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4 text-gray-700 dark:text-gray-200" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-all ${
                  viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title="List View"
              >
                <List className="w-4 h-4 text-gray-700 dark:text-gray-200" />
              </button>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="card text-center py-12">
            <Loader2 className="w-12 h-12 text-primary-600 mx-auto animate-spin" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading cases...</p>
          </div>
        )}

        {error && (
          <div className="card bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="text-red-800 dark:text-red-200">Failed to load cases. Please try again.</p>
            </div>
          </div>
        )}

        {!isLoading && !error && (
          <>
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
              {displayedCases.map((caseItem, index) => {
            const priorityInfo = getPriorityBadge(caseItem.priority as CasePriority);
            
            if (viewMode === 'list') {
              return (
                <div 
                  key={caseItem.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-md transition-all duration-300 cursor-pointer animate-fadeIn"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <FolderOpen className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">{caseItem.caseId}</span>
                          <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold ${getStatusBadge(caseItem.status)}`}>
                            {caseItem.status === 'In Progress' ? '⏱ In Progress' : caseItem.status === 'Open' ? ' Open' : caseItem.status}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">{caseItem.title}</h3>
                        
                        {caseItem.location && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{caseItem.location}</p>
                        )}
                        
                        {caseItem.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{caseItem.description}</p>
                        )}
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center space-x-1.5">
                            <User className="w-4 h-4" />
                            <span>{caseItem.investigatorName}</span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <FileText className="w-4 h-4" />
                            <span>{caseItem.evidenceCount} Evidence</span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(caseItem.createdAt)}</span>
                          </div>
                          <div className={`flex items-center space-x-1 ${priorityInfo.color}`}>
                            <span className="text-sm">{priorityInfo.icon}</span>
                            <span className="font-medium">{priorityInfo.text}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                     
                      <button
                        onClick={() => handleEdit(caseItem)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Edit Case"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingCase(caseItem)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete Case"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <Link 
                        href={`/cases/${caseItem.id}`}
                        className="text-primary-600 hover:text-primary-700 flex items-center space-x-1 text-sm font-medium group"
                      >
                        <span>View</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            }
            
            return (
              <Link 
                key={caseItem.id}
                href={`/cases/${caseItem.id}`}
                className="block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:shadow-lg transition-all duration-300 cursor-pointer animate-fadeIn"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <FolderOpen className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">{caseItem.caseId}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold ${getStatusBadge(caseItem.status)}`}>
                    {caseItem.status === 'In Progress' ? '⏱ In Progress' : caseItem.status === 'Open' ? ' Open' : caseItem.status}
                  </span>
                </div>
                
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">{caseItem.title}</h3>
                
                {caseItem.location && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{caseItem.location}</p>
                )}
                
                {caseItem.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{caseItem.description}</p>
                )}
                
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <div className="flex items-center space-x-1.5">
                    <User className="w-4 h-4" />
                    <span>{caseItem.investigatorName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <FileText className="w-4 h-4" />
                      <span>{caseItem.evidenceCount} Evidence</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(caseItem.createdAt)}</span>
                    </div>
                  </div>
                  <div className={`flex items-center space-x-1 ${priorityInfo.color}`}>
                    <span className="text-sm">{priorityInfo.icon}</span>
                    <span className="font-medium">{priorityInfo.text}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2" onClick={(e) => e.preventDefault()}>
                  
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleEdit(caseItem);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Edit Case"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setDeletingCase(caseItem);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete Case"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-primary-600 hover:text-primary-700 flex items-center space-x-1 text-sm font-medium group">
                    <span>View Details</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            );
              })}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={handleLoadMore}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all font-medium shadow-md hover:shadow-lg flex items-center space-x-2"
                >
                  <span>Load More Cases</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {displayedCases.length === 0 && (
              <div className="card text-center py-12">
                <FolderOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No cases found</h3>
                <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filters</p>
              </div>
            )}
          </>
        )}
      </div>

      {showNewCaseModal && (
        <CaseModal 
          caseData={editingCase} 
          onClose={handleCloseModal} 
        />
      )}

      {deletingCase && (
        <DeleteCaseModal 
          caseData={deletingCase}
          onClose={handleCloseDeleteModal}
        />
      )}

    
    </div>
  );
}

function CaseModal({ caseData, onClose }: { caseData: CaseData | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    caseId: caseData?.caseId || '',
    title: caseData?.title || '',
    description: caseData?.description || '',
    status: caseData?.status || 'Open',
    priority: caseData?.priority || 'Medium',
    suspectLabel: caseData?.suspectLabel || '',
    location: caseData?.location || '',
    incidentDate: caseData?.incidentDate || '',
    notes: caseData?.notes || '',
  });
  const [error, setError] = useState('');

  // Create case mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateCaseData) => createCase(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
  });

  // Update case mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCaseData }) => updateCase(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      queryClient.invalidateQueries({ queryKey: ['case'] });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (caseData) {
        const updateData: UpdateCaseData = {
          title: formData.title,
          description: formData.description,
          status: formData.status,
          priority: formData.priority,
          suspectLabel: formData.suspectLabel,
          location: formData.location,
          incidentDate: formData.incidentDate,
          notes: formData.notes,
        };
        await updateMutation.mutateAsync({ id: caseData.id, data: updateData });
      } else {
        await createMutation.mutateAsync(formData as CreateCaseData);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const statusOptions = [
    { value: 'Open', label: 'Open' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Under Review', label: 'Under Review' },
    { value: 'Closed', label: 'Closed' },
  ];

  const priorityOptions = [
    { value: 'Low', label: 'Low' },
    { value: 'Medium', label: 'Medium' },
    { value: 'High', label: 'High' },
    { value: 'Critical', label: 'Critical' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <FolderPlus className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {caseData ? 'Edit Case' : 'Create New Case'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Case ID</label>
              <input
                type="text"
                value={formData.caseId}
                onChange={(e) => setFormData({ ...formData, caseId: e.target.value })}
                className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="Auto-generated if empty"
                disabled={!!caseData}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status *</label>
              <Select
                value={statusOptions.find(opt => opt.value === formData.status)}
                onChange={(option) => setFormData({ ...formData, status: option?.value || 'Open' })}
                options={statusOptions}
                className="react-select-container"
                classNamePrefix="react-select"
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: '48px',
                    borderColor: '#d1d5db',
                    '&:hover': { borderColor: '#9ca3af' },
                  }),
                }}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority *</label>
              <Select
                value={priorityOptions.find(opt => opt.value === formData.priority)}
                onChange={(option) => setFormData({ ...formData, priority: option?.value as CasePriority })}
                options={priorityOptions}
                className="react-select-container"
                classNamePrefix="react-select"
                styles={{
                  control: (base) => ({
                    ...base,
                    minHeight: '48px',
                    borderColor: '#d1d5db',
                    '&:hover': { borderColor: '#9ca3af' },
                  }),
                }}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Case Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Enter case title"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Suspect/Incident Label</label>
              <input
                type="text"
                value={formData.suspectLabel}
                onChange={(e) => setFormData({ ...formData, suspectLabel: e.target.value })}
                className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="Enter suspect or incident label"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="Enter location"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Incident Date</label>
            <input
              type="datetime-local"
              value={formData.incidentDate}
              onChange={(e) => setFormData({ ...formData, incidentDate: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
              rows={3}
              placeholder="Enter case description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
              rows={3}
              placeholder="Enter additional notes"
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
              disabled={isLoading}
              className="px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : caseData ? 'Update Case' : 'Create Case'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteCaseModal({ caseData, onClose }: { caseData: CaseData; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCase(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
    },
  });

  const handleDelete = async () => {
    setError('');
    try {
      await deleteMutation.mutateAsync(caseData.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete case');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full animate-slideUp">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Delete Case</h2>
        </div>
        
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}
          
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete case <strong className="text-gray-900 dark:text-white">{caseData.caseId}</strong>?
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            This action cannot be undone.
          </p>
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={deleteMutation.isPending}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete Case'}
          </button>
        </div>
      </div>
    </div>
  );
}

