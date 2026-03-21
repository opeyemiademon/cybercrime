'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Copy, CheckCircle, Shield, Loader2, Download, X, Upload } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import QRCode from 'qrcode';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEvidence, verifyEvidence, getCase, getCustodyLogsByCase, createCustodyLog, CreateCustodyLogData } from '@/lib/api_services';
import { notify } from '@/lib/toast';
import CryptoJS from 'crypto-js';

export default function EvidenceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const evidenceId = params.evidenceId as string;
  const caseId = params.id as string;
  
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [showCustodyModal, setShowCustodyModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  // Fetch evidence details
  const { data: evidence, isLoading: evidenceLoading, error: evidenceError } = useQuery({
    queryKey: ['evidence', evidenceId],
    queryFn: () => getEvidence(evidenceId),
  });

  // Fetch case details
  const { data: caseData, isLoading: caseLoading } = useQuery({
    queryKey: ['case', caseId],
    queryFn: () => getCase(caseId),
    enabled: !!caseId,
  });

  // Fetch custody logs
  const { data: custodyData, isLoading: logsLoading } = useQuery({
    queryKey: ['custodyLogs', { caseId }],
    queryFn: () => getCustodyLogsByCase(caseId),
    enabled: !!caseId,
  });

  const evidenceLogs = custodyData?.logs?.filter(log => log.evidenceId === evidenceId) || [];

  useEffect(() => {
    if (evidence) {
      QRCode.toDataURL(evidence.evidenceId, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      }).then(setQrCodeUrl);
    }
  }, [evidence]);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(type);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleVerifyIntegrity = () => {
    setShowVerifyModal(true);
  };

  const handleDownloadQR = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `${evidence?.evidenceId || 'evidence'}_qr_code.png`;
    link.click();
    };

    const BACKEND_API_SERVER = process.env.NEXT_PUBLIC_API_SERVER||''

  const handleDownloadEvidence = async () => {
    if (!evidence) return;
    
    // Check if filePath exists
    if (evidence.filePath) {
      try {
        // Fetch the file as blob to force download
        const response = await fetch(BACKEND_API_SERVER+ evidence.filePath);
        if (!response.ok) {
          throw new Error('Failed to download file');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        // Create download link
        const link = document.createElement('a');
        link.href = url;
        link.download = evidence.filename;
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
      } catch (error) {
        notify('error', 'Download Failed', 'Could not download the evidence file');
      }
    } else {
      notify('error', 'Download Failed', 'Evidence file path not available');
    }
  };

  if (evidenceLoading || caseLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 mx-auto animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading evidence details...</p>
        </div>
      </div>
    );
  }

  if (evidenceError || !evidence) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center transition-colors">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Evidence not found</h3>
          <p className="text-gray-600 dark:text-gray-400">The evidence you are looking for doesnt exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 transition-colors">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-gray-600 dark:text-gray-400 truncate">{evidence.evidenceId}</span>
              {evidence.verificationStatus === 'Verified' && (
                <span className="flex items-center space-x-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded text-xs font-medium flex-shrink-0">
                  <CheckCircle className="w-3 h-3" />
                  <span>Verified</span>
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate" title={evidence.filename}>
              {evidence.filename}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 truncate">
              Case: {caseData?.caseId} - {caseData?.title}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleDownloadEvidence}
              className="flex items-center space-x-2 px-3 py-2 bg-emerald-600 dark:bg-emerald-500 hover:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
            <button
              onClick={() => setShowCustodyModal(true)}
              className="px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors text-sm"
            >
              Add Event
            </button>
            <button
              onClick={handleVerifyIntegrity}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors text-sm"
            >
              <Shield className="w-4 h-4" />
              <span>Verify Integrity</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Evidence Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Evidence Information */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Evidence Information</h2>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">FILE TYPE</p>
                  <p className="text-gray-900 dark:text-white font-medium">{evidence.fileType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">CAPTURED AT</p>
                  <p className="text-gray-900 dark:text-white font-medium">{evidence.capturedAt ? formatDate(evidence.capturedAt) : 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">FILE SIZE</p>
                  <p className="text-gray-900 dark:text-white font-medium">{(evidence.fileSize / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">UPLOADED</p>
                  <p className="text-gray-900 dark:text-white font-medium">{formatDate(evidence.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">SOURCE DEVICE</p>
                  <p className="text-gray-900 dark:text-white font-medium">{evidence.sourceDevice || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">LAST VERIFIED</p>
                  <p className="text-gray-900 dark:text-white font-medium">{evidence.lastVerifiedAt ? formatDate(evidence.lastVerifiedAt) : 'Never'}</p>
                </div>
              </div>

              {evidence.notes && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">NOTES</p>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">{evidence.notes}</p>
                </div>
              )}
            </div>

            {/* Hash Values */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <span>#</span>
                <span>Hash Values</span>
              </h2>

              <div className="space-y-4">
                {/* SHA-256 */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400"># SHA-256</span>
                    <button
                      onClick={() => copyToClipboard(evidence.hash, 'sha256')}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                      title="Copy to clipboard"
                    >
                      {copiedHash === 'sha256' ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">{evidence.hash}</p>
                </div>

                {/* Hash Algorithm */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Algorithm</p>
                  <p className="text-sm text-gray-900 dark:text-white font-medium">{evidence.hashAlgorithm || 'SHA-256'}</p>
                </div>
              </div>
            </div>

            {/* Chain of Custody */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Chain of Custody</span>
              </h2>

              <div className="space-y-4">
                {evidenceLogs.map((log, index) => (
                  <div key={log.id} className="relative">
                    {index !== evidenceLogs.length - 1 && (
                      <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                    )}
                    <div className="flex items-start space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        log.action === 'Analyzed' ? 'bg-purple-100 dark:bg-purple-900' :
                        log.action === 'Transferred' ? 'bg-yellow-100 dark:bg-yellow-900' :
                        'bg-blue-100 dark:bg-blue-900'
                      }`}>
                        <Shield className={`w-5 h-5 ${
                          log.action === 'Analyzed' ? 'text-purple-600 dark:text-purple-400' :
                          log.action === 'Transferred' ? 'text-yellow-600 dark:text-yellow-400' :
                          'text-blue-600 dark:text-blue-400'
                        }`} />
                      </div>
                      <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-4 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded text-xs font-medium">
                            {log.action}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(log.createdAt)}</span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-500 dark:text-gray-400">👤</span>
                            <span className="text-gray-900 dark:text-white">{log.performedByName}</span>
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
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - QR Code and Stats */}
          <div className="space-y-6">
            {/* QR Code */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <span>📱</span>
                <span>Evidence Label QR Code</span>
              </h3>
              
              {qrCodeUrl && (
                <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 mb-4 transition-colors">
                  <img src={qrCodeUrl} alt="Evidence QR Code" className="w-full" />
                </div>
              )}
              
              <p className="text-xs text-gray-600 dark:text-gray-400 text-center mb-3">
                Scan to verify evidence identity
              </p>
              
              <button 
                onClick={handleDownloadQR}
                disabled={!qrCodeUrl}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                <span>Download QR</span>
              </button>
            </div>

            {/* Custody Events Counter */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">Custody Events</h3>
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">{evidenceLogs.length}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total events recorded</p>
            </div>

            {/* Verifications Counter */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">Verifications</h3>
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">{evidence.verificationCount || 0}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Integrity checks performed</p>
            </div>

            {/* Transfers Counter */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 transition-colors">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">Transfers</h3>
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
                {evidenceLogs.filter(log => log.action === 'Transferred').length}
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Chain of custody transfers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showVerifyModal && evidence && (
        <VerifyIntegrityModal
          onClose={() => setShowVerifyModal(false)}
          evidence={evidence}
          evidenceId={evidenceId}
        />
      )}

      {showCustodyModal && evidence && (
        <AddCustodyEventModal
          onClose={() => setShowCustodyModal(false)}
          caseId={caseId}
          evidenceId={evidenceId}
          evidenceData={evidence}
        />
      )}
    </div>
  );
}

function VerifyIntegrityModal({
  onClose,
  evidence,
  evidenceId,
}: {
  onClose: () => void;
  evidence: any;
  evidenceId: string;
}) {
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [calculatedHash, setCalculatedHash] = useState<string>('');
  const [verificationResult, setVerificationResult] = useState<'pending' | 'success' | 'failed'>('pending');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsVerifying(true);
    setVerificationResult('pending');

    try {
      // Read file and calculate hash
      const arrayBuffer = await file.arrayBuffer();
      const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer as any);
      const hash = CryptoJS.SHA256(wordArray).toString();
      
      setCalculatedHash(hash);

      // Compare with stored hash
      if (hash === evidence.hash) {
        setVerificationResult('success');
        
        // Call API to update verification count
        await verifyEvidence({
          evidenceId: evidence.id,
          hash: hash,
        });
        
        queryClient.invalidateQueries({ queryKey: ['evidence', evidenceId] });
        notify('success', 'Integrity Verified', 'Evidence hash matches stored value');
      } else {
        setVerificationResult('failed');
        notify('error', 'Integrity Failed', 'Evidence hash does not match stored value');
      }
    } catch (error: any) {
      notify('error', 'Verification Failed', error.message || 'Failed to verify evidence');
      setVerificationResult('failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    notify('success', 'Copied', 'Hash copied to clipboard');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Verify Evidence Integrity</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Evidence Info */}
          <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">{evidence.filename}</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              <span className="font-medium">Evidence ID:</span> {evidence.evidenceId}
            </p>
          </div>

          {/* Stored Hash */}
          <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400"># Stored SHA-256 Hash</h3>
              <button
                onClick={() => copyHash(evidence.hash)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                title="Copy to clipboard"
              >
                <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            </div>
            <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
              {evidence.hash}
            </p>
          </div>

          {/* File Upload */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Upload file to verify integrity</h3>
            <label className="block">
              <input
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isVerifying}
              />
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer">
                {isVerifying ? (
                  <div className="flex flex-col items-center space-y-3">
                    <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Calculating hash...</p>
                  </div>
                ) : selectedFile ? (
                  <div className="flex flex-col items-center space-y-3">
                    <CheckCircle className={`w-12 h-12 ${
                      verificationResult === 'success' ? 'text-emerald-600' :
                      verificationResult === 'failed' ? 'text-red-600' :
                      'text-gray-400'
                    }`} />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-3">
                    <Upload className="w-12 h-12 text-gray-400" />
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Click to select file</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Upload the evidence file to verify its integrity
                    </p>
                  </div>
                )}
              </div>
            </label>
          </div>

          {/* Calculated Hash */}
          {calculatedHash && (
            <div className={`border rounded-lg p-4 ${
              verificationResult === 'success' 
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className={`text-sm font-medium ${
                  verificationResult === 'success'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  # Calculated SHA-256 Hash
                </h3>
                <button
                  onClick={() => copyHash(calculatedHash)}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                  title="Copy to clipboard"
                >
                  <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
              <p className={`text-xs font-mono break-all ${
                verificationResult === 'success'
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-red-700 dark:text-red-300'
              }`}>
                {calculatedHash}
              </p>
            </div>
          )}

          {/* Verification Result */}
          {verificationResult !== 'pending' && (
            <div className={`border rounded-lg p-4 ${
              verificationResult === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center space-x-3">
                {verificationResult === 'success' ? (
                  <>
                    <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <h3 className="font-semibold text-emerald-900 dark:text-emerald-200">Verification Successful</h3>
                      <p className="text-sm text-emerald-700 dark:text-emerald-300">
                        The file hash matches the stored hash. Evidence integrity is intact.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <X className="w-6 h-6 text-red-600 dark:text-red-400" />
                    <div>
                      <h3 className="font-semibold text-red-900 dark:text-red-200">Verification Failed</h3>
                      <p className="text-sm text-red-700 dark:text-red-300">
                        The file hash does not match the stored hash. Evidence may have been tampered with.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-medium"
            >
              {verificationResult === 'success' ? 'Done' : 'Cancel'}
            </button>
          </div>
        </div>
      </div>
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
    'Collected',
    'Transferred',
    'Analyzed',
    'Stored',
    'Released',
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
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🔄</div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add Custody Event</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
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
            <select
              value={formData.action}
              onChange={(e) => setFormData({ ...formData, action: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
              required
            >
              {actionOptions.map((action) => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
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
              This event will be recorded with your identity and timestamped. Chain-of-custody events cannot be modified or deleted once created.
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
              disabled={createCustodyMutation.isPending}
              className="px-6 py-3 bg-orange-600 dark:bg-orange-500 text-white rounded-lg hover:bg-orange-700 dark:hover:bg-orange-600 transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {createCustodyMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Recording...</span>
                </>
              ) : (
                <span>Record Event</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
