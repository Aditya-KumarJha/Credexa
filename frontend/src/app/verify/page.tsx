"use client";
import { useState, useEffect, useRef } from "react";
import { 
  Input, 
  Button, 
  Card, 
  Typography, 
  Spin, 
  Result, 
  Modal, 
  message, 
  Space, 
  Tabs, 
  Alert,
  Divider,
  Badge,
  Tooltip,
  Switch
} from "antd";
import { 
  QrcodeOutlined, 
  CheckCircleOutlined, 
  CameraOutlined,
  ShareAltOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  SecurityScanOutlined,
  CalendarOutlined,
  UserOutlined
} from "@ant-design/icons";
import { QRCodeCanvas } from "qrcode.react";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";

const { Title, Text, Paragraph } = Typography;

interface VerificationResult {
  verified: boolean;
  issuer?: string;
  timestamp?: number;
  error?: string;
  structuredData?: any;
  blockchainData?: any;
}

export default function VerifyCredentialPage() {
  const [credentialHash, setCredentialHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("manual");
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt' | null>(null);

  // Check for hash in URL parameters on page load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hashFromUrl = params.get('hash');
    if (hashFromUrl) {
      setCredentialHash(hashFromUrl);
      // Auto-verify after a short delay
      setTimeout(() => handleVerify(hashFromUrl), 500);
    }
  }, []);

  // Check camera permissions
  useEffect(() => {
    const checkCameraPermission = async () => {
      try {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setCameraPermission(permission.state);
        permission.onchange = () => setCameraPermission(permission.state);
      } catch (err) {
        console.log('Camera permission check not supported');
      }
    };
    checkCameraPermission();
  }, []);

  // Initialize QR Scanner
  useEffect(() => {
    if (activeTab === "scan" && !scannerRef.current && !isScanning) {
      // Add a small delay to ensure the DOM element is available
      const timer = setTimeout(() => {
        initializeScanner();
      }, 100);
      return () => clearTimeout(timer);
    }
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (e) {
          console.log('Scanner cleanup error:', e);
        }
        scannerRef.current = null;
      }
    };
  }, [activeTab]);

  const initializeScanner = () => {
    try {
      setIsScanning(true);
      setScannerError(null);
      
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
      };

      scannerRef.current = new Html5QrcodeScanner("qr-reader", config, false);
      
      scannerRef.current.render(
        (decodedText) => {
          // Success callback
          handleQRScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Error callback - only log, don't show to user unless persistent
          console.log('QR scan error:', errorMessage);
        }
      );
    } catch (err) {
      console.error('Scanner initialization error:', err);
      setScannerError('Failed to initialize camera scanner. Please check camera permissions.');
      setIsScanning(false);
    }
  };

  const handleQRScanSuccess = (decodedText: string) => {
    console.log('QR code scanned:', decodedText);
    let hash = decodedText;
    
    try {
      // Try to parse as JSON (structured QR data)
      const qrData = JSON.parse(decodedText);
      
      if (qrData.type === "CREDEXA_CREDENTIAL_VERIFICATION" && qrData.credentialHash) {
        console.log('Structured QR data detected:', qrData);
        
        // Display structured data in a modal or result
        setResult({
          verified: true, // We'll verify this against blockchain
          issuer: qrData.credential?.issuer || 'Unknown',
          timestamp: qrData.credential?.issueDate ? new Date(qrData.credential.issueDate).getTime() / 1000 : Date.now() / 1000,
          structuredData: qrData
        });
        
        hash = qrData.credentialHash;
        setCredentialHash(hash);
        
        message.success("Structured QR data scanned successfully!");
        
        // Auto-verify blockchain data
        setTimeout(() => handleBlockchainVerify(hash, qrData), 500);
      } else {
        // Fallback to URL parsing
        parseUrlHash(decodedText);
      }
    } catch (e) {
      // Not JSON, try URL parsing
      parseUrlHash(decodedText);
    }
    
    setActiveTab("manual");
    
    // Stop the scanner and clean up
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
      } catch (e) {
        console.log('Scanner cleanup error:', e);
      }
      scannerRef.current = null;
      setIsScanning(false);
    }
  };

  const parseUrlHash = (decodedText: string) => {
    let hash = decodedText;
    
    // Extract hash from URL if it's a full URL
    if (decodedText.includes('/verify')) {
      const urlMatch = decodedText.match(/[?&]hash=([a-fA-F0-9x]+)/);
      if (urlMatch && urlMatch[1]) {
        hash = urlMatch[1];
      }
    } else if (decodedText.includes('/api/credentials/verify/')) {
      const apiMatch = decodedText.match(/api\/credentials\/verify\/([a-fA-F0-9x]+)/);
      if (apiMatch && apiMatch[1]) {
        hash = apiMatch[1];
      }
    } else if (decodedText.startsWith('0x') && decodedText.length === 66) {
      hash = decodedText;
    }
    
    console.log('Extracted hash:', hash);
    setCredentialHash(hash);
    message.success("QR code scanned successfully!");
    
    // Auto-verify if hash is valid
    if (hash.startsWith('0x') && hash.length === 66) {
      console.log('Auto-verifying scanned hash');
      setTimeout(() => handleVerify(hash), 500);
    } else {
      message.warning('Invalid credential hash format. Please check and verify manually.');
    }
  };

  const handleBlockchainVerify = async (hash: string, structuredData?: any) => {
    setLoading(true);
    
    try {
      const cleanHash = hash.startsWith('0x') ? hash : `0x${hash}`;
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${API_BASE_URL}/api/credentials/verify/${cleanHash}`);
      const data = await res.json();
      
      if (res.ok && data.issuer) {
        setResult({ 
          verified: true, 
          issuer: data.issuer, 
          timestamp: data.timestamp,
          structuredData: structuredData || null,
          blockchainData: data
        });
        message.success("Credential verified on blockchain!");
      } else {
        setResult({ 
          verified: false, 
          error: data.error || "Credential not found on blockchain",
          structuredData: structuredData || null
        });
        message.error("Blockchain verification failed");
      }
    } catch (e) {
      const errorMsg = "Blockchain verification failed. Please check your connection.";
      setError(errorMsg);
      setResult({ 
        verified: false, 
        error: errorMsg,
        structuredData: structuredData || null
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (hashToVerify?: string) => {
    const hash = hashToVerify || credentialHash;
    if (!hash) return;

    await handleBlockchainVerify(hash);
  };

  const verificationUrl = credentialHash
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/verify?hash=${credentialHash}`
    : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(verificationUrl);
    message.success("Link copied to clipboard!");
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const clearResults = () => {
    setResult(null);
    setError(null);
    setCredentialHash("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <SecurityScanOutlined className="text-2xl text-white" />
          </div>
          <Title level={1} className="text-gray-800 mb-2">
            Credential Verification
          </Title>
          <Paragraph className="text-lg text-gray-600 max-w-2xl mx-auto">
            Verify the authenticity of blockchain-secured credentials instantly. 
            Enter a credential hash manually or scan a QR code to get started.
          </Paragraph>
        </div>

        {/* Main Verification Card */}
        <Card className="shadow-lg border-0 mb-6">
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            size="large"
            className="mb-4"
            items={[
              {
                key: "manual",
                label: (
                  <span>
                    <LinkOutlined />
                    Manual Entry
                  </span>
                ),
                children: (
                  <div className="space-y-4">
                    <div>
                      <Text strong className="block mb-2">
                        Credential Hash
                      </Text>
                      <Input.Search
                        size="large"
                        placeholder="Enter or paste credential hash (0x...)"
                        value={credentialHash}
                        onChange={(e) => setCredentialHash(e.target.value)}
                        onSearch={() => handleVerify()}
                        enterButton={
                          <Button 
                            type="primary" 
                            icon={<CheckCircleOutlined />}
                            loading={loading}
                            size="large"
                          >
                            Verify
                          </Button>
                        }
                        className="w-full"
                      />
                      <Text type="secondary" className="text-sm mt-1 block">
                        Hash should start with "0x" followed by 64 hexadecimal characters
                      </Text>
                    </div>

                    {credentialHash && (
                      <div className="flex gap-2">
                        <Button
                          icon={<ShareAltOutlined />}
                          onClick={() => setIsModalOpen(true)}
                          size="large"
                        >
                          Generate QR Code
                        </Button>
                        <Button
                          icon={<CloseCircleOutlined />}
                          onClick={clearResults}
                          size="large"
                        >
                          Clear
                        </Button>
                      </div>
                    )}
                  </div>
                )
              },
              {
                key: "scan",
                label: (
                  <span>
                    <CameraOutlined />
                    QR Scanner
                    {cameraPermission === 'denied' && (
                      <Badge status="error" className="ml-2" />
                    )}
                  </span>
                ),
                children: (
                  <div className="text-center">
                    {cameraPermission === 'denied' && (
                      <Alert
                        message="Camera Access Denied"
                        description="Please enable camera permissions in your browser settings to use QR scanning."
                        type="warning"
                        showIcon
                        className="mb-4"
                      />
                    )}
                    
                    {scannerError && (
                      <Alert
                        message="Scanner Error"
                        description={scannerError}
                        type="error"
                        showIcon
                        className="mb-4"
                      />
                    )}

                    <div 
                      id="qr-reader" 
                      className="mx-auto max-w-md"
                      style={{ 
                        border: isScanning ? '2px solid #1890ff' : '2px dashed #d9d9d9',
                        borderRadius: '8px',
                        minHeight: '300px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {!isScanning && !scannerError && (
                        <div className="text-center p-8">
                          <CameraOutlined className="text-4xl text-gray-400 mb-4" />
                          <Text type="secondary">
                            Camera scanner will appear here
                          </Text>
                        </div>
                      )}
                    </div>

                    <div className="mt-4">
                      <Text type="secondary">
                        Position the QR code within the scanning area. 
                        The credential will be verified automatically once detected.
                      </Text>
                    </div>
                  </div>
                )
              }
            ]}
          />
        </Card>

        {/* Loading State */}
        {loading && (
          <Card className="text-center shadow-lg border-0 mb-6">
            <Spin size="large" />
            <div className="mt-4">
              <Text className="text-lg">Verifying credential on blockchain...</Text>
            </div>
          </Card>
        )}

        {/* Results Section */}
        {result && (
          <Card className="shadow-lg border-0 mb-6">
            {result.verified ? (
              <Result
                status="success"
                icon={<CheckCircleOutlined className="text-green-500" />}
                title={
                  <span className="text-2xl font-bold text-green-600">
                    ✅ Credential Verified!
                  </span>
                }
                subTitle={
                  <div className="space-y-4 mt-4">
                    {/* Structured Data Display */}
                    {result.structuredData && (
                      <div className="bg-blue-50 p-4 rounded-lg mb-4">
                        <Title level={5} className="text-blue-800 mb-3">
                          📱 QR Code Data (Scanned)
                        </Title>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <Text strong>Title:</Text>
                            <Text className="block text-blue-700">{result.structuredData.credential?.title || 'N/A'}</Text>
                          </div>
                          <div>
                            <Text strong>Type:</Text>
                            <Text className="block text-blue-700">{result.structuredData.credential?.type || 'N/A'}</Text>
                          </div>
                          <div>
                            <Text strong>NSQF Level:</Text>
                            <Text className="block text-blue-700">{result.structuredData.credential?.nsqfLevel || 'N/A'}</Text>
                          </div>
                          <div>
                            <Text strong>Credit Points:</Text>
                            <Text className="block text-blue-700">{result.structuredData.credential?.creditPoints || 'N/A'}</Text>
                          </div>
                          <div className="md:col-span-2">
                            <Text strong>Blockchain Network:</Text>
                            <Text className="block text-blue-700">{result.structuredData.blockchain?.network || 'N/A'}</Text>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Blockchain Verification Data */}
                    <div className="bg-green-50 p-4 rounded-lg">
                      <Title level={5} className="text-green-800 mb-3">
                        ⛓️ Blockchain Verification
                      </Title>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <UserOutlined className="text-green-600" />
                          <div>
                            <Text strong className="block">Issuer</Text>
                            <Text className="text-green-700">{result.issuer}</Text>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarOutlined className="text-green-600" />
                          <div>
                            <Text strong className="block">Issued On</Text>
                            <Text className="text-green-700">
                              {result.timestamp ? formatTimestamp(result.timestamp) : 'N/A'}
                            </Text>
                          </div>
                        </div>
                        {result.blockchainData?.transactionHash && (
                          <div className="md:col-span-2">
                            <Text strong className="block">Transaction Hash</Text>
                            <Text className="text-green-700 font-mono text-xs break-all">
                              {result.blockchainData.transactionHash}
                            </Text>
                          </div>
                        )}
                      </div>
                    </div>

                    <Alert
                      message={result.structuredData ? "QR Code & Blockchain Verified" : "Blockchain Verified"}
                      description={
                        result.structuredData 
                          ? "This credential was scanned from a QR code and verified on the blockchain. All data is authentic."
                          : "This credential has been verified on the blockchain and is authentic."
                      }
                      type="success"
                      showIcon
                    />
                  </div>
                }
                extra={[
                  <Button 
                    key="verify-another" 
                    type="primary" 
                    onClick={clearResults}
                    size="large"
                  >
                    Verify Another Credential
                  </Button>,
                  <Button 
                    key="share" 
                    icon={<ShareAltOutlined />}
                    onClick={() => setIsModalOpen(true)}
                    size="large"
                  >
                    Share Verification
                  </Button>
                ]}
              />
            ) : (
              <Result
                status="error"
                icon={<CloseCircleOutlined className="text-red-500" />}
                title={
                  <span className="text-2xl font-bold text-red-600">
                    ❌ Credential Not Verified
                  </span>
                }
                subTitle={
                  <div className="space-y-3 mt-4">
                    <Alert
                      message="Verification Failed"
                      description={result.error || "The credential hash could not be verified on the blockchain."}
                      type="error"
                      showIcon
                    />
                    <Text type="secondary">
                      This could mean the credential is not authentic, the hash is incorrect, 
                      or the credential has not been properly anchored to the blockchain.
                    </Text>
                  </div>
                }
                extra={[
                  <Button 
                    key="try-again" 
                    type="primary" 
                    onClick={clearResults}
                    size="large"
                  >
                    Try Another Hash
                  </Button>
                ]}
              />
            )}
          </Card>
        )}

        {/* Error State */}
        {error && !result && (
          <Card className="shadow-lg border-0 mb-6">
            <Alert
              message="Verification Error"
              description={error}
              type="error"
              showIcon
              action={
                <Button size="small" onClick={() => setError(null)}>
                  Dismiss
                </Button>
              }
            />
          </Card>
        )}

        {/* Info Section */}
        <Card className="shadow-lg border-0" title={
          <span>
            <InfoCircleOutlined className="mr-2" />
            How It Works
          </span>
        }>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <QrcodeOutlined className="text-xl text-blue-600" />
              </div>
              <Title level={4}>1. Enter or Scan</Title>
              <Text type="secondary">
                Enter the credential hash manually or scan the QR code
              </Text>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <SecurityScanOutlined className="text-xl text-blue-600" />
              </div>
              <Title level={4}>2. Blockchain Verification</Title>
              <Text type="secondary">
                We verify the credential against the blockchain record
              </Text>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircleOutlined className="text-xl text-blue-600" />
              </div>
              <Title level={4}>3. Get Results</Title>
              <Text type="secondary">
                Receive instant verification with issuer details
              </Text>
            </div>
          </div>
        </Card>

        {/* QR Code Share Modal */}
        <Modal
          title={
            <span>
              <ShareAltOutlined className="mr-2" />
              Share Verification Link
            </span>
          }
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          footer={null}
          centered
          width={600}
        >
          <div className="text-center p-6">
            <Paragraph className="text-gray-600 mb-6">
              Share this QR code or link to allow others to verify this credential's authenticity on the blockchain.
            </Paragraph>
            
            <div className="bg-white p-6 rounded-lg border-2 border-gray-200 inline-block mb-6">
              <QRCodeCanvas 
                value={verificationUrl} 
                size={240}
                level="M"
                includeMargin={true}
              />
            </div>
            
            <div className="space-y-4">
              <div>
                <Text strong className="block mb-2">Verification URL:</Text>
                <Space.Compact style={{ width: '100%' }}>
                  <Input value={verificationUrl} readOnly />
                  <Tooltip title="Copy to clipboard">
                    <Button type="primary" icon={<LinkOutlined />} onClick={handleCopy}>
                      Copy
                    </Button>
                  </Tooltip>
                </Space.Compact>
              </div>
              
              <Alert
                message="Security Notice"
                description="This verification link is public and can be used by anyone to verify the credential. No private information is exposed."
                type="info"
                showIcon
              />
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}