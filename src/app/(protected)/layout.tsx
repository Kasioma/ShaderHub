import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

type Props = {
  children: React.ReactNode;
};

export default async function layout({ children }: Props) {
  const { sessionClaims } = await auth();
  if (!sessionClaims) return redirect("/");
  return <>{children}</>;
}
