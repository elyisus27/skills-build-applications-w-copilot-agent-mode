import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getJson } from '../src/api/client.js';
import { CapabilityCard } from '../src/components/CapabilityCard.js';

describe('CapabilityCard', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('announces a malformed API payload as an accessible error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ unexpected: [] }), { status: 200 })));

    render(
      <CapabilityCard
        title="Activities"
        description="Track activities."
        loadData={() => getJson<Record<string, unknown>>('/api/activities')}
        dataKey="activities"
        emptyMessage="No activities yet."
        renderItem={(activity: string) => activity}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/invalid response/i);
    });
  });
});
