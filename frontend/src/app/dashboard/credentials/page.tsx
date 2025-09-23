"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
const Sidebar = dynamic(() => import("@/components/dashboard/Sidebar"), { ssr: false });
import api from "@/utils/axios";
import {
  Button,
} from "@/components/ui/button";
import {
  Card as AntCard,
  Modal,
  Button as AntButton,
  Form,
  Input,
  Select,
  Skeleton,
  DatePicker,
  Upload,
  Row,
  Col,
  Space,
  Empty,
  Popconfirm,
  message,
  Steps,
  Radio,
  ConfigProvider,
  theme as antdTheme,
  App,
} from "antd";
import {
  Award,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Share2,
  Download,
} from "lucide-react";
import dayjs from "dayjs";
import { useTheme } from "next-themes";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";
import { CardSpotlight } from "@/components/ui/card-spotlight";

type CredentialType = "certificate" | "degree" | "license" | "badge";
type CredentialStatus = "verified" | "pending";

interface Credential {
  _id?: string;
  title: string;
  issuer: string;
  type: CredentialType;
  status: CredentialStatus;
  issueDate: string; // ISO
  description?: string;
  skills: string[];
  credentialUrl?: string;
  imageUrl?: string;
  nsqfLevel?: number;
  blockchainAddress?: string;
  transactionHash?: string;
  issuerLogo?: string;
  credentialId?: string;
  creditPoints?: number;
  createdAt?: string;
}

// AntD v5: use Select options prop instead of Select.Option

