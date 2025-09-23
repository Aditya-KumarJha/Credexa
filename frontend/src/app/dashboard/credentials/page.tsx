"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
const Sidebar = dynamic(() => import("@/components/dashboard/Sidebar"), { ssr: false });
import api from "@/utils/axios";
import { Button } from "@/components/ui/button";
import { Card as AntCard, Form, Row, Col, Space, Empty, Skeleton, ConfigProvider, theme as antdTheme, App } from "antd";
import { Plus, Share2 } from "lucide-react";
import { useTheme } from "next-themes";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";

import { useCredentials } from "@/hooks/useCredentials";
import { useSkills } from "@/hooks/useSkills";
import { useCredentialActions } from "@/hooks/useCredentialActions";
import { useCredentialModal, useImageModal, useDetailsModal, useOnChainModal } from "@/hooks/useModals";
import { CredentialCard } from "@/components/dashboard/credentials/CredentialCard";
import { CredentialStats } from "@/components/dashboard/credentials/CredentialStats";
import { CredentialFiltersComponent } from "@/components/dashboard/credentials/CredentialFilters";
import { CredentialModal } from "@/components/dashboard/credentials/CredentialModal";
import { ImageViewerModal } from "@/components/dashboard/credentials/ImageViewerModal";
import { CredentialDetailsModal } from "@/components/dashboard/credentials/CredentialDetailsModal";
import { OnChainDetailsModal } from "@/components/dashboard/credentials/OnChainDetailsModal";
import { filterCredentials, sortCredentials, getUniqueIssuers } from "@/utils/credentialUtils";
import { Credential, CredentialFilters } from "@/types/credentials";

