"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Tabs,
  Button,
  Input,
  DatePicker,
  Tag,
  Typography,
  Spin,
  Space,
  ConfigProvider,
  theme,
  notification,
} from "antd";
import {
  UploadOutlined,
  IdcardOutlined,
  FormOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  LinkOutlined,
  CalendarOutlined,
  UserOutlined,
  SolutionOutlined,
  AuditOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { useDropzone } from "react-dropzone";
import EmployerSidebar from "@/components/dashboard/employer/EmployerSidebar";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import RoleGuard from "@/components/auth/RoleGuard";
import { useTheme } from "next-themes";
import dayjs from "dayjs";

const { TextArea } = Input;
const { Title, Text, Paragraph } = Typography;

// --- Types for Credential Verification ---
interface VerifiedCredentialResult {
  status: "authenticated" | "unauthenticated" | "partial" | "error";
  credentialName?: string;
  holderName?: string;
  issuedBy?: string;
  issueDate?: string; // ISO date string
  proofType?: string; // e.g., "Blockchain-backed", "Issuer API Verified"
  blockchainDetails?: {
    blockchain?: string;
    transactionHash?: string;
    smartContractAddress?: string;
  };
  originalCredentialLink?: string;
  reason?: string; // For unauthenticated/error/partial
  discrepancies?: string[]; // For partial matches
}

type VerificationMethod = "document" | "identifier" | "manual";

// --- SVG BACKGROUND (Dark) ---
const PlexusBackground = () => (
  <div className="absolute inset-0 z-0 opacity-40 dark:opacity-50">
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 1600 900"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      style={{ backgroundColor: "#0c0a09" }}
    >
      <defs>
        <radialGradient id="backgroundGradient" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#020617" />
        </radialGradient>

        <radialGradient id="greenGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#34d399" stopOpacity="1" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="blueGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="1" />
          <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="100%" height="100%" fill="url(#backgroundGradient)" />

      <g stroke="#34d399" strokeWidth="1" strokeOpacity="0.3">
        <line x1="220" y1="150" x2="480" y2="240" />
        <line x1="480" y1="240" x2="350" y2="400" />
        <line x1="350" y1="400" x2="150" y2="350" />
        <line x1="150" y1="350" x2="220" y2="150" />

        <line x1="1300" y1="120" x2="1150" y2="280" />
        <line x1="1150" y1="280" x2="1450" y2="320" />
        <line x1="1450" y1="320" x2="1300" y2="120" />
        <line x1="1150" y1="280" x2="950" y2="180" />

        <line x1="180" y1="800" x2="400" y2="650" />
        <line x1="400" y1="650" x2="600" y2="820" />
        <line x1="600" y1="820" x2="350" y2="880" />
        <line x1="350" y1="880" x2="180" y2="800" />

        <line x1="1100" y1="750" x2="1350" y2="600" />
        <line x1="1350" y1="600" x2="1500" y2="780" />
        <line x1="1500" y1="780" x2="1250" y2="850" />
        <line x1="1250" y1="850" x2="1100" y2="750" />
        <line x1="1350" y1="600" x2="1150" y2="550" />
      </g>

      <g>
        <circle cx="220" cy="150" r="10" fill="url(#greenGlow)" />
        <circle cx="480" cy="240" r="12" fill="url(#blueGlow)" />
        <circle cx="350" cy="400" r="8" fill="url(#blueGlow)" />
        <circle cx="150" cy="350" r="9" fill="url(#blueGlow)" />

        <circle cx="1300" cy="120" r="11" fill="url(#blueGlow)" />
        <circle cx="1150" cy="280" r="9" fill="url(#blueGlow)" />
        <circle cx="1450" cy="320" r="13" fill="url(#greenGlow)" />
        <circle cx="950" cy="180" r="8" fill="url(#greenGlow)" />

        <circle cx="180" cy="800" r="12" fill="url(#blueGlow)" />
        <circle cx="400" cy="650" r="9" fill="url(#greenGlow)" />
        <circle cx="600" cy="820" r="11" fill="url(#blueGlow)" />
        <circle cx="350" cy="880" r="8" fill="url(#greenGlow)" />

        <circle cx="1100" cy="750" r="10" fill="url(#blueGlow)" />
        <circle cx="1350" cy="600" r="12" fill="url(#greenGlow)" />
        <circle cx="1500" cy="780" r="9" fill="url(#blueGlow)" />
        <circle cx="1250" cy="850" r="11" fill="url(#greenGlow)" />
        <circle cx="1150" cy="550" r="8" fill="url(#blueGlow)" />

        <circle cx="750" cy="450" r="7" fill="url(#greenGlow)" />
        <circle cx="900" cy="600" r="9" fill="url(#blueGlow)" />
        <circle cx="550" cy="100" r="8" fill="url(#blueGlow)" />
      </g>
    </svg>
  </div>
);

// --- API Simulation (Replace with actual backend calls) ---
const simulateVerification = async (
  method: VerificationMethod,
  data: any
): Promise<VerifiedCredentialResult> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (
        (method === "identifier" && data.identifier.includes("FAIL")) ||
        (method === "manual" && data.holderName.includes("FAIL")) ||
        (method === "document" && data.files && data.files[0].name.includes("fail"))
      ) {
        resolve({
          status: "unauthenticated",
          reason: "No matching credential found or details are incorrect.",
        });
      } else if (
        (method === "identifier" && data.identifier.includes("PARTIAL")) ||
        (method === "manual" && data.holderName.includes("PARTIAL")) ||
        (method === "document" && data.files && data.files[0].name.includes("partial"))
      ) {
        resolve({
          status: "partial",
          credentialName: "Partial Certificate",
          holderName: "John P. Doe",
          issuedBy: "Acme Corp",
          issueDate: "2023-01-15",
          reason: "Credential found, but holder name differs.",
          discrepancies: ["Holder name mismatch: Expected John Doe, Found John P. Doe"],
        });
      } else if (
        (method === "identifier" && data.identifier.includes("ERROR")) ||
        (method === "manual" && data.holderName.includes("ERROR"))
      ) {
        resolve({
          status: "error",
          reason: "Internal server error or API unresponsive. Please try again later.",
        });
      } else {
        resolve({
          status: "authenticated",
          credentialName: "Certified Blockchain Developer",
          holderName: "John Doe",
          issuedBy: "Global Tech Institute",
          issueDate: "2023-03-01",
          proofType:
            method === "document"
              ? "Document Parsed & Verified"
              : method === "identifier" && data.identifier.startsWith("0x")
              ? "Blockchain-backed"
              : "Issuer API Verified",
          blockchainDetails:
            method === "identifier" && data.identifier.startsWith("0x")
              ? {
                  blockchain: "Ethereum",
                  transactionHash: data.identifier,
                  smartContractAddress: "0xAbCdEf1234567890",
                }
              : undefined,
          originalCredentialLink: "https://verify.globaltech.edu/cert/johndoe123",
        });
      }
    }, 2000);
  });
};

