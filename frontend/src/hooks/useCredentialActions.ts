import { useState } from "react";
import { App } from "antd";
import api from "@/utils/axios";
import { Credential, CredentialDetails, OnChainDetails } from "@/types/credentials";

export const useCredentialActions = () => {
  const { message } = App.useApp();
  const [anchoringId, setAnchoringId] = useState<string | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Handler to anchor a credential on the blockchain
  const handleAnchorCredential = async (credentialId?: string) => {
    if (!credentialId) return;
    setAnchoringId(credentialId);
    const token = localStorage.getItem("authToken");
    
    try {
      message.loading({ content: 'Anchoring on the blockchain...', key: 'anchor' });
      const anchorRes = await api.post(`/api/credentials/${credentialId}/anchor`, {}, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      const { transactionHash } = anchorRes.data;

      message.success({ content: 'Credential anchored successfully!', key: 'anchor' });
      return transactionHash;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || "Anchoring failed.";
      message.error({ content: errorMessage, key: 'anchor' });
      return null;
    } finally {
      setAnchoringId(null);
    }
  };

  // Handler to view credential details
  const handleViewDetails = async (credentialId?: string): Promise<CredentialDetails | null> => {
    if (!credentialId) return null;
    setLoadingDetails(true);
    const token = localStorage.getItem("authToken");

    try {
      const response = await api.get(`/api/credentials/${credentialId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to load credential details.";
      message.error(errorMessage);
      return null;
    } finally {
      setLoadingDetails(false);
    }
  };

  // Handler to fetch on-chain details
  const fetchOnChainDetails = async (credentialHash: string): Promise<OnChainDetails | null> => {
    console.log('🔍 fetchOnChainDetails called with hash:', credentialHash);
    
    if (!credentialHash) {
      console.error('❌ Credential hash is empty or undefined');
      message.error("Credential hash is missing. Cannot fetch details.");
      return null;
    }

    try {
      console.log('📡 Making API request to:', `/api/credentials/verify/${credentialHash}`);
      const response = await api.get(`/api/credentials/verify/${credentialHash}`);
      console.log('✅ API response received:', response);
      console.log('📊 Response data:', response.data);
      console.log('📈 Response status:', response.status);
      return response.data;
    } catch (error: any) {
      console.error('❌ API request failed:', error);
      console.error('📋 Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      });
      message.error("Failed to fetch on-chain details.");
      return null;
    }
  };

  return {
    anchoringId,
    loadingDetails,
    handleAnchorCredential,
    handleViewDetails,
    fetchOnChainDetails,
  };
};
