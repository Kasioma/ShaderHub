import { cn, unzipFiles } from "@/utilities/utils";
import JSZip from "jszip";
import { Download } from "lucide-react";
import Image from "next/image";

type Props = {
  url: string;
  title: string;
  username: string;
  modal: boolean;
};

export default function ObjectArticle({ url, title, username, modal }: Props) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const handleObjectClick = async (url: string) => {
    const APIInputData = new FormData();
    APIInputData.append("file", url);
    const res = await fetch(`${baseUrl}/api/filestorage/object/query`, {
      method: "POST",
      body: APIInputData,
    });

    if (!res.ok) {
      console.error("Error fetching object");
      return;
    } else {
      const zipBlob = await res.blob();
      const unzipped = await unzipFiles(zipBlob);
      if (!unzipped) return;
      console.log(unzipped);
    }
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
          src={url}
          alt="Object Picture"
          width={300}
          height={300}
          onClick={() => handleObjectClick(url)}
          className="cursor-pointer"
        />
        <Download className="absolute right-2 top-2 h-5 w-5 cursor-pointer text-text" />
      </div>
      <div className="flex justify-around p-2 text-sm text-text">
        <h2>{username}</h2>
        <h2>{title}</h2>
      </div>
    </article>
  );
}
