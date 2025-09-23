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

type CredentialType = "certificate" | "course" | "degree" | "license" | "badge";
type CredentialStatus = "verified" | "pending" | "expired";

interface Credential {
  _id?: string;
  title: string;
  issuer: string;
  type: CredentialType;
  status: CredentialStatus;
  issueDate: string; // ISO
  expiryDate?: string;
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

export default function CredentialsPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { theme: mode } = useTheme();
  const isDark = (mode ?? "light") === "dark";
  const router = useRouter();
  const [items, setItems] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
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
      console.error('Extraction error:', error);
      console.error('Failed to extract certificate information:', error.response?.data?.message || error.message);
      return null;
    }
  };

  useEffect(() => {
    fetchItems();
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

  const openCreate = () => {
    setEditing(null);
    setFile(null);
    setAddMethod(null);
    setSelectedPlatform(null);
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
        status: editing.status,
        issueDate: editing.issueDate ? dayjs(editing.issueDate) : undefined,
        expiryDate: editing.expiryDate ? dayjs(editing.expiryDate) : undefined,
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
        expiryDate: "",
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
      const values = await form.validateFields();
      const skillArray = String(values.skills || "")
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);
      payload = {
        title: values.title,
        issuer: values.issuer,
        type: values.type,
        status: values.status || "pending",
        issueDate: values.issueDate?.toISOString(),
        expiryDate: values.expiryDate ? values.expiryDate.toISOString() : "",
        description: values.description || "",
        credentialUrl: values.credentialUrl || "",
        nsqfLevel: values.nsqfLevel || "",
        blockchainAddress: values.blockchainAddress || "",
        transactionHash: values.transactionHash || "",
        credentialId: values.credentialId || "",
        creditPoints: values.creditPoints || "",
        skills: skillArray.join(", "),
      };
    }

    Object.entries(payload).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.append(k, String(v));
    });
    if (file) fd.append("certificateFile", file);
    if (!file && editing?.imageUrl) fd.append("imageUrl", editing.imageUrl);

    try {
      if (editing?._id) {
        const res = await api.put(`/api/credentials/${editing._id}`, fd, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setItems((prev) => prev.map((x) => (x._id === res.data._id ? res.data : x)));
        message.success("Updated");
      } else {
        const res = await api.post(`/api/credentials`, fd, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setItems((prev) => [res.data, ...prev]);
        message.success("Created");
      }
      setIsModalOpen(false);
    } catch (e) {
      message.error("Save failed");
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
    if (status === "pending") return (
      <span className={`${base} bg-yellow-500/10 text-yellow-500 border-yellow-500/20`}>
        <Clock className="w-3.5 h-3.5" /> Pending
      </span>
    );
    return (
      <span className={`${base} bg-[color:var(--destructive)]/10 text-[color:var(--destructive)] border-[color:var(--destructive)]/20`}>
        <AlertCircle className="w-3.5 h-3.5" /> Expired
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
        },
      }}
    >
      <div className="min-h-screen bg-background text-foreground flex">
        <Sidebar />
        <main className="flex-1 p-6 md:p-10">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
          <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                My Credentials
              </h1>
              <p className="text-sm text-muted-foreground">Manage and showcase your verified achievements</p>
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
        <AntCard
          className="mb-6 border-0 shadow bg-card/80"
          styles={{ body: { background: "transparent", paddingBottom: 8 } }}
        >
          <Row gutter={[12, 12]}>
            <Col xs={12} md={6}>
              <div className="px-3 py-2 rounded-lg border bg-background">
                <div className="text-xs text-muted-foreground">Total</div>
                <div className="text-xl font-semibold">{items.length}</div>
              </div>
            </Col>
            <Col xs={12} md={6}>
              <div className="px-3 py-2 rounded-lg border bg-background">
                <div className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Verified</div>
                <div className="text-xl font-semibold">{items.filter((i) => i.status === "verified").length}</div>
              </div>
            </Col>
            <Col xs={12} md={6}>
              <div className="px-3 py-2 rounded-lg border bg-background">
                <div className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-yellow-500" /> Pending</div>
                <div className="text-xl font-semibold">{items.filter((i) => i.status === "pending").length}</div>
              </div>
            </Col>
            <Col xs={12} md={6}>
              <div className="px-3 py-2 rounded-lg border bg-background">
                <div className="text-xs text-muted-foreground flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 text-red-500" /> Expired</div>
                <div className="text-xl font-semibold">{items.filter((i) => i.status === "expired").length}</div>
              </div>
            </Col>
          </Row>
        </AntCard>

        <AntCard
          className="mb-6 border-0 shadow-lg bg-card/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur"
          styles={{ body: { background: "transparent" } }}
        >
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} md={8}>
              <Input placeholder="Search by title, issuer, or skill" value={search} onChange={(e) => setSearch(e.target.value)} allowClear />
            </Col>
            <Col xs={12} md={6}>
              <Select value={typeFilter} onChange={setTypeFilter} className="w-full" options={[
                { value: "all", label: "All Types" },
                { value: "certificate", label: "Certificate" },
                { value: "course", label: "Course" },
                { value: "degree", label: "Degree" },
                { value: "license", label: "License" },
                { value: "badge", label: "Badge" },
              ]} />
            </Col>
            <Col xs={12} md={5}>
              <Select value={statusFilter} onChange={setStatusFilter} className="w-full" options={[
                { value: "all", label: "All Status" },
                { value: "verified", label: "Verified" },
                { value: "pending", label: "Pending" },
                { value: "expired", label: "Expired" },
              ]} />
            </Col>
            <Col xs={12} md={5}>
              <Select
                value={issuerFilter}
                onChange={setIssuerFilter}
                className="w-full"
                options={uniqueIssuers.map((u) => ({ value: u, label: u === "all" ? "All Issuers" : u }))}
              />
            </Col>
            <Col xs={12} md={6}>
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
            </Col>
          </Row>
        </AntCard>

        {loading ? (
          <Row gutter={[16, 16]}> 
            {Array.from({ length: 6 }).map((_, i) => (
              <Col xs={24} sm={12} lg={8} key={i}>
                <AntCard className="border-0 shadow-lg bg-card/80">
                  <Skeleton active avatar paragraph={{ rows: 3 }} />
                </AntCard>
              </Col>
            ))}
          </Row>
        ) : filtered.length === 0 ? (
          <AntCard className="py-12 border-0 shadow-lg bg-card/80" styles={{ body: { background: "transparent" } }}>
            <Empty description="No credentials found" />
          </AntCard>
        ) : (
          <Row gutter={[16, 16]}> 
            {filtered.map((c) => (
              <Col xs={24} sm={12} lg={8} key={c._id || c.title}>
                <AntCard
                  className="border-0 shadow-lg hover:shadow-xl transition bg-card/80"
                  styles={{ body: { background: "transparent" } }}
                  title={<div className="flex items-center gap-2"><Award className="w-4 h-4" /><span>{c.title}</span></div>}
                  extra={
                    <Space>
                      {statusTag(c.status)}
                      <Button variant="outline" className="bg-transparent" onClick={() => openEdit(c)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Popconfirm title="Delete this credential?" onConfirm={() => handleDelete(c._id)}>
                         <Button variant="outline" className="bg-transparent text-red-600 hover:text-red-700">
                           <Trash2 className="w-4 h-4" />
                         </Button>
                      </Popconfirm>
                    </Space>
                  }
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600" />
                      <div>
                        <div className="text-sm text-muted-foreground">Issuer</div>
                        <div className="text-foreground font-medium -mt-0.5">{c.issuer}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm pt-2">
                      <div className="text-muted-foreground">Type: <span className="text-foreground">{c.type}</span></div>
                      <div className="text-muted-foreground">Issued: <span className="text-foreground">{c.issueDate ? dayjs(c.issueDate).format("MMM D, YYYY") : "-"}</span></div>
                      {typeof c.nsqfLevel !== "undefined" && (
                        <div className="text-muted-foreground">NSQF: <span className="text-foreground">{c.nsqfLevel}</span></div>
                      )}
                      {typeof c.creditPoints !== "undefined" && (
                        <div className="text-muted-foreground">Points: <span className="text-foreground">{c.creditPoints}</span></div>
                      )}
                    </div>
                    {c.skills?.length ? (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {c.skills.slice(0, 5).map((s) => (
                          <span key={s} className="px-2 py-0.5 text-xs rounded-md bg-muted text-foreground/80 border border-border">{s}</span>
                        ))}
                        {c.skills.length > 5 && <span className="px-2 py-0.5 text-xs rounded-md bg-muted text-foreground/80 border border-border">+{c.skills.length - 5}</span>}
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
                </AntCard>
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
            <Form form={form} layout="vertical" initialValues={{ status: "pending", type: "certificate" }}>
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
                <Col span={8}>
                  <Form.Item name="type" label="Type" rules={[{ required: true }]}> 
                    <Select
                      options={[
                        { value: "certificate", label: "Certificate" },
                        { value: "course", label: "Course" },
                        { value: "degree", label: "Degree" },
                        { value: "license", label: "License" },
                        { value: "badge", label: "Badge" },
                      ]}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="status" label="Status" rules={[{ required: true }]}> 
                    <Select
                      options={[
                        { value: "verified", label: "Verified" },
                        { value: "pending", label: "Pending" },
                        { value: "expired", label: "Expired" },
                      ]}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="nsqfLevel" label="NSQF Level">
                    <Input type="number" min={1} />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="issueDate" label="Issue Date" rules={[{ required: true }]}>
                    <DatePicker className="w-full" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="expiryDate" label="Expiry Date">
                    <DatePicker className="w-full" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="description" label="Description">
                <Input.TextArea rows={3} placeholder="What did you learn or achieve?" />
              </Form.Item>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="skills" label="Skills (comma separated)">
                    <Input placeholder="e.g., React, Node.js, MongoDB" />
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
                <Button onClick={() => setCurrentStep(2)}>Continue</Button>
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
      </main>
      </div>
    </ConfigProvider>
  );
}
