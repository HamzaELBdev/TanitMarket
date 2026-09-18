import NotFound from '../not-found';

export async function generateStaticParams() {
  return [{ notFound: ['404'] }];
}

export default function CatchAllNotFound() {
  return <NotFound />;
}
