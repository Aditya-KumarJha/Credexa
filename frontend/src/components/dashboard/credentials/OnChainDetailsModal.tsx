import React from "react";
import { Modal, Spin } from "antd";
import dayjs from "dayjs";
import { OnChainDetails } from "@/types/credentials";

interface OnChainDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: OnChainDetails | null;
  isLoading: boolean;
}

export const OnChainDetailsModal: React.FC<OnChainDetailsModalProps> = ({
  isOpen,
  onClose,
  data,
  isLoading,
}) => {
  return (
    <Modal
      title="On-Chain Credential Details"
      open={isOpen}
      onCancel={onClose}
      footer={null}
    >
      {isLoading ? (
        <div className="text-center py-8">
          <Spin size="large" />
          <p className="mt-4">Fetching data from the blockchain...</p>
        </div>
      ) : data ? (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-500">ISSUER ADDRESS</p>
            <p className="font-mono bg-gray-100 p-2 rounded text-sm break-all">{data.issuer}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">ANCHORED ON (TIMESTAMP)</p>
            <p className="font-mono bg-gray-100 p-2 rounded text-sm">
              {dayjs.unix(data.timestamp).format("MMMM D, YYYY h:mm:ss A")}
            </p>
          </div>
        </div>
      ) : (
        <p>No data available.</p>
      )}
    </Modal>
  );
};
