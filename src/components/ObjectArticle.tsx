import Image from "next/image";

type Props = {
  url: string;
  title: string;
  username: string;
};

export default function ObjectArticle({ url, title, username }: Props) {
  return (
    <article>
      <div className="h-[90%]">
        <Image src={url} alt="Object Picture" width={300} height={300} />
      </div>
      <div className="h-[10%]">
        <h2>{username}</h2>
        <h2>{title}</h2>
      </div>
    </article>
  );
}
