import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Modal, Steps, Button as AntButton, Form, Input, Select, Row, Col, DatePicker, Upload, Space, Spin, Alert } from "antd";
import { Button } from "@/components/ui/button";
import { extractCertificateInfo, platforms } from "@/utils/credentialUtils";
import { AddMethod, Platform, CredentialFormValues } from "@/types/credentials";
import { importCertificateFromUrl, isSupportedCertificateUrl } from "@/services/certificateService";
import dayjs from "dayjs";

interface CredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  editing: any;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  addMethod: AddMethod | null;
  setAddMethod: (method: AddMethod | null) => void;
  selectedPlatform: string | null;
  setSelectedPlatform: (platform: string | null) => void;
  file: File | null;
  setFile: (file: File | null) => void;
  formValues: any;
  setFormValues: (values: any) => void;
  skillsData: any;
  loadingSkills: boolean;
  onSubmit: () => void;
  onAnchor: () => void;
  submitting: boolean;
  form: any;
}

export const CredentialModal: React.FC<CredentialModalProps> = ({
  isOpen,
  onClose,
  editing,
  currentStep,
  setCurrentStep,
  addMethod,
  setAddMethod,
  selectedPlatform,
  setSelectedPlatform,
  file,
  setFile,
  formValues,
  setFormValues,
  skillsData,
  loadingSkills,
  onSubmit,
  onAnchor,
  submitting,
  form,
}) => {
  // Initialize or reset form only when the Form is actually rendered (step 1)
  const [extractingFromUrl, setExtractingFromUrl] = useState(false);
  const [extractingFromImage, setExtractingFromImage] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [extractionSuccess, setExtractionSuccess] = useState<string | null>(null);
  const [urlExtractionTimeout, setUrlExtractionTimeout] = useState<NodeJS.Timeout | null>(null);
  const [autoImageUrl, setAutoImageUrl] = useState<string | null>(null);
  const [currentUrl, setCurrentUrl] = useState<string>("");
  useEffect(() => {
    if (!isOpen || currentStep !== 1) return;
    if (editing) {
      form.setFieldsValue({
        title: editing.title,
        issuer: editing.issuer,
        type: editing.type,
        issueDate: editing.issueDate ? dayjs(editing.issueDate) : undefined,
        description: editing.description,
        skills: editing.skills || [],
        credentialUrl: editing.credentialUrl,
        nsqfLevel: editing.nsqfLevel,
        blockchainAddress: editing.blockchainAddress,
        transactionHash: editing.transactionHash,
        credentialId: editing.credentialId,
        creditPoints: editing.creditPoints,
      });
    } else {
      form.resetFields();
    }
  }, [isOpen, currentStep, editing, form]);

  const handleCertificateUrlExtraction = async (url: string) => {
    if (!url || !isSupportedCertificateUrl(url)) {
      setExtractionError(null);
      setExtractionSuccess(null);
      setAutoImageUrl(null);
      return;
    }
    setExtractingFromUrl(true);
    setExtractionError(null);
    setExtractionSuccess(null);
    try {
      const result = await importCertificateFromUrl(url);
      if (result?.success && result.data) {
        const d = result.data;
        const values: any = {
          credentialUrl: url,
          title: d.title || '',
          issuer: d.issuer || '',
          type: 'certificate',
          credentialId: d.credentialId || '',
          description: d.description || '',
        };
        if (d.completionDate) values.issueDate = dayjs(d.completionDate);
        if (d.storedImageUrl) {
          values.imageUrl = d.storedImageUrl;
          setAutoImageUrl(d.storedImageUrl);
        }
        form.setFieldsValue(values);
        if (d.ocrAvailable) {
          setExtractionSuccess('Certificate downloaded and parsed automatically.');
        } else {
          setExtractionError('Certificate image attached. OCR service unavailable, so fields could not be auto-filled. You can fill them manually or start the OCR service.');
        }
      } else {
        setExtractionError(result?.message || 'Failed to import certificate');
      }
    } catch (e: any) {
      setExtractionError(e?.message || 'Failed to import certificate');
    } finally {
      setExtractingFromUrl(false);
    }
  };

  const handleContinueToReview = async () => {
    try {
      const values = await form.validateFields();
      console.log('Form validated successfully:', values);
      setFormValues(values);
      setCurrentStep(2);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title={editing ? "Edit Credential" : "Add Credential"}
      footer={null}
      width={800}
      destroyOnHidden={true}
    >
      <div className="mb-6">
        <Steps current={currentStep} items={[{ title: "Method" }, { title: "Details" }, { title: "Creation" }]} />
      </div>

      {currentStep === 0 && (
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">How do you want to add your credential?</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { key: "sync", title: "Sync from Platform", desc: "Connect your account to import credentials", icon: "🌐" },
              { key: "upload", title: "Upload Certificate", desc: "Upload PDF/PNG/JPG with OCR parsing", icon: "⬆️" },
              { key: "manual", title: "Upload using URL", desc: "Import certificate from a shareable URL", icon: "�" },
            ].map((m) => (
              <button
                key={m.key}
                onClick={() => setAddMethod(m.key as AddMethod)}
                className={`text-left rounded-xl border p-4 transition hover:shadow ${addMethod === m.key ? "border-primary ring-2 ring-primary/30" : "border-border"}`}
              >
                <div className="text-2xl mb-2">{m.icon}</div>
                <div className="font-medium">{m.title}</div>
                <div className="text-sm text-muted-foreground">{m.desc}</div>
              </button>
            ))}
          </div>

          {addMethod === "sync" && (
            <div className="space-y-3">
              <div className="text-sm font-medium">Select Platform</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {platforms.map((p) => (
                  <button
                    type="button"
                    key={p.key}
                    onClick={() => setSelectedPlatform(p.name)}
                    className={`flex items-center gap-3 rounded-xl border p-3 bg-background hover:shadow transition ${selectedPlatform === p.name ? "border-primary ring-2 ring-primary/30" : "border-border"}`}
                  >
                    <div className="relative w-8 h-8 rounded-md overflow-hidden">
                      <Image src={p.logo} alt={`${p.name} logo`} fill sizes="32px" className="object-contain" />
                    </div>
                    <span className="text-sm">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={() => setCurrentStep(1)} disabled={!addMethod}>Continue to Details</Button>
          </div>
        </div>
      )}

      {currentStep === 1 && addMethod === "sync" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Upload the certificate file from {selectedPlatform || "your platform"}. We'll parse details automatically.</p>
          <Upload
            beforeUpload={async (f) => {
              setFile(f);
              setExtractingFromImage(true);
              
              try {
                // Extract certificate information
                const extracted = await extractCertificateInfo(f);
                if (extracted) {
                  // Auto-fill form fields with extracted data
                  form.setFieldsValue({
                    title: extracted.title || '',
                    issuer: extracted.issuer || '',
                    issueDate: extracted.issueDate ? dayjs(extracted.issueDate) : null,
                  });
                }
              } finally {
                setExtractingFromImage(false);
              }

              return false;
            }}
            maxCount={1}
            accept="image/*,application/pdf"
          >
            <Button variant="outline" className="bg-transparent">Upload File</Button>
          </Upload>
          {extractingFromImage && (
            <div className="flex items-center justify-center mt-3 text-sm text-blue-600">
              <Spin size="small" className="mr-2" />
              Certificate extraction and parsing...
            </div>
          )}
          <div className="flex justify-between">
            <Button variant="outline" className="bg-transparent" onClick={() => setCurrentStep(0)}>Back</Button>
            <Button onClick={() => setCurrentStep(2)}>Continue</Button>
          </div>
        </div>
      )}

      {currentStep === 1 && addMethod !== "sync" && (
        <Form form={form} layout="vertical" initialValues={{ type: "certificate" }}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="title" label="Title" rules={[{ required: true }]}>
                <Input placeholder="e.g., Full Stack Web Development" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="issuer" label="Issuer" rules={[{ required: true }]}>
                <Input placeholder="e.g., Tech Academy" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="type" label="Type" rules={[{ required: true }]}>
                <Select
                  options={[
                    { value: "certificate", label: "Certificate" },
                    { value: "degree", label: "Degree" },
                    { value: "license", label: "License" },
                    { value: "badge", label: "Badge" },
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="nsqfLevel" label="NSQF Level">
                <Input type="number" min={1} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={24}>
              <Form.Item name="issueDate" label="Issue Date" rules={[{ required: true }]}>
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="What did you learn or achieve?" />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="skills" label="Skills">
                <Select
                  mode="multiple"
                  placeholder="Select or type skills"
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={skillsData.allSkills.map((skill: string) => ({
                    value: skill,
                    label: skill
                  }))}
                  loading={loadingSkills}
                  disabled={loadingSkills}
                />
              </Form.Item>
            </Col>
            {addMethod === "manual" && (
              <Col span={12}>
                <Form.Item name="credentialUrl" label="Verification URL">
                  <Input
                    placeholder="https://"
                    onChange={(e) => {
                      const url = e.target.value;
                      setCurrentUrl(url);
                      if (urlExtractionTimeout) clearTimeout(urlExtractionTimeout);
                      if (url && isSupportedCertificateUrl(url)) {
                        const t = setTimeout(() => handleCertificateUrlExtraction(url), 1200);
                        setUrlExtractionTimeout(t);
                      } else {
                        setExtractionError(null);
                        setExtractionSuccess(null);
                        setAutoImageUrl(null);
                      }
                    }}
                    suffix={(
                      <div style={{ width: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ visibility: (extractingFromUrl || isSupportedCertificateUrl(currentUrl)) ? 'visible' : 'hidden' }}>
                          {extractingFromUrl ? (
                            <Spin size="small" />
                          ) : isSupportedCertificateUrl(currentUrl) ? (
                            <span style={{ color: '#52c41a', fontSize: 12 }}>✓</span>
                          ) : null}
                        </span>
                      </div>
                    )}
                  />
                </Form.Item>
                {extractingFromUrl && (
                  <div className="flex items-center mt-2 text-sm text-blue-600">
                    <Spin size="small" className="mr-2" />
                    Extracting certificate...
                  </div>
                )}
              </Col>
            )}
          </Row>
          {autoImageUrl ? (
            <>
              <Form.Item name="imageUrl" style={{ display: 'none' }}>
                <Input type="hidden" />
              </Form.Item>
              <div className="mt-2">
                <div className="text-sm text-muted-foreground mb-2">Certificate image attached from URL</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={autoImageUrl} alt="Certificate" className="w-full max-h-72 object-contain rounded border" />
              </div>
            </>
          ) : null}
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="credentialId" label="Credential ID">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="creditPoints" label="Credit Points">
                <Input type="number" min={0} />
              </Form.Item>
            </Col>
          </Row>
          {!autoImageUrl && addMethod === "upload" && (
            <>
              <Form.Item label="Certificate File">
                <Upload
                  beforeUpload={async (f) => {
                    setFile(f);
                    setExtractingFromImage(true);
                    
                    try {
                      // Extract certificate information
                      const extracted = await extractCertificateInfo(f);
                      if (extracted) {
                        // Auto-fill form fields with extracted data
                        form.setFieldsValue({
                          title: extracted.title || '',
                          issuer: extracted.issuer || '',
                          issueDate: extracted.issueDate ? dayjs(extracted.issueDate) : null,
                        });
                      }
                    } finally {
                      setExtractingFromImage(false);
                    }

                    return false;
                  }}
                  maxCount={1}
                  accept="image/*,application/pdf"
                >
                  <Button variant="outline" className="bg-transparent">Upload</Button>
                </Upload>
              </Form.Item>
              {extractingFromImage && (
                <div className="flex items-center justify-center mt-2 text-sm text-blue-600">
                  <Spin size="small" className="mr-2" />
                  Certificate extraction and parsing...
                </div>
              )}
            </>
          )}
          {extractionSuccess && (
            <Alert message={extractionSuccess} type="success" showIcon style={{ marginBottom: 16 }} />
          )}
          {extractionError && (
            <Alert message={extractionError} type="error" showIcon style={{ marginBottom: 16 }} />
          )}
          <div className="flex justify-between">
            <Button variant="outline" className="bg-transparent" onClick={() => setCurrentStep(0)}>Back</Button>
            <Button onClick={handleContinueToReview}>Continue</Button>
          </div>
        </Form>
      )}

      {currentStep === 2 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Review and finalize your credential. You can optionally anchor later.</p>
          <div className="flex justify-between">
            <Button variant="outline" className="bg-transparent" onClick={() => setCurrentStep(1)} disabled={submitting}>Back</Button>
            <Space>
              <Button variant="outline" className="bg-transparent" onClick={onClose} disabled={submitting}>Cancel</Button>
              <Button onClick={onSubmit} disabled={submitting}>
                {submitting ? (
                  <>
                    <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {editing ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  editing ? "Update" : "Create"
                )}
              </Button>
            </Space>
          </div>
        </div>
      )}
    </Modal>
  );
};