function CredentialsPageContent() {
  const { message } = App.useApp();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { theme: mode } = useTheme();
  const isDark = (mode ?? "light") === "dark";

  // Use our custom hooks
  const { items, loading, handleDelete, addCredential, updateCredential, fetchItems } = useCredentials();
  const { skillsData, loadingSkills } = useSkills();
  const { anchoringId, loadingDetails, handleAnchorCredential, handleViewDetails, fetchOnChainDetails } = useCredentialActions();
  
  // Modal hooks
  const modalHook = useCredentialModal();
  const imageModal = useImageModal();
  const detailsModal = useDetailsModal();
  const onChainModal = useOnChainModal();

  // Local state for filters
  const [filters, setFilters] = useState<CredentialFilters>({
    search: "",
    typeFilter: "all",
    statusFilter: "all",
    issuerFilter: "all",
    sortKey: "newest",
  });

  const [form] = Form.useForm();

  // Computed values
  const filteredItems = useMemo(() => {
    const filtered = filterCredentials(items, filters);
    return sortCredentials(filtered, filters.sortKey);
  }, [items, filters]);

  const uniqueIssuers = useMemo(() => getUniqueIssuers(items), [items]);

  // Handlers
  const handleFiltersChange = (newFilters: Partial<CredentialFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleViewDetailsClick = async (credentialId?: string) => {
    const details = await handleViewDetails(credentialId);
    if (details) {
      detailsModal.openDetailsModal(details);
    }
  };

  const handleShowOnChainDetails = async (credential: Credential) => {
    console.log('🚀 handleShowOnChainDetails called');
    console.log('📦 Received credential:', credential);
    
    if (!credential.credentialHash) {
      console.error('❌ Credential hash is missing!');
      console.log('📋 Full credential object:', credential);
      message.error("Credential hash is missing. Cannot fetch details.");
      return;
    }
    
    console.log('✅ Credential hash found:', credential.credentialHash);
    console.log('🔄 Setting modal loading to true');
    onChainModal.setIsModalLoading(true);
    onChainModal.openOnChainModal(null);
    
    console.log('📡 Calling fetchOnChainDetails with hash:', credential.credentialHash);
    const data = await fetchOnChainDetails(credential.credentialHash);
    
    console.log('📥 Response from fetchOnChainDetails:', data);
    if (data) {
      console.log('✅ Opening modal with data:', data);
      onChainModal.openOnChainModal(data);
    } else {
      console.log('❌ No data received, closing modal');
      onChainModal.closeOnChainModal();
    }
    console.log('🔄 Setting modal loading to false');
    onChainModal.setIsModalLoading(false);
  };

  const handleAnchorCredentialClick = async (credentialId?: string) => {
    console.log('⚓ handleAnchorCredentialClick called with ID:', credentialId);
    
    const transactionHash = await handleAnchorCredential(credentialId);
    console.log('📄 Anchoring result - Transaction hash:', transactionHash);
    
    if (transactionHash && credentialId) {
      console.log('✅ Anchoring successful, refreshing credentials list...');
      // Refresh the credentials list to get the updated credentialHash
      await fetchItems();
      console.log('🔄 Credentials list refreshed');
    } else {
      console.log('❌ Anchoring failed or missing data');
    }
  };

  const submitForm = async () => {
    const token = localStorage.getItem("authToken");
    const fd = new FormData();
    let payload: Record<string, any> = {};

    try {
      if (modalHook.addMethod === "sync") {
        if (!modalHook.file) {
          message.error("Please upload a certificate file to continue.");
          return;
        }
        const inferredTitle = modalHook.file.name?.replace(/\.[^/.]+$/, "") || "Synced Credential";
        payload = {
          title: inferredTitle,
          issuer: modalHook.selectedPlatform || "Unknown",
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
        const values = modalHook.formValues;
        if (!values || !values.title) {
          message.error("Please go back and fill in the title field");
          return;
        }

        const skillArray = Array.isArray(values.skills) 
          ? values.skills 
          : String(values.skills || "")
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
      }

      Object.entries(payload).forEach(([k, v]) => {
        if (v !== undefined && v !== null) fd.append(k, String(v));
      });
      if (modalHook.file) fd.append("certificateFile", modalHook.file);
      if (!modalHook.file && modalHook.editing?.imageUrl) fd.append("imageUrl", modalHook.editing.imageUrl);

      if (modalHook.editing?._id) {
        const res = await api.put(`/api/credentials/${modalHook.editing._id}`, fd, {
          headers: { Authorization: `Bearer ${token}` },
        });
        updateCredential(res.data);
        message.success("Credential updated successfully!");
      } else {
        const res = await api.post(`/api/credentials`, fd, {
          headers: { Authorization: `Bearer ${token}` },
        });
        addCredential(res.data);
        message.success("Credential created successfully!");
      }

      form.resetFields();
      modalHook.resetModal();
    } catch (e: any) {
      console.error('Save failed:', e);
      message.error(e.response?.data?.message || "Failed to save credential");
    }
  };

  const handleAnchor = async () => {
    if (!modalHook.editing?._id) {
      message.error("Please save the credential first");
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) return;

    try {
      const hashRes = await api.post(`/api/credentials/${modalHook.editing._id}/generate-hash`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { hash } = hashRes.data;

      const anchorRes = await api.post(`/api/credentials/${modalHook.editing._id}/anchor`, { hash }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (anchorRes.data.transactionHash) {
        const credRes = await api.put(`/api/credentials/${modalHook.editing._id}`, {
          transactionHash: anchorRes.data.transactionHash,
          status: 'verified'
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        updateCredential(credRes.data);
        message.success("Credential anchored successfully!");
        modalHook.setIsModalOpen(false);
      }
    } catch (err) {
      console.error('Anchor Error:', err);
      message.error("Failed to anchor credential");
    }
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
              <Button onClick={modalHook.openCreate} className="shadow">
                <Plus className="w-4 h-4 mr-2" /> Add Credential
              </Button>
            </Space>
          </div>

          {/* Stats summary */}
          <CredentialStats items={items} />

          {/* Filters */}
          <CredentialFiltersComponent
            filters={filters}
            onFiltersChange={handleFiltersChange}
            uniqueIssuers={uniqueIssuers}
          />

          {/* Credentials Grid */}
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
          ) : filteredItems.length === 0 ? (
            <AntCard
              className="py-12 mt-6 border-0 shadow-lg bg-card/80"
              styles={{ body: { background: "transparent", padding: "48px 24px" } }}
            >
              <Empty description="No credentials found" />
            </AntCard>
          ) : (
            <Row gutter={[20, 20]} className="mt-6">
              {filteredItems.map((credential) => (
                <Col xs={24} sm={12} lg={8} key={credential._id || credential.title}>
                  <CredentialCard
                    credential={credential}
                    onEdit={modalHook.openEdit}
                    onDelete={handleDelete}
                    onViewImage={imageModal.setViewingImage}
                    onViewDetails={handleViewDetailsClick}
                    onAnchor={handleAnchorCredentialClick}
                    onShowOnChainDetails={handleShowOnChainDetails}
                    anchoringId={anchoringId}
                    loadingDetails={loadingDetails}
                  />
                </Col>
              ))}
            </Row>
          )}

          {/* Modals */}
          <CredentialModal
            isOpen={modalHook.isModalOpen}
            onClose={() => modalHook.setIsModalOpen(false)}
            editing={modalHook.editing}
            currentStep={modalHook.currentStep}
            setCurrentStep={modalHook.setCurrentStep}
            addMethod={modalHook.addMethod}
            setAddMethod={modalHook.setAddMethod}
            selectedPlatform={modalHook.selectedPlatform}
            setSelectedPlatform={modalHook.setSelectedPlatform}
            file={modalHook.file}
            setFile={modalHook.setFile}
            formValues={modalHook.formValues}
            setFormValues={modalHook.setFormValues}
            skillsData={skillsData}
            loadingSkills={loadingSkills}
            onSubmit={submitForm}
            onAnchor={handleAnchor}
            form={form}
          />

          <ImageViewerModal
            imageUrl={imageModal.viewingImage}
            onClose={() => imageModal.setViewingImage(null)}
          />

          <CredentialDetailsModal
            isOpen={detailsModal.detailsModalOpen}
            onClose={detailsModal.closeDetailsModal}
            details={detailsModal.viewingDetails}
            onViewImage={imageModal.setViewingImage}
          />

          <OnChainDetailsModal
            isOpen={onChainModal.isDetailsModalOpen}
            onClose={onChainModal.closeOnChainModal}
            data={onChainModal.modalData}
            isLoading={onChainModal.isModalLoading}
          />
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
