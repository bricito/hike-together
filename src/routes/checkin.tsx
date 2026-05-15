import { createFileRoute } from "@tanstack/react-router";
import CheckinPage from "../pages/CheckinPage";

export const Route = createFileRoute("/checkin")({
  component: CheckinPage,
});
