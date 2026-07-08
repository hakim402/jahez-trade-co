import JsonLd from './JsonLd';
import { organizationData } from '@/lib/seo/organization';

export default function OrganizationSchema() {
  return <JsonLd data={organizationData} />;
}