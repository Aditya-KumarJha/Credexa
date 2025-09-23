import { Credential, CredentialFilters, SortKey, Platform } from "@/types/credentials";
import { App } from "antd";
import api from "@/utils/axios";

export const filterCredentials = (items: Credential[], filters: CredentialFilters): Credential[] => {
  const { search, typeFilter, statusFilter, issuerFilter } = filters;
  
  return items.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.issuer.toLowerCase().includes(search.toLowerCase()) ||
      (c.skills || []).some((s) => s.toLowerCase().includes(search.toLowerCase()));
    const matchesType = typeFilter === "all" || c.type === typeFilter;
    
    // Updated blockchain-based status filtering
    let matchesStatus = true;
    if (statusFilter === "anchored") {
      matchesStatus = !!c.transactionHash;
    } else if (statusFilter === "not-anchored") {
      matchesStatus = !c.transactionHash;
    }
    // "all" case: matchesStatus remains true
    
    const matchesIssuer = issuerFilter === "all" || c.issuer === issuerFilter;
    return matchesSearch && matchesType && matchesStatus && matchesIssuer;
  });
};

export const sortCredentials = (items: Credential[], sortKey: SortKey): Credential[] => {
  return [...items].sort((a, b) => {
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
};

export const getUniqueIssuers = (items: Credential[]): string[] => {
  const set = new Set(items.map((it) => it.issuer).filter(Boolean));
  return ["all", ...Array.from(set)] as string[];
};

export const extractCertificateInfo = async (file: File) => {
  const token = localStorage.getItem("authToken");
  if (!token) {
    console.error("Please login first");
    return null;
  }

  try {
    const formData = new FormData();
    formData.append('certificateFile', file);

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

export const platforms: Platform[] = [
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
