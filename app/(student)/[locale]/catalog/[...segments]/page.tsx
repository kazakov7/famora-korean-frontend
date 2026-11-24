import { Catalog } from '@/libs/components/catalog/catalog';
export default async function Page({ params }: { params: Promise<{ segments: string[] }> }) {
	return <Catalog mode="dynamic" slug={(await params).segments.at(-1)} />;
}
