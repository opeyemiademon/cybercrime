'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  X, ChevronRight, ChevronLeft, FileText, Plus, Trash2,
  Loader2, CheckCircle, Download, Save, AlertCircle
} from 'lucide-react';
import {
  createForensicReport,
  updateForensicReport,
  getForensicReportsByCase,
  deleteForensicReport,
  type ForensicReportData,
  type CreateForensicReportData,
  type ForensicTool
} from '@/lib/api_services/forensicReportApiServices';
import { generateForensicExpertReport } from '@/lib/reportGenerator';
import { notify } from '@/lib/toast';
import { formatDate } from '@/lib/utils';

interface Props {
  caseData: any;
  evidence: any[];
  custodyLogs: any[];
  onClose: () => void;
}

const STEPS = [
  { id: 1, label: 'Cover & Instructions' },
  { id: 2, label: 'Expert Credentials' },
  { id: 3, label: 'Methodology' },
  { id: 4, label: 'Examination Process' },
  { id: 5, label: 'Findings' },
  { id: 6, label: 'Opinion & Conclusion' },
  { id: 7, label: 'Preview & Generate' },
];

const DEFAULT_STANDARDS = [
  'ISO/IEC 27037:2012',
  'ISO/IEC 27042:2015',
  'NIST SP 800-86',
  'ACPO Good Practice Guide for Digital Evidence',
];

const DEFAULT_INDEPENDENCE = `I confirm that I have prepared this report independently and that my opinions are my own, based solely on the evidence examined. I understand my duty to the Court and I have complied with that duty.`;

const DEFAULT_OATH = `I declare that the contents of this report are true to the best of my knowledge and belief, and that I have not wilfully suppressed any material facts.`;

function TextArea({ label, value, onChange, placeholder, rows = 4, hint }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number; hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{hint}</p>}
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y"
      />
    </div>
  );
}

function TextInput({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
      />
    </div>
  );
}

