import type { Metadata } from "next";
import { SpinWheel } from "@/components/SpinWheel";

export const metadata: Metadata = {
  title: "Daily spin — Blind Box",
  description: "Spin the wheel once a day for free coins.",
};

export default function DailySpinPage() {
  return <SpinWheel />;
}
