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
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const [parsedObject, setParsedObject] = useState<ParsedModelProps | null>(
    null,
  );
  const [zip, setZip] = useState<Blob | null>(null);
  const { setObjectModal } = useObjectModal();
  const { modal } = useModal();

  useEffect(() => {
    if (parsedObject) setObjectModal(true);
  }, [parsedObject, setObjectModal]);

  useEffect(() => {
    if (modal) {
      setParsedObject(null);
      setObjectModal(false);
    }
  }, [modal, setObjectModal]);

  const handleModalClose = () => {
    setParsedObject(null);
    setObjectModal(false);
  };

  const handleObjectClick = async (id: string) => {
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
      // setZip(zipBlob);
      const unzipped = await unzipFiles(zipBlob);
      if (!unzipped) return;
      setParsedObject(unzipped);
    }
  };

  const handleDownload = () => {
    if (!zip) return;
    downloadZip(zip);
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
          onClick={() => handleDownload()}
        />
      </div>
      <div className="flex justify-around p-2 text-sm text-text">
        <h2>{username}</h2>
        <h2>{thumbnailTitle}</h2>
      </div>
      {parsedObject && !modal && (
        <ModelModal
          fileType={parsedObject.fileType}
          loadedFile={parsedObject.fileBlob}
          binary={parsedObject.kind === "gltf" ? parsedObject.fileBinary : null}
          textures={parsedObject.fileTextures}
          title={thumbnailTitle}
          username={username}
          userId={userId}
          onClose={handleModalClose}
        />
      )}
    </article>
  );
}
