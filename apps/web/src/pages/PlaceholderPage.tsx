type PlaceholderPageProps = {
  title: string;
};

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <section className="page">
      <h1>{title}</h1>
      <p>Placeholder page. No wallet, pool math, or game UI in this phase.</p>
    </section>
  );
}
