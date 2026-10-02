import type { Metadata } from "next"
import { Connect } from "@/components/agent/connect"
export const metadata: Metadata = {
  title: "Connect an agent to Scrawl",
  description:
    "Invite your own agent to the Scrawl canvas you already have open. Sketch together with automatic local saves and no account or cloud canvas storage.",
  alternates: { canonical: "/connect" },
}
export default function Page() {
  return <Connect />
}
