import { createFileRoute } from "@tanstack/react-router";
import ManageHike from "../../../pages/ManageHike";

export const Route = createFileRoute("/hikes/$id/manage")({
  component: ManageHike,
});
