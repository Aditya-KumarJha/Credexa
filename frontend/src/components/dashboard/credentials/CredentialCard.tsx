import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Space, Popconfirm, Modal, App } from "antd";
import {
  Award,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Shield,
  Download,
  Eye,
  Link,
  Anchor,
  Share2,
  QrCode,
  Copy,
} from "lucide-react";
import dayjs from "dayjs";
import { Credential, CredentialStatus } from "@/types/credentials";
import { QRCodeCanvas } from "qrcode.react";

interface CredentialCardProps {
  credential: Credential;
  onDelete: (id?: string) => void;
  onViewImage: (imageUrl: string) => void;
  onViewDetails: (id?: string) => void;
  onAnchor: (id?: string) => void;
  onShowOnChainDetails: (credential: Credential) => void;
  anchoringId: string | null;
  loadingDetails: boolean;
}

const blockchainStatusTag = (transactionHash: string | undefined) => {
  const base = "px-2 py-0.5 text-xs rounded-md inline-flex items-center gap-1 border";
  if (transactionHash) {
    return (
      <span className={`${base} bg-emerald-500/10 text-emerald-500 border-emerald-500/20`}>
        <Shield className="w-3.5 h-3.5" /> On-Chain Proof
      </span>
    );
  }
  return (
    <span className={`${base} bg-gray-500/10 text-gray-500 border-gray-500/20`}>
      <Clock className="w-3.5 h-3.5" /> No On-Chain Proof
    </span>
  );
};

