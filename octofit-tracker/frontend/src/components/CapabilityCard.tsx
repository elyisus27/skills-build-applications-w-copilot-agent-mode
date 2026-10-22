import { useEffect, useState, type ReactNode } from 'react';

type Props<T> = {
  title: string;
  description: string;
  loadData: () => Promise<Record<string, unknown>>;
  dataKey: string;
  emptyMessage: string;
  renderItem: (item: T) => ReactNode;
};

export function CapabilityCard<T>({ title, description, loadData, dataKey, emptyMessage, renderItem }: Props<T>) {
  const [items, setItems] = useState<T[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setItems(null);
    setError(null);
    loadData()
      .then((payload) => {
        const result = payload[dataKey];
        if (!Array.isArray(result)) throw new Error('The server returned an invalid response.');
        if (active) setItems(result as T[]);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setError(requestError instanceof Error ? requestError.message : 'Unable to load data.');
      });
    return () => { active = false; };
  }, [dataKey, loadData]);

  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">{title}</h2>
    <p>{description}</p>
    {error ? <p role="alert">Unable to load {title.toLowerCase()}: {error}</p>
      : items === null ? <p role="status">Loading {title.toLowerCase()}...</p>
        : items.length === 0 ? <p>{emptyMessage}</p>
          : <ul>{items.map((item, index) => <li key={index}>{renderItem(item)}</li>)}</ul>}
  </div></section>;
}
