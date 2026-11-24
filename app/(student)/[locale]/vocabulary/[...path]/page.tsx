import { Catalog } from '@/libs/components/catalog/catalog';

export default async function Page({ params }: { params: Promise<{ path: string[] }> }) {
	const { path } = await params;
	return <Catalog key={path.join('/')} mode="vocabulary-collection" path={path} />;
}
