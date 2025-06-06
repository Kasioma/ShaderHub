import Header from "@/components/Header";
import { auth } from "@clerk/nextjs/server";

type Props = {
  children: React.ReactNode;
};

type User = {
  id: string;
  image: string;
  roles: string[];
} | null;

export default async function layout({ children }: Props) {
  const getUserData = async (): Promise<User> => {
    const { sessionClaims } = await auth();
    if (sessionClaims)
      return {
        id: sessionClaims.id as string,
        image: sessionClaims.image as string,
        roles: sessionClaims.roles as string[],
      };
    return null;
  };

  return (
    <div>
      <Header user={await getUserData()}></Header>
      <div>{children}</div>
    </div>
  );
}
