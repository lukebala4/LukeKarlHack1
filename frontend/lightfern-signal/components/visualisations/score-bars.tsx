"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ApprovedProspect } from "@/src/contracts/outreach";

const labels: Record<keyof ApprovedProspect["categoryScores"], string> = {
  need: "Product need", voice: "Distinctive voice", mission: "Mission alignment",
  reach: "Distribution power", timing: "Timing", access: "Access",
};

export function ScoreBars({ prospect }: { prospect: ApprovedProspect }) {
  const reduced = useReducedMotion();
  return <div className="score-bars">
    {Object.entries(prospect.categoryScores).map(([key, value]) => {
      const count = prospect.evidence.filter((e) => e.category === (key === "access" ? "relationship" : key)).length;
      return <div className="score-row" key={key}>
        <div><span>{labels[key as keyof typeof labels]}</span><small>{count} evidence</small></div>
        <div className="bar"><motion.i initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: reduced ? 0 : .65 }} /></div>
        <b>{value}</b>
      </div>;
    })}
  </div>;
}
