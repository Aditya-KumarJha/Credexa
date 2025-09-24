"use client";
import React, { useState } from "react";
import { Card, Typography, Button, Alert, Space, Divider } from "antd";
import { QRCodeCanvas } from "qrcode.react";
import { QRDataViewer } from "@/components/QRDataViewer";

const { Title, Text } = Typography;

export default function QRDemoPage() {
  const [viewingQRData, setViewingQRData] = useState<any>(null);

  // Sample credential data
  const sampleCredential = {
    _id: "sample123",
    title: "Introduction to Intellectual Property Rights",
    issuer: "upGrad",
    type: "certificate",
    issueDate: "2022-11-11T00:00:00.000Z",
    nsqfLevel: "5",
    creditPoints: "10",
    credentialHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    transactionHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
  };

  // Generate QR data like the CredentialCard component does
  const qrData = {
    type: "CREDEXA_CREDENTIAL_VERIFICATION",
    version: "1.0",
    credentialHash: sampleCredential.credentialHash,
    transactionHash: sampleCredential.transactionHash,
    blockchain: {
      network: "ethereum-sepolia",
      explorer: `https://sepolia.etherscan.io/tx/${sampleCredential.transactionHash}`
    },
    credential: {
      id: sampleCredential._id,
      title: sampleCredential.title,
      issuer: sampleCredential.issuer,
      type: sampleCredential.type,
      issueDate: sampleCredential.issueDate,
      nsqfLevel: sampleCredential.nsqfLevel,
      creditPoints: sampleCredential.creditPoints
    },
    verification: {
      url: `${typeof window !== "undefined" ? window.location.origin : ""}/verify?hash=${sampleCredential.credentialHash}`,
      timestamp: new Date().toISOString()
    }
  };

  const qrValue = JSON.stringify(qrData);

  const simulateQRScan = () => {
    // Simulate scanning the QR code
    setViewingQRData(qrData);
  };

  if (viewingQRData) {
    return (
      <QRDataViewer 
        qrData={viewingQRData} 
        onClose={() => setViewingQRData(null)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Title level={1} className="text-gray-800 mb-4">
            🎯 QR Code Demo - Enhanced Credential Verification
          </Title>
          <Text className="text-lg text-gray-600 max-w-3xl mx-auto block">
            This demonstrates the enhanced QR code system where scanning provides rich credential 
            information instead of just a simple verification link.
          </Text>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* QR Code Display */}
          <Card className="shadow-lg border-0 h-fit">
            <div className="text-center">
              <Title level={3} className="mb-4">Generated QR Code</Title>
              
              <div className="bg-white p-6 rounded-lg border-2 border-gray-200 inline-block mb-6">
                <QRCodeCanvas 
                  value={qrValue} 
                  size={240}
                  level="M"
                  includeMargin={true}
                />
              </div>

              <div className="space-y-3 text-left">
                <Alert
                  message="Enhanced QR Code"
                  description="This QR code contains structured JSON data with complete credential and blockchain information, not just a verification URL."
                  type="info"
                  showIcon
                />
                
                <Button 
                  type="primary" 
                  size="large" 
                  onClick={simulateQRScan}
                  className="w-full"
                >
                  📱 Simulate QR Scan
                </Button>
              </div>
            </div>
          </Card>

          {/* What's Inside */}
          <Card className="shadow-lg border-0">
            <Title level={3} className="mb-4">What's in the QR Code</Title>
            
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <Title level={5} className="text-blue-800 mb-2">🏷️ Credential Info</Title>
                <div className="text-sm space-y-1">
                  <div><strong>Title:</strong> {qrData.credential.title}</div>
                  <div><strong>Issuer:</strong> {qrData.credential.issuer}</div>
                  <div><strong>Type:</strong> {qrData.credential.type}</div>
                  <div><strong>NSQF Level:</strong> {qrData.credential.nsqfLevel}</div>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <Title level={5} className="text-green-800 mb-2">⛓️ Blockchain Data</Title>
                <div className="text-sm space-y-1">
                  <div><strong>Network:</strong> {qrData.blockchain.network}</div>
                  <div><strong>Hash:</strong> {qrData.credentialHash.substring(0, 20)}...</div>
                  <div><strong>Transaction:</strong> {qrData.transactionHash.substring(0, 20)}...</div>
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <Title level={5} className="text-purple-800 mb-2">🔍 Verification</Title>
                <div className="text-sm space-y-1">
                  <div><strong>Version:</strong> {qrData.version}</div>
                  <div><strong>Type:</strong> {qrData.type}</div>
                  <div><strong>Fallback URL:</strong> Available</div>
                </div>
              </div>
            </div>

            <Divider />

            <Alert
              message="Benefits of Enhanced QR Codes"
              description={
                <ul className="text-sm mt-2 space-y-1">
                  <li>• Rich offline viewing without internet</li>
                  <li>• Complete credential information at a glance</li>
                  <li>• Blockchain verification details</li>
                  <li>• Backwards compatible with URL fallback</li>
                  <li>• Enhanced user experience</li>
                </ul>
              }
              type="success"
              showIcon
            />
          </Card>
        </div>

        {/* Technical Details */}
        <Card className="shadow-lg border-0 mt-8">
          <Title level={3} className="mb-4">🔧 Technical Implementation</Title>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl mb-2">📱</div>
              <Title level={5}>QR Generation</Title>
              <Text className="text-sm">
                Creates structured JSON payload with credential and blockchain data
              </Text>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl mb-2">🔍</div>
              <Title level={5}>Smart Parsing</Title>
              <Text className="text-sm">
                Detects JSON structure vs URL and handles both formats
              </Text>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl mb-2">⚡</div>
              <Title level={5}>Rich Display</Title>
              <Text className="text-sm">
                Shows complete credential info before blockchain verification
              </Text>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
