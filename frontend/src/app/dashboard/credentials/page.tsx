"use client";

import { useEffect, useMemo, useState } from "react";
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
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();
  const [items, setItems] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Credential | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [addMethod, setAddMethod] = useState<"sync" | "upload" | "manual" | null>(null);

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
  messageApi.error("Failed to load credentials");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    return items.filter((c) => {
      const matchesSearch =
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.issuer.toLowerCase().includes(search.toLowerCase()) ||
        (c.skills || []).some((s) => s.toLowerCase().includes(search.toLowerCase()));
      const matchesType = typeFilter === "all" || c.type === typeFilter;
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [items, search, typeFilter, statusFilter]);

  const handleDelete = async (id?: string) => {
    if (!id) return;
    const token = localStorage.getItem("authToken");
    try {
      await api.delete(`/api/credentials/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setItems((prev) => prev.filter((x) => x._id !== id));
      messageApi.success("Deleted");
    } catch {
      messageApi.error("Delete failed");
    }
  };

  const openCreate = () => {
    setEditing(null);
    setFile(null);
    setAddMethod(null);
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
    const values = await form.validateFields();
    const fd = new FormData();
    const skillArray = String(values.skills || "")
      .split(",")
      .map((s: string) => s.trim())
      .filter(Boolean);

    const payload: Record<string, any> = {
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
      // Send skills as comma-separated string (backend splits on commas)
      skills: skillArray.join(", "),
    };

    Object.entries(payload).forEach(([k, v]) => {
      if (v !== undefined && v !== null) fd.append(k, String(v));
    });
    // The backend expects either certificateFile (buffer) or imageUrl
    if (file) fd.append("certificateFile", file);
    if (!file && editing?.imageUrl) fd.append("imageUrl", editing.imageUrl);

    try {
      if (editing?._id) {
        const res = await api.put(`/api/credentials/${editing._id}`, fd, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setItems((prev) => prev.map((x) => (x._id === res.data._id ? res.data : x)));
        messageApi.success("Updated");
      } else {
        const res = await api.post(`/api/credentials`, fd, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setItems((prev) => [res.data, ...prev]);
        messageApi.success("Created");
      }
      setIsModalOpen(false);
    } catch (e) {
      messageApi.error("Save failed");
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
          colorText: "var(--color-foreground)",
          colorTextSecondary: "var(--color-muted-foreground)",
          colorBorder: "var(--color-border)",
          colorPrimary: "var(--color-primary)",
          colorBgContainer: "var(--color-card)",
          colorBgElevated: "var(--color-card)",
          zIndexPopupBase: 2000,
          borderRadius: 12,
        },
      }}
      getPopupContainer={() => document.body}
    >
      {contextHolder}
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
            <Button variant="outline" className="bg-transparent" onClick={() => messageApi.info("Share coming soon")}> 
              <Share2 className="w-4 h-4 mr-2" /> Share Profile
            </Button>
            <Button onClick={openCreate} className="shadow"> 
              <Plus className="w-4 h-4 mr-2" /> Add Credential
            </Button>
          </Space>
        </div>

        <AntCard
          className="mb-6 border-0 shadow-lg bg-card/80 backdrop-blur supports-[backdrop-filter]:backdrop-blur"
          styles={{ body: { background: "transparent" } }}
        >
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} md={10}>
              <Input placeholder="Search by title, issuer, or skill" value={search} onChange={(e) => setSearch(e.target.value)} allowClear />
            </Col>
            <Col xs={12} md={7}>
              <Select
                value={typeFilter}
                onChange={setTypeFilter}
                className="w-full"
                styles={{ popup: { root: { background: "var(--color-card)", color: "var(--color-foreground)" } } }}
                options={[
                { value: "all", label: "All Types" },
                { value: "certificate", label: "Certificate" },
                { value: "course", label: "Course" },
                { value: "degree", label: "Degree" },
                { value: "license", label: "License" },
                { value: "badge", label: "Badge" },
              ]}
              />
            </Col>
            <Col xs={12} md={7}>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                className="w-full"
                styles={{ popup: { root: { background: "var(--color-card)", color: "var(--color-foreground)" } } }}
                options={[
                { value: "all", label: "All Status" },
                { value: "verified", label: "Verified" },
                { value: "pending", label: "Pending" },
                { value: "expired", label: "Expired" },
              ]}
              />
            </Col>
          </Row>
        </AntCard>

        {loading ? (
          <div className="py-20 text-center">Loading...</div>
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
                  title={
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      <span>{c.title}</span>
                    </div>
                  }
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
                    <div className="text-sm text-muted-foreground">Issuer: <span className="text-foreground">{c.issuer}</span></div>
                    <div className="text-sm text-muted-foreground">Type: {c.type}</div>
                    <div className="text-sm text-muted-foreground">Issued: {c.issueDate ? dayjs(c.issueDate).format("MMM D, YYYY") : "-"}</div>
                    {c.skills?.length ? (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {c.skills.slice(0, 6).map((s) => (
                          <span key={s} className="px-2 py-0.5 text-xs rounded-md bg-muted text-foreground/80 border border-border">{s}</span>
                        ))}
                        {c.skills.length > 6 && <span className="px-2 py-0.5 text-xs rounded-md bg-muted text-foreground/80 border border-border">+{c.skills.length - 6}</span>}
                      </div>
                    ) : null}
                    <div className="flex gap-2 pt-2">
                      {c.credentialUrl && (
                        <a target="_blank" rel="noreferrer" href={c.credentialUrl} className="text-primary hover:underline flex items-center gap-1">
                          <Download className="w-4 h-4" /> View
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
            <div className="space-y-4">
              <p className="text-sm text-gray-500">How do you want to add your credential?</p>
              <Radio.Group value={addMethod} onChange={(e) => setAddMethod(e.target.value)}>
                <Space direction="vertical">
                  <Radio value="sync">Sync from platform (coming soon)</Radio>
                  <Radio value="upload">Upload certificate image/PDF</Radio>
                  <Radio value="manual">Enter details manually</Radio>
                </Space>
              </Radio.Group>
              <div className="flex justify-end">
                <Button onClick={() => setCurrentStep(1)} disabled={!addMethod}>Continue</Button>
              </div>
            </div>
          )}

          {currentStep === 1 && (
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
                    beforeUpload={(f) => {
                      setFile(f);
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
              <p className="text-sm text-gray-500">Optional: Add blockchain details to aid verification.</p>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="blockchainAddress" label="Blockchain Address">
                    <Input placeholder="0x..." />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="transactionHash" label="Transaction Hash">
                    <Input placeholder="0x..." />
                  </Form.Item>
                </Col>
              </Row>
              <div className="flex justify-between">
                <Button variant="outline" className="bg-transparent" onClick={() => setCurrentStep(1)}>Back</Button>
                <Space>
                  <Button variant="outline" className="bg-transparent" onClick={() => setIsModalOpen(false)}>Cancel</Button>
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
