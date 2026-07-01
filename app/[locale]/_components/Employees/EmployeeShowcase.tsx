// app/[locale]/_components/Employees/EmployeeShowcase.tsx

import { cachedGetPublicEmployees } from "./actions";
import EmployeeShowcaseClient from "./EmployeeShowcaseClient";

export default async function EmployeeShowcase({
  locale = "en",
}: {
  locale?: "en" | "ar";
}) {
  const employees = await cachedGetPublicEmployees();

  return <EmployeeShowcaseClient locale={locale} employees={employees} />;
}