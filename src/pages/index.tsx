import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();
  // Immediately redirect to /login
  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return <div>Redirecting...</div>;
}
