import React from "react";
import { Modal, Spin } from "antd";
import { Shield, Award, Calendar, CheckCircle, Link, ExternalLink, Eye } from "lucide-react";
import dayjs from "dayjs";
import { CredentialDetails } from "@/types/credentials";

interface CredentialDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  details: CredentialDetails | null;
  onViewImage: (imageUrl: string) => void;
}

export const CredentialDetailsModal: React.FC<CredentialDetailsModalProps> = ({
  isOpen,
  onClose,
  details,
  onViewImage,
}) => {
  if (!details) return null;

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title={
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <span>Credential Details</span>
        </div>
      }
      footer={null}
      width={800}
    >
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="border border-border rounded-lg p-4 bg-card">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-foreground">
            <Award className="w-5 h-5 text-primary" />
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Title</label>
              <p className="text-foreground font-medium mt-1">{details.credential.title}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Issuer</label>
              <p className="text-foreground font-medium mt-1">{details.credential.issuer}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Type</label>
              <p className="text-foreground font-medium mt-1 capitalize">{details.credential.type}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Issue Date</label>
              <p className="text-foreground font-medium mt-1">
                {dayjs(details.credential.issueDate).format("MMMM D, YYYY")}
              </p>
            </div>
            {details.credential.creditPoints && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Credit Points</label>
                <p className="text-foreground font-medium mt-1">{details.credential.creditPoints}</p>
              </div>
            )}
            {details.credential.nsqfLevel && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">NSQF Level</label>
                <p className="text-foreground font-medium mt-1">{details.credential.nsqfLevel}</p>
              </div>
            )}
          </div>
          {details.credential.description && (
            <div className="mt-4">
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <p className="text-foreground mt-1 leading-relaxed">{details.credential.description}</p>
            </div>
          )}
          {details.credential.skills?.length > 0 && (
            <div className="mt-4">
              <label className="text-sm font-medium text-muted-foreground">Skills</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {details.credential.skills.map((skill: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full border border-primary/20"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Blockchain Information */}
        {details.anchored && (
          <div className="border border-green-200 dark:border-green-800 rounded-lg p-4 bg-green-50 dark:bg-green-950/30">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-foreground">
              <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
              Blockchain Verification
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-green-700 dark:text-green-300 font-medium">Verified on Blockchain</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Transaction Hash</label>
                <p className="text-foreground font-mono text-sm break-all mt-1 bg-background/50 p-2 rounded border">
                  {details.credential.transactionHash}
                </p>
              </div>
              {details.credential.credentialHash && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Credential Hash</label>
                  <p className="text-foreground font-mono text-sm break-all mt-1 bg-background/50 p-2 rounded border">
                    {details.credential.credentialHash}
                  </p>
                </div>
              )}
              {details.blockchain && details.blockchain.verified && (
                <>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Blockchain Issuer</label>
                    <p className="text-foreground font-medium mt-1">{details.blockchain.issuer}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Blockchain Timestamp</label>
                    <p className="text-foreground font-medium mt-1">
                      {dayjs(details.blockchain.timestampDate).format("MMMM D, YYYY [at] h:mm A")}
                    </p>
                  </div>
                </>
              )}
              {details.verificationUrl && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Public Verification URL</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Link className="w-4 h-4 text-primary" />
                    <a
                      href={details.verificationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80 hover:underline text-sm"
                    >
                      Verify Publicly
                    </a>
                    <ExternalLink className="w-3 h-3 text-primary" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Additional Information */}
        <div className="border border-border rounded-lg p-4 bg-card">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-foreground">
            <Calendar className="w-5 h-5 text-primary" />
            Additional Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Created</label>
              <p className="text-foreground mt-1">
                {dayjs(details.credential.createdAt).format("MMMM D, YYYY [at] h:mm A")}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
              <p className="text-foreground mt-1">
                {dayjs(details.credential.updatedAt).format("MMMM D, YYYY [at] h:mm A")}
              </p>
            </div>
            {details.credential.credentialId && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Credential ID</label>
                <p className="text-foreground font-mono text-sm mt-1 bg-background/50 p-2 rounded border">
                  {details.credential.credentialId}
                </p>
              </div>
            )}
            {details.credential.credentialUrl && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Original URL</label>
                <div className="flex items-center gap-2 mt-1">
                  <ExternalLink className="w-4 h-4 text-primary" />
                  <a
                    href={details.credential.credentialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 hover:underline text-sm"
                  >
                    View Original Certificate
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Certificate Image */}
        {details.credential.imageUrl && (
          <div className="border border-border rounded-lg p-4 bg-card">
            <h3 className="text-lg font-semibold mb-3 text-foreground">Certificate Image</h3>
            <div
              className="w-full h-64 relative rounded-lg overflow-hidden bg-background border cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => onViewImage(details.credential.imageUrl!)}
            >
              <img
                src={details.credential.imageUrl}
                alt={`${details.credential.title} certificate`}
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                <div className="bg-background/90 backdrop-blur-sm rounded-full p-3 opacity-0 hover:opacity-100 transition-opacity border">
                  <Eye className="w-6 h-6 text-foreground" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
