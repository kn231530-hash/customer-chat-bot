import { Suspense } from "react";
import KnowledgeManager from "./knowledge-manager";

function KnowledgeLoading() {
  return <main className="admin"><p className="lead">Loading knowledge manager…</p></main>;
}

export default function KnowledgePage() {
  return (
    <Suspense fallback={<KnowledgeLoading />}>
      <KnowledgeManager />
    </Suspense>
  );
}
