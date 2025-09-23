"use client";
import { useState } from "react";
import { Input, Button, Card, Typography, Spin, Result, Modal, message, Space } from "antd";
import { QrcodeOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";

const { Title, Text } = Typography;

export default function VerifyCredentialPage() {
  const [credentialHash, setCredentialHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | { verified: boolean; issuer?: string; timestamp?: number }>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/credentials/verify/${credentialHash}`);
      const data = await res.json();
      if (res.ok && data.issuer) {
        setResult({ verified: true, issuer: data.issuer, timestamp: data.timestamp });
      } else {
        setResult({ verified: false });
      }
    } catch (e) {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const verificationUrl = credentialHash
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/api/credentials/verify/${credentialHash}`
    : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(verificationUrl);
    message.success("Link copied to clipboard!");
  };

  return (
    <div style={{ maxWidth: 400, margin: "40px auto" }}>
      <Card>
        <Title level={3}><QrcodeOutlined /> Verify Credential</Title>
        <Text>Paste or scan the credential hash to verify its authenticity.</Text>
        <Input
          style={{ marginTop: 16, marginBottom: 16 }}
          placeholder="Enter credential hash"
          value={credentialHash}
          onChange={e => setCredentialHash(e.target.value)}
        />
        <Button
          type="primary"
          icon={<CheckCircleOutlined />}
          loading={loading}
          disabled={!credentialHash}
          onClick={handleVerify}
        >
          Verify
        </Button>
        <Button
          style={{ marginLeft: 8 }}
          disabled={!credentialHash}
          onClick={() => setIsModalOpen(true)}
        >
          Share QR
        </Button>
        {loading && <Spin style={{ marginTop: 16 }} />}
        {result && (
          result.verified ? (
            <Result
              status="success"
              title="Credential Verified!"
              subTitle={`Issuer: ${result.issuer} | Timestamp: ${result.timestamp}`}
            />
          ) : (
            <Result
              status="error"
              title="Credential Not Found"
              subTitle="The credential hash could not be verified."
            />
          )
        )}
        {error && <Text type="danger">{error}</Text>}
      </Card>
      <Modal
        title="Share Verifiable Credential"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        centered
      >
        <div className="text-center p-4">
          <p className="mb-4" style={{ color: "#888" }}>
            Anyone with this link or QR code can verify your credential's authenticity on the blockchain.
          </p>
          <div style={{ background: "#fff", padding: 16, display: "inline-block", borderRadius: 8, border: "1px solid #eee" }}>
            {/* You can use either QRCodeCanvas or QRCodeSVG */}
            <QRCodeCanvas value={verificationUrl} size={200} />
            {/* Or, to use SVG: <QRCodeSVG value={verificationUrl} size={200} /> */}
          </div>
          <div style={{ marginTop: 24 }}>
            <Space.Compact style={{ width: '100%' }}>
              <Input value={verificationUrl} readOnly />
              <Button type="primary" onClick={handleCopy}>Copy Link</Button>
            </Space.Compact>
          </div>
        </div>
      </Modal>
    </div>
  );
}