import SignInForm from "./sign-in-form";

type SignInPageProps = {
  searchParams?: Promise<{ next?: string | string[] }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const resolvedSearchParams = await searchParams;
  const nextValue = resolvedSearchParams?.next;
  const nextPath = Array.isArray(nextValue) ? nextValue[0] : nextValue;

  return <SignInForm nextPath={nextPath ?? "/admin"} />;
}