function CredentialsPageContent() {
  const { message } = App.useApp();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { theme: mode } = useTheme();
  const isDark = (mode ?? "light") === "dark";
  const router = useRouter();
  const [items, setItems] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  // State for blockchain anchoring
  const [anchoringId, setAnchoringId] = useState<string | null>(null);
  // Handler to anchor a credential on the blockchain
  const handleAnchorCredential = async (credentialId?: string) => {
    if (!credentialId) return;
    setAnchoringId(credentialId);
    const token = localStorage.getItem("authToken");
    try {
      message.loading({ content: 'Generating secure hash...', key: 'anchor' });
      const hashRes = await api.post(`/api/credentials/${credentialId}/generate-hash`, {}, { headers: { Authorization: `Bearer ${token}` } });
      const { hash } = hashRes.data;

      message.loading({ content: 'Anchoring on the blockchain...', key: 'anchor' });
      const anchorRes = await api.post('/api/credentials/anchor', { hash }, { headers: { Authorization: `Bearer ${token}` } });
      const { transactionHash } = anchorRes.data;

      setItems((prevItems) =>
        prevItems.map((item) =>
          item._id === credentialId ? { ...item, transactionHash } : item
        )
      );
      message.success({ content: 'Credential anchored successfully!', key: 'anchor' });
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || "Anchoring failed.";
      message.error({ content: errorMessage, key: 'anchor' });
    } finally {
      setAnchoringId(null);
    }
  };
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [issuerFilter, setIssuerFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<
    "newest" | "oldest" | "az" | "za" | "pointsDesc" | "pointsAsc"
  >("newest");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Credential | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [addMethod, setAddMethod] = useState<"sync" | "upload" | "manual" | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<any>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [skillsData, setSkillsData] = useState<{
    categories: any;
    allSkills: string[];
    filterCategories: any[];
  }>({ categories: {}, allSkills: [], filterCategories: [] });
  const [loadingSkills, setLoadingSkills] = useState(false);

  // Simple catalog of supported platforms for the selector UI
  const platforms: { key: string; name: string; logo: string }[] = [
    { key: "coursera", name: "Coursera", logo: "/coursera-logo.png" },
    { key: "udemy", name: "Udemy", logo: "/placeholder-logo.png" },
    { key: "nptel", name: "NPTEL", logo: "/placeholder-logo.png" },
    { key: "edx", name: "edX", logo: "/placeholder-logo.png" },
    { key: "linkedin", name: "LinkedIn Learning", logo: "/placeholder-logo.png" },
    { key: "google", name: "Google", logo: "/google-logo.png" },
    { key: "microsoft", name: "Microsoft", logo: "/microsoft-logo.png" },
    { key: "ibm", name: "IBM", logo: "/ibm-logo.png" },
    { key: "aws", name: "AWS", logo: "/aws-logo.png" },
  ];

  const fetchItems = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return router.replace("/login");
    try {
      const res = await api.get("/api/credentials", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(res.data);
    } catch (e: any) {
      if (e?.response?.status === 401) {
        localStorage.removeItem("authToken");
        return router.replace("/login?error=session_expired");
      }
      message.error("Failed to load credentials");
    } finally {
      setLoading(false);
    }
  };

  const fetchSkills = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    
    setLoadingSkills(true);
    try {
      const res = await api.get("/api/skills", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSkillsData(res.data);
    } catch (e: any) {
      console.error("Failed to load skills data:", e);
      // Don't show error message as this is not critical
    } finally {
      setLoadingSkills(false);
    }
  };

  // Certificate extraction function
  const extractCertificateInfo = async (file: File) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      message.error("Please login first");
      return null;
    }

    try {
      const formData = new FormData();
      formData.append('certificateFile', file);
      
      // Show loading message
      console.log('Extracting certificate information...');
      
      const response = await api.post('/api/credentials/extract', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type, let axios set it with boundary for multipart
        },
      });

      console.log('Certificate information extracted successfully!');
      
      if (response.data && response.data.success && response.data.extracted) {
        return response.data.extracted;
      } else {
        throw new Error(response.data?.message || 'Failed to extract information');
      }
    } catch (error: any) {
      console.error('Extraction error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: error.config
      });
      console.error('Failed to extract certificate information:', error.response?.data?.message || error.message);
      return null;
    }
  };

  useEffect(() => {
    fetchItems();
    fetchSkills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const base = items.filter((c) => {
      const matchesSearch =
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.issuer.toLowerCase().includes(search.toLowerCase()) ||
        (c.skills || []).some((s) => s.toLowerCase().includes(search.toLowerCase()));
      const matchesType = typeFilter === "all" || c.type === typeFilter;
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      const matchesIssuer = issuerFilter === "all" || c.issuer === issuerFilter;
      return matchesSearch && matchesType && matchesStatus && matchesIssuer;
    });
    const sorted = [...base].sort((a, b) => {
      if (sortKey === "newest") {
        return (new Date(b.issueDate).getTime() || 0) - (new Date(a.issueDate).getTime() || 0);
      }
      if (sortKey === "oldest") {
        return (new Date(a.issueDate).getTime() || 0) - (new Date(b.issueDate).getTime() || 0);
      }
      if (sortKey === "az") {
        return a.title.localeCompare(b.title);
      }
      if (sortKey === "za") {
        return b.title.localeCompare(a.title);
      }
      if (sortKey === "pointsDesc") {
        return (b.creditPoints || 0) - (a.creditPoints || 0);
      }
      if (sortKey === "pointsAsc") {
        return (a.creditPoints || 0) - (b.creditPoints || 0);
      }
      return 0;
    });
    return sorted;
  }, [items, search, typeFilter, statusFilter, issuerFilter, sortKey]);

  // Derived options
  const uniqueIssuers = useMemo(() => {
    const set = new Set(items.map((it) => it.issuer).filter(Boolean));
    return ["all", ...Array.from(set)] as string[];
  }, [items]);

  const handleDelete = async (id?: string) => {
    if (!id) return;
    const token = localStorage.getItem("authToken");
    try {
      await api.delete(`/api/credentials/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setItems((prev) => prev.filter((x) => x._id !== id));
      message.success("Deleted");
    } catch {
      message.error("Delete failed");
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
      message.error("Please fill in all required fields");
    }
  };

  const openCreate = () => {
    setEditing(null);
    setFile(null);
    setAddMethod(null);
    setSelectedPlatform(null);
    setFormValues(null);
    setCurrentStep(0);
    setIsModalOpen(true);
  };

  const openEdit = (c: Credential) => {
    setEditing(c);
    setFile(null);
    setAddMethod("manual");
    setCurrentStep(1);
    setIsModalOpen(true);
  };

  const [form] = Form.useForm();

  // Initialize or reset form only when the Form is actually rendered (step 1)
  useEffect(() => {
    if (!isModalOpen || currentStep !== 1) return;
    if (editing) {
      form.setFieldsValue({
        title: editing.title,
        issuer: editing.issuer,
        type: editing.type,
        issueDate: editing.issueDate ? dayjs(editing.issueDate) : undefined,
        description: editing.description,
        skills: (editing.skills || []).join(", "),
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
  }, [isModalOpen, currentStep, editing, form]);

  const submitForm = async () => {
    const token = localStorage.getItem("authToken");
    const fd = new FormData();
    let payload: Record<string, any> = {};

    try {
      if (addMethod === "sync") {
        // Only allow file upload for sync path; create minimal defaults
        if (!file) {
          message.error("Please upload a certificate file to continue.");
          return;
        }
        const inferredTitle = file.name?.replace(/\.[^/.]+$/, "") || "Synced Credential";
        payload = {
          title: inferredTitle,
          issuer: selectedPlatform || "Unknown",
          type: "certificate",
          status: "pending",
          issueDate: new Date().toISOString(),
          description: "",
          credentialUrl: "",
          nsqfLevel: "",
          blockchainAddress: "",
          transactionHash: "",
          credentialId: "",
          creditPoints: "",
          skills: "",
        };
      } else {
        // Manual / Upload go through the full details form
        console.log('Current step:', currentStep);
        console.log('Add method:', addMethod);
        console.log('Stored form values:', formValues);
        
        // Use stored form values from step 1
        const values = formValues;
        
        if (!values || !values.title) {
          console.log('Title validation failed - values:', values);
          message.error("Please go back and fill in the title field");
          return;
        }
        
        console.log('Using stored form values:', values);
        
        const skillArray = String(values.skills || "")
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean);
        payload = {
          title: values.title,
          issuer: values.issuer || "Unknown",
          type: values.type || "certificate",
          status: "pending",
          issueDate: values.issueDate?.toISOString() || new Date().toISOString(),
          description: values.description || "",
          credentialUrl: values.credentialUrl || "",
          nsqfLevel: values.nsqfLevel || "",
          blockchainAddress: values.blockchainAddress || "",
          transactionHash: values.transactionHash || "",
          credentialId: values.credentialId || "",
          creditPoints: values.creditPoints || "",
          skills: skillArray.join(", "),
        };
      }      Object.entries(payload).forEach(([k, v]) => {
        if (v !== undefined && v !== null) fd.append(k, String(v));
      });
      if (file) fd.append("certificateFile", file);
      if (!file && editing?.imageUrl) fd.append("imageUrl", editing.imageUrl);

      console.log('Submitting credential with payload:', payload);
      console.log('FormData contents:');
      for (let [key, value] of fd.entries()) {
        console.log(`${key}:`, value);
      }

      if (editing?._id) {
        const res = await api.put(`/api/credentials/${editing._id}`, fd, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setItems((prev) => prev.map((x) => (x._id === res.data._id ? res.data : x)));
        message.success("Credential updated successfully!");
      } else {
        const res = await api.post(`/api/credentials`, fd, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setItems((prev) => [res.data, ...prev]);
        message.success("Credential created successfully!");
      }
      
      // Reset all modal state
      form.resetFields();
      setFile(null);
      setAddMethod(null);
      setSelectedPlatform(null);
      setFormValues(null);
      setCurrentStep(0);
      setEditing(null);
      setIsModalOpen(false);
      
    } catch (e: any) {
      console.error('Save failed:', e);
      message.error(e.response?.data?.message || "Failed to save credential");
    }
  };

  const handleAnchor = async () => {
    if (!editing?._id) {
      message.error("Please save the credential first");
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) return router.replace("/login");

    try {
      // Step 1: Generate hash for the credential
      const hashRes = await api.post(`/api/credentials/${editing._id}/generate-hash`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { hash } = hashRes.data;

      // Step 2: Anchor the hash to blockchain
      const anchorRes = await api.post('/api/credentials/anchor', { hash }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Step 3: Update the credential with transaction hash
      if (anchorRes.data.transactionHash) {
        const credRes = await api.put(`/api/credentials/${editing._id}`, {
          transactionHash: anchorRes.data.transactionHash,
          status: 'verified'
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setItems((prev) => prev.map((x) => (x._id === credRes.data._id ? credRes.data : x)));
        message.success("Credential anchored successfully!");
        setIsModalOpen(false);
      }
    } catch (err) {
      console.error('Anchor Error:', err);
      message.error("Failed to anchor credential");
    }
  };

  const statusTag = (status: CredentialStatus) => {
    const base = "px-2 py-0.5 text-xs rounded-md inline-flex items-center gap-1 border";
    if (status === "verified") return (
      <span className={`${base} bg-emerald-500/10 text-emerald-500 border-emerald-500/20`}>
        <CheckCircle className="w-3.5 h-3.5" /> Verified
      </span>
    );
    return (
      <span className={`${base} bg-yellow-500/10 text-yellow-500 border-yellow-500/20`}>
        <Clock className="w-3.5 h-3.5" /> Pending
      </span>
    );
  };

  if (!mounted) return null;
  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorBgBase: "var(--color-background)",
          colorBgContainer: "var(--color-card)",
          colorBgElevated: "var(--color-card)",
          colorText: "var(--color-foreground)",
          colorTextSecondary: "var(--color-muted-foreground)",
          colorBorder: "var(--color-border)",
          colorPrimary: "var(--color-primary)",
          colorLink: "var(--color-primary)",
          colorLinkHover: "var(--color-primary)",
          borderRadius: 12,
        },
        components: {
          Modal: {
            headerBg: "var(--color-card)",
            contentBg: "var(--color-card)",
            footerBg: "var(--color-card)",
            titleColor: "var(--color-foreground)",
            colorText: "var(--color-foreground)",
          },
          Card: {
            colorBgContainer: "var(--color-card)",
            headerBg: "var(--color-card)",
          },
          Input: {
            colorBgContainer: "var(--color-card)",
            colorText: "#ffffff",
            colorTextPlaceholder: "#ffffff",
            colorBorder: "var(--color-border)",
            activeBg: "var(--color-card)",
            hoverBg: "var(--color-card)",
          },
          Select: {
            colorBgContainer: "var(--color-card)",
            colorText: "var(--color-foreground)",
            colorTextPlaceholder: "var(--color-muted-foreground)",
            colorBorder: "var(--color-border)",
          },
        },
      }}
    >
      <div className="min-h-screen bg-background text-foreground flex">
        <Sidebar />
        <main className="flex-1 p-6 md:p-10">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-8">
          <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                My Credentials
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Manage and showcase your verified achievements</p>
          </div>
          <Space>
            <ThemeToggleButton variant="gif" url="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWI1ZmNvMGZyemhpN3VsdWp4azYzcWUxcXIzNGF0enp0eW1ybjF0ZyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/Fa6uUw8jgJHFVS6x1t/giphy.gif" />
            <Button variant="outline" className="bg-transparent" onClick={() => message.info("Share coming soon")}> 
              <Share2 className="w-4 h-4 mr-2" /> Share Profile
            </Button>
            <Button onClick={openCreate} className="shadow"> 
              <Plus className="w-4 h-4 mr-2" /> Add Credential
            </Button>
          </Space>
        </div>

        {/* Stats summary */}
        <CardSpotlight className="mb-8 border-0 shadow bg-card/80 p-0 rounded-lg">
          <div className="p-5 pb-4">
            <Row gutter={[12, 12]}>
              <Col xs={12} md={6}>
                <div className="px-3 py-2 rounded-lg border bg-background relative z-20">
                  <div className="text-xs text-muted-foreground">Total</div>
                  <div className="text-xl font-semibold">{items.length}</div>
                </div>
              </Col>
              <Col xs={12} md={6}>
                <div className="px-3 py-2 rounded-lg border bg-background relative z-20">
                  <div className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Verified</div>
                  <div className="text-xl font-semibold">{items.filter((i) => i.status === "verified").length}</div>
                </div>
              </Col>
              <Col xs={12} md={6}>
                <div className="px-3 py-2 rounded-lg border bg-background relative z-20">
                  <div className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-yellow-500" /> Pending</div>
                  <div className="text-xl font-semibold">{items.filter((i) => i.status === "pending").length}</div>
                </div>
              </Col>
            </Row>
          </div>
        </CardSpotlight>

        <CardSpotlight className="mb-8 border-0 shadow-lg bg-card/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur p-0 rounded-lg">
          <div className="p-5">
            <Row gutter={[12, 12]} align="middle">
              <Col xs={24} md={8}>
                <div className="relative z-30">
                  <Input 
                    placeholder="Search by title, issuer, or skill" 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                    allowClear 
                  />
                </div>
              </Col>
              <Col xs={12} md={6}>
                <div className="relative z-30">
                  <Select value={typeFilter} onChange={setTypeFilter} className="w-full" options={[
                    { value: "all", label: "All Types" },
                    { value: "certificate", label: "Certificate" },
                    { value: "degree", label: "Degree" },
                    { value: "license", label: "License" },
                    { value: "badge", label: "Badge" },
                  ]} />
                </div>
              </Col>
              <Col xs={12} md={5}>
                <div className="relative z-30">
                  <Select value={statusFilter} onChange={setStatusFilter} className="w-full" options={[
                    { value: "all", label: "All Status" },
                    { value: "verified", label: "Verified" },
                    { value: "pending", label: "Pending" },
                  ]} />
                </div>
              </Col>
              <Col xs={12} md={5}>
                <div className="relative z-30">
                  <Select
                    value={issuerFilter}
                    onChange={setIssuerFilter}
                    className="w-full"
                    options={uniqueIssuers.map((u) => ({ value: u, label: u === "all" ? "All Issuers" : u }))}
                  />
                </div>
              </Col>
              <Col xs={12} md={6}>
                <div className="relative z-30">
                  <Select
                    value={sortKey}
                    onChange={(v) => setSortKey(v)}
                    className="w-full"
                    options={[
                      { value: "newest", label: "Newest" },
                      { value: "oldest", label: "Oldest" },
                      { value: "az", label: "Title A→Z" },
                      { value: "za", label: "Title Z→A" },
                      { value: "pointsDesc", label: "Points High→Low" },
                      { value: "pointsAsc", label: "Points Low→High" },
                    ]}
                  />
                </div>
              </Col>
            </Row>
          </div>
        </CardSpotlight>

        {loading ? (
          <Row gutter={[20, 20]} className="mt-6"> 
            {Array.from({ length: 6 }).map((_, i) => (
              <Col xs={24} sm={12} lg={8} key={i}>
                <AntCard className="border-0 shadow-lg bg-card/80" styles={{ body: { padding: "20px" } }}>
                  <Skeleton active avatar paragraph={{ rows: 3 }} />
                </AntCard>
              </Col>
            ))}
          </Row>
        ) : filtered.length === 0 ? (
          <AntCard 
            className="py-12 mt-6 border-0 shadow-lg bg-card/80" 
            styles={{ body: { background: "transparent", padding: "48px 24px" } }}
          >
            <Empty description="No credentials found" />
          </AntCard>
        ) : (
          <Row gutter={[20, 20]} className="mt-6"> 
            {filtered.map((c) => (
              <Col xs={24} sm={12} lg={8} key={c._id || c.title}>
                <CardSpotlight className="h-full border-0 shadow-lg hover:shadow-xl transition bg-card/80 p-0 rounded-lg">
                  {/* Card Header */}
                  <div className="px-5 py-4 border-b border-white/10 relative">
                    <div className="flex items-center gap-2 text-sm mb-3">
                      <Award className="w-4 h-4" />
                      <span className="truncate pr-20">{c.title}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        {statusTag(c.status)}
                      </div>
                      {/* Action Buttons - Positioned in header with proper z-index */}
                      <div className="relative z-50">
                        <Space size="small">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-sm border-gray-200 text-gray-700 hover:text-gray-900" 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openEdit(c);
                            }}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Popconfirm 
                            title="Delete this credential?" 
                            onConfirm={() => handleDelete(c._id)}
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
                    {/* Certificate Image */}
                    {c.imageUrl && (
                      <div 
                        className="w-full h-40 relative rounded-lg overflow-hidden bg-muted cursor-pointer hover:opacity-90 transition-opacity shadow-sm mb-4"
                        onClick={() => setViewingImage(c.imageUrl!)}
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
                        <a target="_blank" rel="noreferrer" href={c.credentialUrl} className="text-primary hover:underline flex items-center gap-1">
                          <Download className="w-4 h-4" /> View Credential
                        </a>
                      )}
                    </div>
                  </div>
                </CardSpotlight>
              </Col>
            ))}
          </Row>
        )}

        <Modal
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          title={editing ? "Edit Credential" : "Add Credential"}
          footer={null}
          width={800}
          destroyOnHidden
        >
          <div className="mb-6">
            <Steps current={currentStep} items={[{ title: "Method" }, { title: "Details" }, { title: "Verification" }]} />
          </div>

          {currentStep === 0 && (
            <div className="space-y-5">
              <p className="text-sm text-muted-foreground">How do you want to add your credential?</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { key: "sync", title: "Sync from Platform", desc: "Connect your account to import credentials", icon: "🌐" },
                  { key: "upload", title: "Upload Certificate", desc: "Upload PDF/PNG/JPG with OCR parsing", icon: "⬆️" },
                  { key: "manual", title: "Add Manually", desc: "Fill in the details using a form", icon: "📝" },
                ].map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setAddMethod(m.key as any)}
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
                  
                  return false;
                }}
                maxCount={1}
                accept="image/*,application/pdf"
              >
                <Button variant="outline" className="bg-transparent">Upload File</Button>
              </Upload>
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
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                      }
                      options={skillsData.allSkills.map(skill => ({
                        value: skill,
                        label: skill
                      }))}
                      loading={loadingSkills}
                      disabled={loadingSkills}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="credentialUrl" label="Verification URL">
                    <Input placeholder="https://..." />
                  </Form.Item>
                </Col>
              </Row>
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
              {addMethod === "upload" && (
                <Form.Item label="Certificate File">
                  <Upload
                    beforeUpload={async (f) => {
                      setFile(f);
                      
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
                      
                      return false;
                    }}
                    maxCount={1}
                    accept="image/*,application/pdf"
                  >
                    <Button variant="outline" className="bg-transparent">Upload</Button>
                  </Upload>
                </Form.Item>
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
                <Button variant="outline" className="bg-transparent" onClick={() => setCurrentStep(1)}>Back</Button>
                <Space>
                  <Button variant="outline" className="bg-transparent" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                  <Button variant="outline" className="bg-transparent" onClick={handleAnchor}>Anchor</Button>
                  <Button onClick={submitForm}>{editing ? "Update" : "Create"}</Button>
                </Space>
              </div>
            </div>
          )}
        </Modal>

        {/* Certificate Image Viewer Modal */}
        <Modal
          open={!!viewingImage}
          onCancel={() => setViewingImage(null)}
          footer={null}
          width="90vw"
          centered
          styles={{
            body: { padding: 0 },
            content: { padding: 0 }
          }}
        >
          {viewingImage && (
            <div className="relative">
              <img 
                src={viewingImage} 
                alt="Certificate"
                className="w-full h-auto max-h-[80vh] object-contain"
              />
              <AntButton
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white border-none"
                onClick={() => setViewingImage(null)}
                shape="circle"
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                }
              />
            </div>
          )}
        </Modal>

      </main>
      </div>
    </ConfigProvider>
  );
}

export default function CredentialsPage() {
  return (
    <App>
      <CredentialsPageContent />
    </App>
  );
}
