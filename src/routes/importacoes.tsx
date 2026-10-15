import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/features/dashboard/dashboard-page";
export const Route = createFileRoute("/importacoes")({
  head: () => ({
    meta: [
      { title: "Importações | JM Dashboard DS" },
      {
        name: "description",
        content: "Prévia e validação de planilhas CSV diárias da operação Last Mile JM.",
      },
      { property: "og:title", content: "Importações | JM Dashboard DS" },
      {
        property: "og:description",
        content: "Planilhas diárias, validação de colunas e prévia dos dados JM.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Imports,
});
function Imports() {
  return <DashboardPage view="imports" />;
}