export const CredentialCard: React.FC<CredentialCardProps> = ({
  credential: c,
  onDelete,
  onViewImage,
  onViewDetails,
  onAnchor,
  onShowOnChainDetails,
  anchoringId,
  loadingDetails,
}) => {
  const { message } = App.useApp();
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const handleShare = () => {
    if (!c.credentialHash) {
      message.warning("This credential needs to be anchored to the blockchain before it can be shared for verification.");
      return;
    }
    setShareModalOpen(true);
  };

  // Create structured QR data instead of just URL
  const qrData = c.credentialHash ? {
    type: "CREDEXA_CREDENTIAL_VERIFICATION",
    version: "1.0",
    credentialHash: c.credentialHash,
    transactionHash: c.transactionHash,
    blockchain: {
      network: "ethereum-sepolia",
      explorer: `https://sepolia.etherscan.io/tx/${c.transactionHash}`
    },
    credential: {
      id: c._id,
      title: c.title,
      issuer: c.issuer,
      type: c.type,
      issueDate: c.issueDate,
      nsqfLevel: c.nsqfLevel,
      creditPoints: c.creditPoints
    },
    verification: {
      url: `${typeof window !== "undefined" ? window.location.origin : ""}/verify?hash=${c.credentialHash}`,
      timestamp: new Date().toISOString()
    }
  } : null;

  const qrValue = qrData ? JSON.stringify(qrData) : "";

  const verificationUrl = c.credentialHash 
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/verify?hash=${c.credentialHash}`
    : "";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    message.success("Verification link copied to clipboard!");
  };

  const handleCopyQRData = () => {
    if (qrValue) {
      navigator.clipboard.writeText(qrValue);
      message.success("QR data copied to clipboard!");
    }
  };
  return (
    <div className="h-full border-0 shadow-lg bg-card/80 p-0 rounded-lg">
      {/* Card Header */}
      <div className="px-5 py-4 border-b border-white/10 relative">
        <div className="flex items-center gap-2 text-sm mb-3">
          <Award className="w-4 h-4" />
          <span className="truncate pr-20">{c.title}</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {blockchainStatusTag(c.transactionHash)}
          </div>
          {/* Action Buttons */}
          <div className="relative z-50">
            <Space size="small">
              {c.credentialHash && (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/90 backdrop-blur-sm hover:bg-green-50 shadow-sm border-gray-200 text-green-600 hover:text-green-700"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleShare();
                  }}
                  title="Share verification link"
                >
                  <Share2 className="w-3 h-3" />
                </Button>
              )}
              {c.transactionHash && (
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/90 backdrop-blur-sm hover:bg-blue-50 shadow-sm border-gray-200 text-blue-600 hover:text-blue-700"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onViewDetails(c._id);
                  }}
                  disabled={loadingDetails}
                >
                  {loadingDetails ? (
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <Eye className="w-3 h-3" />
                  )}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="bg-white/90 backdrop-blur-sm hover:bg-blue-50 shadow-sm border-gray-200 text-blue-600 hover:text-blue-700"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAnchor(c._id);
                }}
                disabled={anchoringId === c._id}
              >
                {anchoringId === c._id ? (
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <Anchor className="w-3 h-3" />
                )}
              </Button>
              <Popconfirm
                title="Delete this credential?"
                onConfirm={() => onDelete(c._id)}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white/90 backdrop-blur-sm hover:bg-red-50 text-red-600 hover:text-red-700 shadow-sm border-gray-200"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </Popconfirm>
            </Space>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="px-5 py-4 space-y-4">
        <div className="flex items-center gap-4 pt-3 border-t border-border/50">
          {c.credentialUrl && (
            <a
              target="_blank"
              rel="noreferrer"
              href={c.credentialUrl}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200 hover:underline flex items-center gap-1.5 font-medium"
            >
              <Download className="w-4 h-4" /> 
              <span className="text-blue-600 dark:text-blue-300">View Original</span>
            </a>
          )}

          {c.transactionHash && (
            <div className="flex justify-between items-center w-full">
              <a
                target="_blank"
                rel="noreferrer"
                href={`https://sepolia.etherscan.io/tx/${c.transactionHash}`}
                className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-300 dark:hover:text-emerald-200 hover:underline flex items-center gap-1.5 font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                <Shield className="w-4 h-4" /> 
                <span className="text-emerald-600 dark:text-emerald-300">On-Chain Proof</span>
              </a>
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200 hover:underline font-medium cursor-pointer bg-transparent border-none p-0"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('🔍 View Details clicked');
                  console.log('📋 Credential data:', c);
                  console.log('🔑 Credential Hash:', c.credentialHash);
                  console.log('📊 Transaction Hash:', c.transactionHash);
                  console.log('🆔 Credential ID:', c._id);
                  console.log('📝 Credential Title:', c.title);
                  onShowOnChainDetails(c);
                }}
              >
                <span className="text-blue-600 dark:text-blue-300">View Details</span>
              </button>
            </div>
          )}
        </div>

        {/* Certificate Image */}
        {c.imageUrl && (
          <div
            className="w-full h-40 relative rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-90 transition-opacity shadow-sm mb-4"
            onClick={() => onViewImage(c.imageUrl!)}
          >
            <img
              src={c.imageUrl}
              alt={`${c.title} certificate`}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
            />
            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
              <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 opacity-0 hover:opacity-100 transition-opacity">
                <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
            <Award className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs text-muted-foreground mb-1">Issuer</div>
            <div className="text-foreground font-medium text-sm truncate">{c.issuer}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div className="text-muted-foreground">
            Type: <span className="text-foreground font-medium">{c.type}</span>
          </div>
          <div className="text-muted-foreground">
            Issued: <span className="text-foreground font-medium">{c.issueDate ? dayjs(c.issueDate).format("MMM D, YYYY") : "-"}</span>
          </div>
          {typeof c.nsqfLevel !== "undefined" && (
            <div className="text-muted-foreground">
              NSQF: <span className="text-foreground font-medium">{c.nsqfLevel}</span>
            </div>
          )}
          {typeof c.creditPoints !== "undefined" && (
            <div className="text-muted-foreground">
              Points: <span className="text-foreground font-medium">{c.creditPoints}</span>
            </div>
          )}
        </div>

        {c.skills?.length ? (
          <div className="flex flex-wrap gap-2">
            {c.skills.slice(0, 5).map((s) => (
              <span key={s} className="px-2 py-1 text-xs rounded-md bg-muted text-foreground/80 border border-border">
                {s}
              </span>
            ))}
            {c.skills.length > 5 && (
              <span className="px-2 py-1 text-xs rounded-md bg-muted text-foreground/80 border border-border">
                +{c.skills.length - 5}
              </span>
            )}
          </div>
        ) : null}
        
        <div className="flex gap-2 pt-2">
          {c.credentialUrl && (
            <a target="_blank" rel="noreferrer" href={c.credentialUrl} className="text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200 hover:underline flex items-center gap-1 font-medium">
              <Download className="w-4 h-4" /> 
              <span className="text-blue-600 dark:text-blue-300">View Credential</span>
            </a>
          )}
        </div>
      </div>

      {/* Share Modal */}
      <Modal
        title={
          <span className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Credential Verification
          </span>
        }
        open={shareModalOpen}
        onCancel={() => setShareModalOpen(false)}
        footer={null}
        centered
        width={500}
      >
        <div className="text-center p-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{c.title}</h3>
            <p className="text-gray-600 dark:text-gray-200 text-sm">
              Scan this QR code with any QR scanner to view complete blockchain verification details, or use the URL for web verification.
            </p>
          </div>
          
          {qrValue && (
            <>
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block mb-6">
                <QRCodeCanvas 
                  value={qrValue} 
                  size={220}
                  level="M"
                  includeMargin={true}
                />
              </div>
              
              <div className="space-y-4">
                {/* QR Data Preview */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-left">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">QR Code Contains:</h4>
                  <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
                    <div className="flex justify-between">
                      <span>Credential Hash:</span>
                      <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                        {c.credentialHash?.substring(0, 10)}...
                      </span>
                    </div>
                    {c.transactionHash && (
                      <div className="flex justify-between">
                        <span>Transaction:</span>
                        <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                          {c.transactionHash.substring(0, 10)}...
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Blockchain:</span>
                      <span className="font-semibold">Ethereum Sepolia</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Issuer:</span>
                      <span className="font-semibold">{c.issuer}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Issue Date:</span>
                      <span>{c.issueDate ? dayjs(c.issueDate).format("MMM D, YYYY") : "-"}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyQRData}
                    className="flex-1"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy QR Data
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="flex-1"
                  >
                    <Link className="w-4 h-4 mr-2" />
                    Copy URL
                  </Button>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-white block mb-2">
                    Web Verification URL:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={verificationUrl}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-gray-50 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded text-sm text-blue-700 dark:text-blue-300">
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Secure & Private:</strong> The QR code contains blockchain verification data. 
                      No personal information is exposed. Anyone can verify the credential's authenticity by scanning.
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};
