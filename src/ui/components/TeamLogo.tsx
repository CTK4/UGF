import React from "react";

export function TeamLogo({ teamId }: { teamId: string }) {
  return <span className="ugf-pill">{teamId}</span>;
}
