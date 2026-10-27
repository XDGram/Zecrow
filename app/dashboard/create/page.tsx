import PageHeader from "@/components/dashboard/PageHeader";
import CreateEscrowWizard from "@/components/dashboard/CreateEscrowWizard";

export default function CreateEscrowPage() {
  return (
    <>
      <PageHeader
        title="Create escrow"
        subtitle="Set the terms, then share a private payment link. Physical or digital goods."
      />
      <CreateEscrowWizard />
    </>
  );
}
