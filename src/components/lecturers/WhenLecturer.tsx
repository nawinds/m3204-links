import React from "react";
import { useLecturer } from "./LecturersProvider";

export default function WhenLecturer({
  subjectId,
  value,
  children,
}: {
  subjectId: string;
  value: string;
  children: React.ReactNode;
}) {
  const current = useLecturer(subjectId);
  if (current !== value) return null;
  return <>{children}</>;
}