// --- MAIN COMPONENT ---
const VerifyCredentialContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<VerificationMethod>("document");
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerifiedCredentialResult | null>(null);

  // Document Upload State
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadedFiles(acceptedFiles);
    setVerificationResult(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [],
      "image/png": [],
      "image/gif": [],
      "image/svg+xml": [],
      "application/pdf": [],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [],
      "application/msword": [],
    },
    maxFiles: 1,
  });

  // Identifier/URL State
  const [credentialIdentifier, setCredentialIdentifier] = useState("");
  const [issuerUrl, setIssuerUrl] = useState("");

  // Manual Entry State
  const [credentialName, setCredentialName] = useState("");
  const [holderName, setHolderName] = useState("");
  const [issueDate, setIssueDate] = useState<dayjs.Dayjs | null>(null);
  const [issuerOrg, setIssuerOrg] = useState("");
  const [manualNotes, setManualNotes] = useState("");

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Ant Design theme configuration
  const antTheme = useMemo(() => {
    return {
      algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
      token: {
        colorPrimary: isDark ? "#60a5fa" : "#34d399",
        colorLink: isDark ? "#60a5fa" : "#34d399",
        colorBgContainer: isDark ? "#1f2937" : "#ffffff",
        colorBorder: isDark ? "#4b5563" : "#d1d5db",
        colorTextBase: isDark ? "#e2e8f0" : "#1f2937",
      },
      components: {
        Tabs: {
          colorPrimary: isDark ? "#60a5fa" : "#34d399",
          inkBarColor: isDark ? "#60a5fa" : "#34d399",
          itemSelectedColor: isDark ? "#60a5fa" : "#34d399",
          itemHoverColor: isDark ? "#60a5fa" : "#34d399",
          itemColor: isDark ? "#94a3b8" : "#4b5563",
          cardBg: isDark ? "#1f2937" : "#f3f4f6",
        },
        Input: {
          activeBorderColor: isDark ? "#60a5fa" : "#34d399",
          hoverBorderColor: isDark ? "#60a5fa" : "#34d399",
        },
        Button: {
          colorPrimary: isDark ? "#60a5fa" : "#34d399",
        },
        DatePicker: {
          activeBorderColor: isDark ? "#60a5fa" : "#34d399",
          hoverBorderColor: isDark ? "#60a5fa" : "#34d399",
        },
      },
    } as const;
  }, [isDark]);

  const handleVerify = async () => {
    setLoading(true);
    setVerificationResult(null);

    try {
      let data: any = {};
      switch (activeTab) {
        case "document":
          if (uploadedFiles.length === 0) {
            notification.error({ message: "Please upload a document." });
            setLoading(false);
            return;
          }
          data = { files: uploadedFiles };
          break;
        case "identifier":
          if (!credentialIdentifier.trim()) {
            notification.error({ message: "Please enter a Credential ID or URL." });
            setLoading(false);
            return;
          }
          data = { identifier: credentialIdentifier.trim(), issuerUrl: issuerUrl.trim() };
          break;
        case "manual":
          if (!credentialName.trim() || !holderName.trim() || !issueDate || !issuerOrg.trim()) {
            notification.error({ message: "Please fill in all required manual fields." });
            setLoading(false);
            return;
          }
          data = {
            credentialName: credentialName.trim(),
            holderName: holderName.trim(),
            issueDate: issueDate.toISOString().split("T")[0],
            issuerOrg: issuerOrg.trim(),
            notes: manualNotes.trim(),
          };
          break;
      }

      const result = await simulateVerification(activeTab, data);
      setVerificationResult(result);
    } catch (error) {
      console.error("Verification error:", error);
      setVerificationResult({ status: "error", reason: "An unexpected error occurred during verification." });
      notification.error({ message: "Verification failed", description: "An unexpected error occurred." });
    } finally {
      setLoading(false);
    }
  };

  const handleClearForm = () => {
    setVerificationResult(null);
    setUploadedFiles([]);
    setCredentialIdentifier("");
    setIssuerUrl("");
    setCredentialName("");
    setHolderName("");
    setIssueDate(null);
    setIssuerOrg("");
    setManualNotes("");
  };

  const getStatusColor = (status: VerifiedCredentialResult["status"]) => {
    switch (status) {
      case "authenticated":
        return "green";
      case "unauthenticated":
        return "red";
      case "partial":
        return "orange";
      case "error":
        return "red";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: VerifiedCredentialResult["status"]) => {
    switch (status) {
      case "authenticated":
        return <CheckCircleOutlined className="text-green-500" />;
      case "unauthenticated":
        return <CloseCircleOutlined className="text-red-500" />;
      case "partial":
        return <WarningOutlined className="text-orange-500" />;
      case "error":
        return <CloseCircleOutlined className="text-red-500" />;
      default:
        return <QuestionCircleOutlined className="text-gray-500" />;
    }
  };

  const tabs = [
    {
      key: "document",
      label: (
        <span>
          <UploadOutlined /> Upload Document
        </span>
      ),
      children: (
        <div className="flex flex-col gap-4">
          <Paragraph className="text-gray-600 dark:text-gray-400">
            Drag & drop your certificate, badge, or transcript here, or click to browse. Supports images (JPG, PNG,
            GIF, SVG), PDFs, and DOC/DOCX files.
          </Paragraph>
          <div
            {...getRootProps()}
            className={`w-full p-8 text-center border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200
            ${isDragActive ? "border-blue-500 bg-blue-500/10" : "border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400"}`}
          >
            <input {...getInputProps()} />
            <UploadOutlined className="text-4xl mb-2 text-gray-400 dark:text-gray-500" />
            {isDragActive ? (
              <p className="text-blue-500">Drop the files here ...</p>
            ) : (
              <p>
                Drag & drop files here, or <span className="text-blue-500 dark:text-blue-400">click to browse</span>
              </p>
            )}
            {uploadedFiles.length > 0 && (
              <div className="mt-4">
                <Text strong>Selected file:</Text>
                <ul className="list-disc list-inside mt-2">
                  {uploadedFiles.map((file) => (
                    <li key={file.name} className="text-sm">
                      {file.name} ({(file.size / 1024).toFixed(2)} KB)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <Button
            type="primary"
            size="large"
            icon={<CheckCircleOutlined />}
            onClick={handleVerify}
            loading={loading && activeTab === "document"}
            disabled={uploadedFiles.length === 0 || (loading && activeTab !== "document")}
            className="w-full mt-2"
          >
            Verify Document
          </Button>
        </div>
      ),
    },
    {
      key: "identifier",
      label: (
        <span>
          <IdcardOutlined /> Enter ID / URL
        </span>
      ),
      children: (
        <div className="flex flex-col gap-4">
          <Paragraph className="text-gray-600 dark:text-gray-400">
            Enter the unique credential ID, a verification URL, or a blockchain transaction hash.
          </Paragraph>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Credential ID or URL</label>
            <Input
              prefix={<LinkOutlined />}
              placeholder="e.g., CERT-12345, https://verify.org/cert/abc, 0x1a2b3c..."
              value={credentialIdentifier}
              onChange={(e) => {
                setCredentialIdentifier(e.target.value);
                setVerificationResult(null);
              }}
              size="large"
            />
            <Text type="secondary" className="text-xs mt-1 block">
              This could be a traditional ID, a verification link, or a blockchain address/hash.
            </Text>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Issuer Verification URL (Optional)</label>
            <Input
              prefix={<LinkOutlined />}
              placeholder="e.g., https://issuer.com/verify"
              value={issuerUrl}
              onChange={(e) => {
                setIssuerUrl(e.target.value);
                setVerificationResult(null);
              }}
              size="large"
            />
            <Text type="secondary" className="text-xs mt-1 block">
              Provide if the credential ID needs context from a specific issuer's verification portal.
            </Text>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<CheckCircleOutlined />}
            onClick={handleVerify}
            loading={loading && activeTab === "identifier"}
            disabled={!credentialIdentifier.trim() || (loading && activeTab !== "identifier")}
            className="w-full mt-2"
          >
            Verify Identifier
          </Button>
        </div>
      ),
    },
    {
      key: "manual",
      label: (
        <span>
          <FormOutlined /> Manual Entry
        </span>
      ),
      children: (
        <div className="flex flex-col gap-4">
          <Paragraph className="text-gray-600 dark:text-gray-400">
            Enter key details from the credential for manual lookup or cross-referencing.
          </Paragraph>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Credential Name</label>
            <Input
              prefix={<SolutionOutlined />}
              placeholder="e.g., Google Project Management Certificate"
              value={credentialName}
              onChange={(e) => {
                setCredentialName(e.target.value);
                setVerificationResult(null);
              }}
              size="large"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Holder's Name</label>
            <Input
              prefix={<UserOutlined />}
              placeholder="e.g., John Doe"
              value={holderName}
              onChange={(e) => {
                setHolderName(e.target.value);
                setVerificationResult(null);
              }}
              size="large"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Issue Date</label>
            <DatePicker
              placeholder="Select date"
              value={issueDate}
              onChange={(date) => {
                setIssueDate(date);
                setVerificationResult(null);
              }}
              size="large"
              className="w-full"
              suffixIcon={<CalendarOutlined />}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Issuing Organization</label>
            <Input
              prefix={<AuditOutlined />}
              placeholder="e.g., Coursera, IBM, XYZ University"
              value={issuerOrg}
              onChange={(e) => {
                setIssuerOrg(e.target.value);
                setVerificationResult(null);
              }}
              size="large"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Additional Notes (Optional)</label>
            <TextArea
              rows={3}
              placeholder="Any other relevant details?"
              value={manualNotes}
              onChange={(e) => {
                setManualNotes(e.target.value);
                setVerificationResult(null);
              }}
              size="large"
            />
          </div>
          <Button
            type="primary"
            size="large"
            icon={<CheckCircleOutlined />}
            onClick={handleVerify}
            loading={loading && activeTab === "manual"}
            disabled={
              !credentialName.trim() ||
              !holderName.trim() ||
              !issueDate ||
              !issuerOrg.trim() ||
              (loading && activeTab !== "manual")
            }
            className="w-full mt-2"
          >
            Verify Manually
          </Button>
        </div>
      ),
    },
  ];

  return (
    <ConfigProvider theme={antTheme}>
      <main className="relative min-h-screen w-full transition-colors duration-500 bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 overflow-hidden">
        <PlexusBackground />

        <div className="relative z-10 w-full max-w-5xl mx-auto p-4 md:p-8 pt-10">
          <Title level={2} className="text-center mb-6 !text-gray-900 dark:!text-gray-100">
            Verify Credential
          </Title>

          {/* Input & Upload Area */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 mb-8 border border-gray-200 dark:border-gray-700">
            <Title level={3} className="!text-gray-900 dark:!text-gray-100 mb-4 border-b pb-3 border-gray-200 dark:border-gray-700">
              Provide Credential Information
            </Title>
            <Tabs
              activeKey={activeTab}
              onChange={(key) => {
                setActiveTab(key as VerificationMethod);
                setVerificationResult(null);
              }}
              items={tabs}
              size="large"
            />
          </div>

          {/* Verification Results Area */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-200 dark:border-gray-700">
            <Title level={3} className="!text-gray-900 dark:!text-gray-100 mb-4 border-b pb-3 border-gray-200 dark:border-gray-700">
              Verification Results
            </Title>
            {loading && (
              <div className="text-center p-8">
                <Spin size="large" />
                <Paragraph className="mt-4 text-lg text-gray-600 dark:text-gray-400">Verifying credential... Please wait.</Paragraph>
              </div>
            )}

            {!loading && verificationResult === null && (
              <div className="text-center p-8 text-gray-500 dark:text-gray-400">
                <QuestionCircleOutlined className="text-6xl mb-4" />
                <Paragraph className="text-lg">Results will appear here after you attempt to verify a credential.</Paragraph>
              </div>
            )}

            {!loading && verificationResult && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4 text-2xl font-bold">
                  {getStatusIcon(verificationResult.status)}
                  <Text className={`!text-gray-900 dark:!text-gray-100 text-3xl font-extrabold capitalize`}>
                    {verificationResult.status === "authenticated" && "Credential Authenticated"}
                    {verificationResult.status === "unauthenticated" && "Verification Failed"}
                    {verificationResult.status === "partial" && "Partial Match"}
                    {verificationResult.status === "error" && "Verification Error"}
                  </Text>
                </div>
                <Tag color={getStatusColor(verificationResult.status)} className="w-fit text-lg py-1 px-3 rounded-full">
                  {verificationResult.status.toUpperCase()}
                </Tag>

                {verificationResult.credentialName && (
                  <Paragraph className="text-lg">
                    <Text strong>Credential:</Text> {verificationResult.credentialName}
                  </Paragraph>
                )}
                {verificationResult.holderName && (
                  <Paragraph className="text-lg">
                    <Text strong>Holder:</Text> {verificationResult.holderName}
                  </Paragraph>
                )}
                {verificationResult.issuedBy && (
                  <Paragraph className="text-lg">
                    <Text strong>Issued By:</Text> {verificationResult.issuedBy}
                  </Paragraph>
                )}
                {verificationResult.issueDate && (
                  <Paragraph className="text-lg">
                    <Text strong>Issue Date:</Text> {dayjs(verificationResult.issueDate).format("MMMM D, YYYY")}
                  </Paragraph>
                )}
                {verificationResult.proofType && (
                  <Paragraph className="text-lg">
                    <Text strong>Proof Type:</Text> {verificationResult.proofType}
                  </Paragraph>
                )}

                {(verificationResult.status === "unauthenticated" ||
                  verificationResult.status === "error" ||
                  verificationResult.status === "partial") && (
                  <Paragraph className="text-lg text-red-500 dark:text-red-400">
                    <Text strong>Reason:</Text> {verificationResult.reason}
                  </Paragraph>
                )}
                {verificationResult.discrepancies && verificationResult.discrepancies.length > 0 && (
                  <div>
                    <Text strong className="text-lg">Discrepancies:</Text>
                    <ul className="list-disc list-inside ml-4">
                      {verificationResult.discrepancies.map((d, i) => (
                        <li key={i} className="text-red-400 dark:text-red-300">
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {verificationResult.blockchainDetails && (
                  <div className="mt-4 p-4 rounded-lg bg-gray-100 dark:bg-gray-700">
                    <Title level={4} className="!text-gray-900 dark:!text-gray-100 mb-2">Blockchain Details</Title>
                    <Paragraph>
                      <Text strong>Blockchain:</Text> {verificationResult.blockchainDetails.blockchain}
                    </Paragraph>
                    <Paragraph>
                      <Text strong>Transaction Hash:</Text>{" "}
                      <a
                        href={`https://etherscan.io/tx/${verificationResult.blockchainDetails.transactionHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        {verificationResult.blockchainDetails.transactionHash}
                      </a>
                    </Paragraph>
                    {verificationResult.blockchainDetails.smartContractAddress && (
                      <Paragraph>
                        <Text strong>Smart Contract:</Text>{" "}
                        <a
                          href={`https://etherscan.io/address/${verificationResult.blockchainDetails.smartContractAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          {verificationResult.blockchainDetails.smartContractAddress}
                        </a>
                      </Paragraph>
                    )}
                  </div>
                )}
                {verificationResult.originalCredentialLink && (
                  <Button
                    type="link"
                    href={verificationResult.originalCredentialLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    icon={<LinkOutlined />}
                    className="self-start"
                  >
                    View Original Credential
                  </Button>
                )}
                <Button type="default" size="large" onClick={handleClearForm} className="w-fit self-center mt-6">
                  Verify Another Credential
                </Button>
              </div>
            )}
          </div>

          {/* How It Works Section */}
          <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-200 dark:border-gray-700">
            <Title level={3} className="!text-gray-900 dark:!text-gray-100 mb-4 border-b pb-3 border-gray-200 dark:border-gray-700">
              How Credential Verification Works
            </Title>
            <Paragraph className="text-gray-600 dark:text-gray-400">
              Our system uses a multi-faceted approach to verify credentials, checking against issuer APIs, public
              blockchain ledgers (like Ethereum, Polygon, etc.), and advanced document parsing for digital signatures
              and recognized templates. For manual entries, we cross-reference public databases and issuer records.
            </Paragraph>
            <Paragraph className="text-gray-600 dark:text-gray-400">
              This ensures the authenticity of skills and qualifications, helps reduce hiring risks, and builds trust
              in the credentials presented by candidates.
            </Paragraph>
          </div>
        </div>
      </main>
    </ConfigProvider>
  );
};

// --- Page Wrapper with Employer Layout ---
export default function EmployerVerifyCredentialPage() {
  return (
    <RoleGuard allowedRole="employer">
      <div className="flex min-h-screen">
        <EmployerSidebar />
        <div className="flex-1 flex flex-col">
          <header className="flex items-center justify-end p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
            <Space>
              <ThemeToggleButton />
              <LanguageSwitcher />
            </Space>
          </header>
          <div className="flex-1 overflow-auto">
            <VerifyCredentialContent />
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
