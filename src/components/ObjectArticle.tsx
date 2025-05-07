import Image from "next/image";

type Props = {
  object: string;
  profilePicture: string;
  title: string;
};

export default function ObjectArticle({
  object,
  profilePicture,
  title,
}: Props) {
  return (
    <article>
      <Image src={object} alt="Object Picture" />
      <div>
        <Image src={profilePicture} alt="Profile Picture" />
        <h2>{title}</h2>
      </div>
    </article>
  );
}
