import type { PageProps } from "../types/page-props";

export async function clientLoader(): Promise<PageProps> {
  return {
    title: "Index",
  };
}

export default function IndexPage() {
  return (
    <div>
      <h1>Index</h1>
    </div>
  );
}
