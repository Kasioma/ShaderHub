import { Download } from "lucide-react";
import Image from "next/image";

type Props = {
  url: string;
  title: string;
  username: string;
};

export default function ObjectArticle({ url, title, username }: Props) {
  return (
    <article
      className="rounded-b-md bg-secondary shadow-md"
      style={{ boxShadow: "4px 4px 12px #1e2939" }}
    >
      <div className="relative bg-background p-0">
        <Image src={url} alt="Object Picture" width={300} height={300} />
        <Download className="absolute right-2 top-2 h-5 w-5 cursor-pointer text-text" />
      </div>
      <div className="flex justify-around p-2 text-sm text-text">
        <h2>{username}</h2>
        <h2>{title}</h2>
      </div>
    </article>
  );
}
