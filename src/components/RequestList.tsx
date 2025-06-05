"use client";
import type { ParsedModelProps, RequestType } from "@/utilities/types";
import { fetchZip, formatTimestamp, unzipFiles } from "@/utilities/utils";
import { useEffect, useMemo, useState } from "react";
import PreviewModel from "./PreviewModel";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera } from "@react-three/drei";
import { toast } from "./toaster/use-toast";
import { useTRPC } from "@/utilities/trpc";
import { useMutation } from "@tanstack/react-query";

type RequestItem = {
  id: string;
  userId: string | null;
  username: string | null;
  objectId: string | null;
  objectName: string | null;
  status: RequestType;
  createdAt: number;
};

type RequestTypeProps = {
  data: RequestItem[];
  refetch: () => void;
};

export default function RequestList({ data, refetch }: RequestTypeProps) {
  const trpc = useTRPC();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [isSelected, setIsSelected] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [zip, setZip] = useState<Blob | null>(null);
  const [parsedObject, setParsedObject] = useState<ParsedModelProps | null>(
    null,
  );
  const itemsPerPage = 5;

  const paginated = data.slice(page * itemsPerPage, (page + 1) * itemsPerPage);
  const totalPages = Math.ceil(data.length / itemsPerPage);

  const mutationOptions = {
    onError(error: { message: string }) {
      toast({
        variant: "destructive",
        title: "Server error",
        description: error.message,
      });
    },
    async onSuccess() {
      clear();
      refetch();
    },
  };

  const setStatusMutation = useMutation(
    trpc.requests.setStatus.mutationOptions(mutationOptions),
  );

  useEffect(() => {
    if (!isSelected) return;
    const newZip = async () => {
      const newZip = await fetchZip(isSelected);
      if (!newZip) return;
      setZip(newZip);
    };
    newZip().catch(console.error);
  }, [isSelected]);

  useEffect(() => {
    if (!zip) return;
    async function parseModel() {
      if (!zip) return;
      const unzipped = await unzipFiles(zip);
      if (!unzipped) return;
      setParsedObject(unzipped);
    }
    parseModel().catch(console.error);
  }, [zip]);

  const handleTextures = (textures: Map<string, Blob>) => {
    const result = new Map<string, string>();
    for (const [key, blob] of textures) {
      const newKey = key.split("/").pop()!;
      result.set(newKey, URL.createObjectURL(blob));
    }
    return result;
  };

  const MemoizedModel = useMemo(() => {
    if (!parsedObject) return null;

    return (
      <PreviewModel
        fileType={parsedObject.fileType}
        fileUrl={URL.createObjectURL(parsedObject.fileBlob)}
        fileBinary={URL.createObjectURL(
          parsedObject.kind === "gltf" ? parsedObject.fileBinary : new Blob([]),
        )}
        fileTextures={handleTextures(parsedObject.fileTextures)}
      />
    );
  }, [parsedObject]);

  const clear = () => {
    setExpandedIndex(null);
    setPage(0);
    setIsSelected(null);
    setSelectedRequest(null);
    setZip(null);
    setParsedObject(null);
  };

  const handleRequest = async (reqStatus: RequestType) => {
    if (!selectedRequest || !isSelected) return;
    const status = await setStatusMutation.mutateAsync({
      id: selectedRequest,
      status: reqStatus,
      objectId: isSelected,
    });
    if (!status)
      return toast({
        variant: "destructive",
        title: "Server error",
        description: "Something went wrong",
      });
    if (status)
      return toast({
        variant: "default",
        title: "Success",
        description: "Status updated successfully",
      });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-text">
      {data.length === 0 ? (
        <div className="flex h-64 w-full max-w-2xl items-center justify-center rounded-xl border border-dashed p-6 text-center text-gray-500 shadow-inner">
          No requests found.
        </div>
      ) : (
        <div className="w-full max-w-2xl space-y-4">
          {paginated.map((item, index) => (
            <div key={item.id} className="rounded-xl border p-4 shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">ID: {item.id}</p>
                  <p>Status: {item.status}</p>
                </div>
                <button
                  className="text-2xl font-bold"
                  onClick={() => {
                    setExpandedIndex(expandedIndex === index ? null : index);
                    setIsSelected(item.objectId);
                    setSelectedRequest(item.id);
                  }}
                >
                  {expandedIndex === index ? "-" : "+"}
                </button>
              </div>
              {expandedIndex === index && parsedObject && (
                <div className="mt-4 text-sm text-text">
                  <div className="flex flex-row gap-6">
                    <div className="h-80 w-1/2 overflow-hidden rounded-lg border shadow-inner">
                      <Canvas className="h-full w-full">
                        <directionalLight position={[5, 5, 5]} intensity={1} />
                        <ambientLight intensity={0.5} />
                        <PerspectiveCamera
                          makeDefault
                          position={[10, 10, 10]}
                          fov={45}
                        />
                        {MemoizedModel}
                        <OrbitControls target0={[0, 0, 0]} />
                      </Canvas>
                    </div>

                    <div className="flex w-1/2 flex-col justify-between">
                      <div className="space-y-2">
                        <p className="font-medium">Username: {item.username}</p>
                        <p className="font-medium">Object: {item.objectName}</p>
                        <p className="font-medium">
                          Posted: {formatTimestamp(item.createdAt)}
                        </p>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button
                          className="rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
                          onClick={() => handleRequest("accepted")}
                        >
                          Approve
                        </button>
                        <button
                          className="rounded bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
                          onClick={() => handleRequest("rejected")}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex items-center justify-center gap-2">
        <button
          onClick={() => setPage((p) => Math.max(p - 1, 0))}
          disabled={page === 0}
          className="rounded border px-3 py-1 disabled:opacity-50"
        >
          Prev
        </button>
        <span>
          Page {page + 1} of {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
          disabled={page + 1 >= totalPages}
          className="rounded border px-3 py-1 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
