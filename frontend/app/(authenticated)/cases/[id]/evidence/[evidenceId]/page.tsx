'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Copy, CheckCircle, Shield } from 'lucide-react';
import { mockEvidence, mockCustodyLogs, mockCases } from '@/lib/mockData';
import { formatDate } from '@/lib/utils';
import QRCode from 'qrcode';

export default function EvidenceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const evidenceId = params.evidenceId as string;
  const caseId = params.id as string;
  
  const evidence = mockEvidence.find(e => e.id === evidenceId);
  const caseData = mockCases.find(c => c.id === caseId);
  const evidenceLogs = mockCustodyLogs.filter(log => log.evidenceId === evidenceId);
  
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

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

  if (!evidence) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 flex items-center justify-center transition-colors">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Evidence not found</h3>
          <p className="text-gray-600 dark:text-gray-400">The evidence you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const md5Hash = 'd41d8cd98f00b204e9800998ecf8427e'; // Mock MD5

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
                <span className="text-sm text-gray-600 dark:text-gray-400">{evidence.evidenceId}</span>
                {evidence.verified && (
                  <span className="flex items-center space-x-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs font-medium">
                    <CheckCircle className="w-3 h-3" />
                    <span>Verified</span>
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{evidence.filename}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Case: {caseData?.caseId} - {caseData?.title}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors">
              Add Event
            </button>
            <button className="px-4 py-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors">
              Verify Integrity
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
                  <p className="text-sm text-gray-600 mb-1">CAPTURED AT</p>
                  <p className="text-gray-900 font-medium">Not specified</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">FILE SIZE</p>
                  <p className="text-gray-900 font-medium">{(evidence.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">UPLOADED</p>
                  <p className="text-gray-900 font-medium">Feb 11, 2026 20:00</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">SOURCE DEVICE</p>
                  <p className="text-gray-900 font-medium">{evidence.sourceDevice}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">LAST VERIFIED</p>
                  <p className="text-gray-900 font-medium">Never</p>
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
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <span>#</span>
                <span>Hash Values</span>
              </h2>

              <div className="space-y-4">
                {/* SHA-256 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400"># SHA-256</span>
                    <button
                      onClick={() => copyToClipboard(evidence.sha256Hash, 'sha256')}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      title="Copy to clipboard"
                    >
                      {copiedHash === 'sha256' ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">{evidence.sha256Hash}</p>
                </div>

                {/* MD5 (Legacy) */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400"># MD5 (Legacy)</span>
                    <button
                      onClick={() => copyToClipboard(md5Hash, 'md5')}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      title="Copy to clipboard"
                    >
                      {copiedHash === 'md5' ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs font-mono text-gray-700 break-all">{md5Hash}</p>
                </div>
              </div>
            </div>

            {/* Chain of Custody */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center space-x-2">
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
                        log.action === 'Analyzed' ? 'bg-purple-100' :
                        log.action === 'Transferred' ? 'bg-yellow-100' :
                        'bg-blue-100'
                      }`}>
                        <Shield className={`w-5 h-5 ${
                          log.action === 'Analyzed' ? 'text-purple-600' :
                          log.action === 'Transferred' ? 'text-yellow-600' :
                          'text-blue-600'
                        }`} />
                      </div>
                      <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-4 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded text-xs font-medium">
                            {log.action}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(log.timestamp)}</span>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-500 dark:text-gray-400">👤</span>
                            <span className="text-gray-900 dark:text-white">{log.performedBy}</span>
                          </div>
                          {log.performedTo && (
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500 dark:text-gray-400">📍</span>
                              <span className="text-gray-700 dark:text-gray-300">{log.performedTo}</span>
                            </div>
                          )}
                          <p className="text-gray-600 dark:text-gray-400 mt-2">{log.purpose}</p>
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
              
              <button className="w-full px-4 py-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
                Download QR
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
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">0</div>
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
    </div>
  );
}
