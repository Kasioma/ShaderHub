import type { ParsedModelProps } from "@/utilities/types";
import { cn, unzipFiles, downloadZip } from "@/utilities/utils";
import { Download } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import ModelModal from "./ModelModal";
import { useObjectModal } from "@/context/objectProvider";
import { useModal } from "@/context/searchProvider";

type Props = {
  objectId: string;
  thumbnailUrl: string;
  thumbnailTitle: string;
  username: string;
  userId: string;
};

export default function ObjectArticle({
  objectId,
  thumbnailUrl,
  thumbnailTitle,
  username,
  userId,
}: Props) {
  const [zip, setZip] = useState<Blob | null>(null);
  const { setObjectModal } = useObjectModal();
  const { modal } = useModal();

  useEffect(() => {
    if (zip) setObjectModal(true);
  }, [zip, setObjectModal]);

  useEffect(() => {
    if (modal) {
      setZip(null);
      setObjectModal(false);
    }
  }, [modal, setObjectModal]);

  const handleModalClose = () => {
    setZip(null);
    setObjectModal(false);
  };

  const handleObjectClick = async (id: string) => {
    const newZip = await fetchZip(id);
    if (!newZip) return;
    setZip(newZip);
  };

  const handleDownload = async (id: string) => {
    const newZip = await fetchZip(id);
    if (!newZip) return;
    downloadZip(newZip, id);
  };

  return (
    <article
      className={cn("relative rounded-b-md bg-secondary shadow-md", {
        "-z-10": modal,
      })}
      style={{ boxShadow: "4px 4px 12px #1e2939" }}
    >
      <div className="relative bg-background p-0">
        <Image
          src={thumbnailUrl}
          alt="Object Picture"
          width={300}
          height={300}
          onClick={() => handleObjectClick(objectId)}
          className="h-[200px] cursor-pointer object-cover"
        />
        <Download
          className="absolute right-2 top-2 h-5 w-5 cursor-pointer text-text"
          onClick={() => handleDownload(objectId)}
        />
      </div>
      <div className="flex justify-around p-2 text-sm text-text">
        <h2>{username}</h2>
        <h2>{thumbnailTitle}</h2>
      </div>
      {zip && !modal && (
        <ModelModal
          modelBlob={zip}
          objectId={objectId}
          title={thumbnailTitle}
          username={username}
          userId={userId}
          onClose={handleModalClose}
        />
      )}
    </article>
  );
}

async function fetchZip(id: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const APIInputData = new FormData();
  APIInputData.append("file", id);
  const res = await fetch(`${baseUrl}/api/filestorage/object/query`, {
    method: "POST",
    body: APIInputData,
  });

  if (!res.ok) {
    console.error("Error fetching object");
    return;
  } else {
    const zipBlob = await res.blob();
    if (!zipBlob) return;
    return zipBlob;
  }
}