export default function ForensicReportBuilder({ caseData, evidence, custodyLogs, onClose }: Props) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [savedReportId, setSavedReportId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // ── Form state ──────────────────────────────────────────────────────────────
  const [form, setForm] = useState<CreateForensicReportData>({
    caseId: caseData.id,
    // Section 1
    courtTribunal: caseData.courtTribunal || '',
    requestingAuthority: caseData.requestingAuthority || '',
    investigationReference: caseData.investigationReference || '',
    requestingAgency: caseData.requestingAgency || '',
    dateOfInstruction: caseData.dateOfInstruction || '',
    scopeOfEngagement: caseData.scopeOfEngagement || caseData.description || '',
    specificQuestions: caseData.specificQuestions || [''],
    // Section 2
    expertQualifications: '',
    expertExperience: '',
    expertProfessionalBody: '',
    independenceStatement: DEFAULT_INDEPENDENCE,
    oathDeclaration: DEFAULT_OATH,
    // Section 3
    methodology: {
      standardsReferenced: [...DEFAULT_STANDARDS],
      toolsUsed: [{ name: 'Chaintrivex DEMS', version: '1.0', purpose: 'Digital evidence collection, hashing, and chain of custody management' }]
    },
    // Section 4
    examinationProcess: { forensicImaging: '', dataAnalysis: '', timelineExamination: '', artifactRecovery: '' },
    // Section 5
    findings: { fileSystemFindings: '', internetActivity: '', deletedDataRecovery: '', communicationArtifacts: '', timelineCorrelation: '' },
    // Section 6
    limitations: { encryptionIssues: '', damagedSectors: '', cloudAccessRestrictions: '', other: '' },
    expertOpinion: '',
    conclusion: '',
    recommendations: [''],
    status: 'Draft',
  });

  // Existing reports for this case
  const { data: existingReports } = useQuery({
    queryKey: ['forensicReports', caseData.id],
    queryFn: () => getForensicReportsByCase(caseData.id),
  });

  const createMutation = useMutation({
    mutationFn: createForensicReport,
    onSuccess: (report) => {
      setSavedReportId(report.id);
      queryClient.invalidateQueries({ queryKey: ['forensicReports', caseData.id] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateForensicReport(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forensicReports', caseData.id] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteForensicReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forensicReports', caseData.id] });
      notify('success', 'Report Deleted', 'Report has been deleted.');
    }
  });

  const set = (path: string, value: any) => {
    const keys = path.split('.');
    setForm(prev => {
      const updated = { ...prev } as any;
      let ref = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        ref[keys[i]] = { ...ref[keys[i]] };
        ref = ref[keys[i]];
      }
      ref[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  const handleSave = async (finalise = false) => {
    setIsSaving(true);
    try {
      const payload = { ...form, status: finalise ? 'Finalised' : 'Draft' };
      if (savedReportId) {
        const { caseId, ...updatePayload } = payload;
        await updateMutation.mutateAsync({ id: savedReportId, data: updatePayload });
      } else {
        const report = await createMutation.mutateAsync(payload);
        setSavedReportId(report.id);
      }
      notify('success', finalise ? 'Report Finalised' : 'Draft Saved',
        finalise ? 'Report has been finalised.' : 'Draft saved successfully.');
    } catch (err: any) {
      notify('error', 'Save Failed', err.message || 'Failed to save report');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      // Save first if not saved
      let reportId = savedReportId;
      if (!reportId) {
        const report = await createMutation.mutateAsync({ ...form, status: 'Finalised' });
        reportId = report.id;
        setSavedReportId(reportId);
      } else {
        const { caseId, ...updatePayload } = { ...form, status: 'Finalised' };
        await updateMutation.mutateAsync({ id: reportId, data: updatePayload });
      }

      // Build forensic report object matching ForensicReportData shape
      const reportObj: ForensicReportData = {
        ...form,
        id: reportId!,
        caseRef: caseData.caseId,
        generatedBy: '',
        generatedByName: '',
        reportDate: new Date().toISOString(),
        status: 'Finalised',
      } as any;

      generateForensicExpertReport(reportObj, caseData, evidence, custodyLogs);
      notify('success', 'PDF Generated', 'Expert Opinion Report has been downloaded.');
      queryClient.invalidateQueries({ queryKey: ['forensicReports', caseData.id] });
    } catch (err: any) {
      notify('error', 'Generation Failed', err.message || 'Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const loadExistingReport = (report: ForensicReportData) => {
    setSavedReportId(report.id);
    setForm({
      caseId: caseData.id,
      courtTribunal: report.courtTribunal || '',
      requestingAuthority: report.requestingAuthority || '',
      investigationReference: report.investigationReference || '',
      requestingAgency: report.requestingAgency || '',
      dateOfInstruction: report.dateOfInstruction || '',
      scopeOfEngagement: report.scopeOfEngagement || '',
      specificQuestions: report.specificQuestions?.length ? report.specificQuestions : [''],
      expertQualifications: report.expertQualifications || '',
      expertExperience: report.expertExperience || '',
      expertProfessionalBody: report.expertProfessionalBody || '',
      independenceStatement: report.independenceStatement || DEFAULT_INDEPENDENCE,
      oathDeclaration: report.oathDeclaration || DEFAULT_OATH,
      methodology: report.methodology || { standardsReferenced: [...DEFAULT_STANDARDS], toolsUsed: [] },
      examinationProcess: report.examinationProcess || { forensicImaging: '', dataAnalysis: '', timelineExamination: '', artifactRecovery: '' },
      findings: report.findings || { fileSystemFindings: '', internetActivity: '', deletedDataRecovery: '', communicationArtifacts: '', timelineCorrelation: '' },
      limitations: report.limitations || { encryptionIssues: '', damagedSectors: '', cloudAccessRestrictions: '', other: '' },
      expertOpinion: report.expertOpinion || '',
      conclusion: report.conclusion || '',
      recommendations: report.recommendations?.length ? report.recommendations : [''],
      status: report.status as any,
    });
    setStep(1);
    notify('success', 'Report Loaded', 'Existing report loaded for editing.');
  };

  // ── Rendering helpers ───────────────────────────────────────────────────────

  const renderStep = () => {
    switch (step) {
      // ── STEP 1: Cover & Instructions ──────────────────────────────────────
      case 1: return (
        <div className="space-y-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
            These fields populate Section 1 (Cover Page) and Section 3 (Instructions Received) of the report.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput label="Court / Tribunal" value={form.courtTribunal || ''} onChange={v => set('courtTribunal', v)} placeholder="e.g. High Court of Justice" />
            <TextInput label="Requesting Authority" value={form.requestingAuthority || ''} onChange={v => set('requestingAuthority', v)} placeholder="e.g. Metropolitan Police" />
            <TextInput label="Investigation Reference" value={form.investigationReference || ''} onChange={v => set('investigationReference', v)} placeholder="e.g. INV-2026-00123" />
            <TextInput label="Requesting Agency" value={form.requestingAgency || ''} onChange={v => set('requestingAgency', v)} placeholder="e.g. CID Unit 4" />
            <TextInput label="Date of Instruction" type="date" value={form.dateOfInstruction?.split('T')[0] || ''} onChange={v => set('dateOfInstruction', v)} />
          </div>

          <TextArea
            label="Scope of Engagement"
            value={form.scopeOfEngagement || ''}
            onChange={v => set('scopeOfEngagement', v)}
            placeholder="Describe the scope of the forensic examination..."
            rows={4}
            hint="Summarise what the expert was asked to examine and why."
          />

          <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Specific Questions Asked</label>
            <div className="space-y-2">
              {(form.specificQuestions || ['']).map((q, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={q}
                    onChange={e => {
                      const updated = [...(form.specificQuestions || [''])];
                      updated[i] = e.target.value;
                      set('specificQuestions', updated);
                    }}
                    placeholder={`Question ${i + 1}`}
                    className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = (form.specificQuestions || ['']).filter((_, idx) => idx !== i);
                      set('specificQuestions', updated.length ? updated : ['']);
                    }}
                    className="p-2 text-red-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => set('specificQuestions', [...(form.specificQuestions || ['']), ''])}
                className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Plus className="w-4 h-4" /> Add Question
              </button>
            </div>
          </div>
        </div>
      );

      // ── STEP 2: Expert Credentials ────────────────────────────────────────
      case 2: return (
        <div className="space-y-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
            Populates Section 2 (Expert Credentials and Declaration) of the report.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput label="Qualifications" value={form.expertQualifications || ''} onChange={v => set('expertQualifications', v)} placeholder="e.g. BSc Digital Forensics, GCFE, EnCE" />
            <TextInput label="Professional Body / Memberships" value={form.expertProfessionalBody || ''} onChange={v => set('expertProfessionalBody', v)} placeholder="e.g. ISFCE, IACIS" />
          </div>
          <TextArea label="Experience" value={form.expertExperience || ''} onChange={v => set('expertExperience', v)} placeholder="Summarise relevant professional experience..." rows={3} />
          <TextArea label="Independence Statement" value={form.independenceStatement || ''} onChange={v => set('independenceStatement', v)} rows={4} hint="Edit if the default statement does not apply." />
          <TextArea label="Oath / Declaration" value={form.oathDeclaration || ''} onChange={v => set('oathDeclaration', v)} rows={3} />
        </div>
      );

      // ── STEP 3: Methodology ───────────────────────────────────────────────
      case 3: return (
        <div className="space-y-5">
          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
            Populates Section 6 (Methodology) of the report.
          </p>

          <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Standards Referenced</label>
            <div className="space-y-2">
              {(form.methodology?.standardsReferenced || []).map((s, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={s}
                    onChange={e => {
                      const updated = [...(form.methodology?.standardsReferenced || [])];
                      updated[i] = e.target.value;
                      set('methodology.standardsReferenced', updated);
                    }}
                    className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = (form.methodology?.standardsReferenced || []).filter((_, idx) => idx !== i);
                      set('methodology.standardsReferenced', updated);
                    }}
                    className="p-2 text-red-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => set('methodology.standardsReferenced', [...(form.methodology?.standardsReferenced || []), ''])}
                className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Plus className="w-4 h-4" /> Add Standard
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Forensic Tools Used</label>
            <div className="space-y-3">
              {(form.methodology?.toolsUsed || []).map((tool, i) => (
                <div key={i} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      value={tool.name}
                      onChange={e => {
                        const updated = [...(form.methodology?.toolsUsed || [])];
                        updated[i] = { ...updated[i], name: e.target.value };
                        set('methodology.toolsUsed', updated);
                      }}
                      placeholder="Tool name"
                      className="px-3 py-2 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <input
                      value={tool.version}
                      onChange={e => {
                        const updated = [...(form.methodology?.toolsUsed || [])];
                        updated[i] = { ...updated[i], version: e.target.value };
                        set('methodology.toolsUsed', updated);
                      }}
                      placeholder="Version"
                      className="px-3 py-2 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = (form.methodology?.toolsUsed || []).filter((_, idx) => idx !== i);
                        set('methodology.toolsUsed', updated);
                      }}
                      className="p-2 text-red-400 hover:text-red-600 flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    value={tool.purpose}
                    onChange={e => {
                      const updated = [...(form.methodology?.toolsUsed || [])];
                      updated[i] = { ...updated[i], purpose: e.target.value };
                      set('methodology.toolsUsed', updated);
                    }}
                    placeholder="Purpose / description"
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => set('methodology.toolsUsed', [...(form.methodology?.toolsUsed || []), { name: '', version: '', purpose: '' } as ForensicTool])}
                className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Plus className="w-4 h-4" /> Add Tool
              </button>
            </div>
          </div>
        </div>
      );

      // ── STEP 4: Examination Process ───────────────────────────────────────
      case 4: return (
        <div className="space-y-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
            Populates Section 7 (Examination Process) of the report.
          </p>
          <TextArea label="Forensic Imaging" value={form.examinationProcess?.forensicImaging || ''} onChange={v => set('examinationProcess.forensicImaging', v)} placeholder="Describe the forensic imaging process, tools used, and write-blockers..." rows={3} />
          <TextArea label="Data Analysis" value={form.examinationProcess?.dataAnalysis || ''} onChange={v => set('examinationProcess.dataAnalysis', v)} placeholder="Describe how data was analysed..." rows={3} />
          <TextArea label="Timeline Examination" value={form.examinationProcess?.timelineExamination || ''} onChange={v => set('examinationProcess.timelineExamination', v)} placeholder="Describe how events were correlated and timelines constructed..." rows={3} />
          <TextArea label="Artifact Recovery" value={form.examinationProcess?.artifactRecovery || ''} onChange={v => set('examinationProcess.artifactRecovery', v)} placeholder="Describe recovery of deleted files, browser history, communications etc..." rows={3} />
        </div>
      );

      // ── STEP 5: Findings ──────────────────────────────────────────────────
      case 5: return (
        <div className="space-y-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
            Populates Section 8 (Findings) of the report.
          </p>
          <TextArea label="File System Findings" value={form.findings?.fileSystemFindings || ''} onChange={v => set('findings.fileSystemFindings', v)} placeholder="Document file structure, notable directories, timestamps..." rows={3} />
          <TextArea label="Internet Activity" value={form.findings?.internetActivity || ''} onChange={v => set('findings.internetActivity', v)} placeholder="Browser history, downloads, web searches, cookies..." rows={3} />
          <TextArea label="Deleted Data Recovery" value={form.findings?.deletedDataRecovery || ''} onChange={v => set('findings.deletedDataRecovery', v)} placeholder="Recovered deleted files and their significance..." rows={3} />
          <TextArea label="Communication Artifacts" value={form.findings?.communicationArtifacts || ''} onChange={v => set('findings.communicationArtifacts', v)} placeholder="Emails, messages, call logs, contact lists..." rows={3} />
          <TextArea label="Timeline Correlation" value={form.findings?.timelineCorrelation || ''} onChange={v => set('findings.timelineCorrelation', v)} placeholder="How digital timestamps align with the alleged events..." rows={3} />
        </div>
      );

      // ── STEP 6: Opinion & Conclusion ──────────────────────────────────────
      case 6: return (
        <div className="space-y-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
            Populates Sections 9–12 (Limitations, Expert Opinion, Conclusion, Recommendations).
          </p>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-2">Limitations (Section 9)</p>
            <div className="space-y-3">
              <TextArea label="Encryption Issues" value={form.limitations?.encryptionIssues || ''} onChange={v => set('limitations.encryptionIssues', v)} placeholder="Encrypted volumes, password-protected files..." rows={2} />
              <TextArea label="Damaged Sectors" value={form.limitations?.damagedSectors || ''} onChange={v => set('limitations.damagedSectors', v)} placeholder="Bad sectors, corrupted file systems..." rows={2} />
              <TextArea label="Cloud Access Restrictions" value={form.limitations?.cloudAccessRestrictions || ''} onChange={v => set('limitations.cloudAccessRestrictions', v)} placeholder="Inaccessible cloud services, legal restrictions..." rows={2} />
              <TextArea label="Other Limitations" value={form.limitations?.other || ''} onChange={v => set('limitations.other', v)} placeholder="Any other limitations..." rows={2} />
            </div>
          </div>

          <TextArea
            label="Expert Opinion (Section 10)"
            value={form.expertOpinion || ''}
            onChange={v => set('expertOpinion', v)}
            placeholder="State your professional opinion based on the evidence examined and on the balance of probabilities..."
            rows={5}
            hint="This is the expert's formal opinion. Be precise and measured."
          />

          <TextArea
            label="Conclusion (Section 11)"
            value={form.conclusion || ''}
            onChange={v => set('conclusion', v)}
            placeholder="Provide a clear summary of your findings relative to the allegations or questions asked..."
            rows={5}
          />

          <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Recommendations (Section 12)</label>
            <div className="space-y-2">
              {(form.recommendations || ['']).map((r, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={r}
                    onChange={e => {
                      const updated = [...(form.recommendations || [''])];
                      updated[i] = e.target.value;
                      set('recommendations', updated);
                    }}
                    placeholder={`Recommendation ${i + 1}`}
                    className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button type="button" onClick={() => {
                    const updated = (form.recommendations || ['']).filter((_, idx) => idx !== i);
                    set('recommendations', updated.length ? updated : ['']);
                  }} className="p-2 text-red-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => set('recommendations', [...(form.recommendations || ['']), ''])}
                className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                <Plus className="w-4 h-4" /> Add Recommendation
              </button>
            </div>
          </div>
        </div>
      );

      // ── STEP 7: Preview & Generate ────────────────────────────────────────
      case 7: return (
        <div className="space-y-5">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Report Ready to Generate</p>
            </div>
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              The report will be generated as a PDF covering all 13 sections of the Digital Forensic Expert Opinion Report format.
            </p>
          </div>

          {/* Summary */}
          <div className="space-y-2">
            {[
              ['Case Reference', caseData.caseId],
              ['Case Title', caseData.title],
              ['Court / Tribunal', form.courtTribunal || '—'],
              ['Requesting Authority', form.requestingAuthority || '—'],
              ['Investigation Reference', form.investigationReference || '—'],
              ['Expert Qualifications', form.expertQualifications || '—'],
              ['Evidence Items', String(evidence.length)],
              ['Custody Log Entries', String(custodyLogs.length)],
              ['Standards Referenced', String(form.methodology?.standardsReferenced?.filter(Boolean).length || 0)],
              ['Tools Listed', String(form.methodology?.toolsUsed?.filter(t => t.name).length || 0)],
              ['Recommendations', String((form.recommendations || []).filter(Boolean).length)],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between text-sm border-b border-gray-100 dark:border-gray-700 pb-1">
                <span className="text-gray-500 dark:text-gray-400">{label}</span>
                <span className="font-medium text-gray-900 dark:text-white text-right max-w-[60%]">{val}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={handleGeneratePDF}
              disabled={isGenerating || isSaving}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              Generate & Download Expert Opinion PDF
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={isSaving || isGenerating}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              Finalise Report (Save without PDF)
            </button>
          </div>

          {/* Existing reports */}
          {existingReports && existingReports.reports.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Previous Reports for this Case</p>
              <div className="space-y-2">
                {existingReports.reports.map((r) => (
                  <div key={r.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2">
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{r.caseRef}</span>
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded font-semibold ${
                        r.status === 'Finalised' ? 'bg-emerald-100 text-emerald-700' :
                        r.status === 'Submitted' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{r.status}</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(r.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => loadExistingReport(r)}
                        className="text-xs px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Delete this report?')) deleteMutation.mutate(r.id);
                        }}
                        className="text-xs px-3 py-1 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );

      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 dark:bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-3xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Expert Opinion Report Builder</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">{caseData.caseId} — {STEPS[step - 1].label}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <div className="flex gap-1 overflow-x-auto">
            {STEPS.map(s => (
              <button
                key={s.id}
                onClick={() => setStep(s.id)}
                className={`flex-shrink-0 px-2 py-1 rounded text-xs font-medium transition-colors ${
                  step === s.id
                    ? 'bg-blue-600 text-white'
                    : step > s.id
                    ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
              >
                {s.id}. {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {renderStep()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <div className="flex gap-2">
            <button
              onClick={() => setStep(s => Math.max(1, s - 1))}
              disabled={step === 1}
              className="flex items-center gap-1 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button
              onClick={() => setStep(s => Math.min(STEPS.length, s + 1))}
              disabled={step === STEPS.length}
              className="flex items-center gap-1 px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-40"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2">
            {savedReportId && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="w-3 h-3" /> Draft saved
              </span>
            )}
            <button
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="flex items-center gap-1 px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
