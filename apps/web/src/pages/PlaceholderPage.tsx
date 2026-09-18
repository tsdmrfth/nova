type PlaceholderPageProps = {
  title: string;
};

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <section className="page">
      <h1>{title}</h1>
      <p>Placeholder page. No wallet or on-chain in this slice.</p>
    </section>
  );
}
