import type { Metadata } from "next";
import { WebInputExperience } from "../../components/WebInputExperience";

export const metadata: Metadata = {
  title: "IsTyping Web Input",
  description: "Join an IsTyping room from your phone and send text to your desktop.",
};

export default function InputPage() {
  return <WebInputExperience />;
}
