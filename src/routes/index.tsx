import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/features/dashboard/dashboard-page";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Visão Geral | JM Dashboard" },
      {
        name: "description",
        content:
          "Performance Last Mile da JM Transportes: indicadores, evolução e ranking de bases.",
      },
      { property: "og:title", content: "Visão Geral | JM Dashboard" },
      {
        property: "og:description",
        content: "Indicadores gerenciais de performance Last Mile da JM Transportes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});
function Index() {
  return <DashboardPage view="overview" />;
}
