"use client";

import type { ConfirmationType } from "@/utilities/types";

type Props = {
  confirmationType: ConfirmationType;
  handleDelete: () => void;
  handleSave: () => void;
  onClose: () => void;
};

export default function ConfirmationModal({
  onClose,
  confirmationType,
  handleDelete,
  handleSave,
}: Props) {
  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div
        className="absolute z-50 h-screen w-screen bg-[rgba(14,20,36,0.6)] backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <div className="relative z-50 max-h-[80vh] w-full max-w-md overflow-y-auto rounded-md bg-secondary p-4 shadow-xl">
        <div onClick={(e) => e.stopPropagation()}>
          {confirmationType === "delete" ? (
            <div className="flex flex-col items-center justify-center gap-10">
              <p className="text-center">
                Are you sure you want to delete this file?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    onClose();
                    handleDelete();
                  }}
                  className="rounded-full bg-red-600 px-4 py-1 text-secondary hover:bg-red-500"
                >
                  Delete
                </button>
                <button
                  onClick={onClose}
                  className="rounded-full bg-primary px-4 py-1 text-secondary hover:bg-primary"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-10">
              <p className="text-center">
                Are you sure you want to save this file?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    handleSave();
                    onClose();
                  }}
                  className="rounded-full bg-primary px-4 py-1 text-secondary hover:bg-primary"
                >
                  Save
                </button>
                <button
                  onClick={onClose}
                  className="rounded-full bg-primary px-4 py-1 text-secondary hover:bg-primary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
