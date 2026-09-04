import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { StrictMode } from 'react';
import { render, screen, fireEvent, cleanup, act, waitFor } from '@testing-library/react';
import { AdPopup } from '../menu/AdPopup';

// Keep every registered subscription: an "unsubscribed" (stale) one may still
// fire later (its in-flight fetch resolves), mirroring the real subscribeAdvertising.
let subscribeCbs: Array<(ad: any) => void> = [];

vi.mock('@/lib/supabase', () => ({
  subscribeAdvertising: vi.fn((cb: (ad: any) => void) => {
    subscribeCbs.push(cb);
    return () => {};
  }),
}));

function fireAd(ad: { photo?: string; delaySeconds?: number; enabled?: boolean }) {
  subscribeCbs[subscribeCbs.length - 1]?.({
    photo: 'data:image/webp;base64,test',
    delaySeconds: 0,
    enabled: true,
    ...ad,
  });
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
  subscribeCbs = [];
});

beforeEach(() => {
  vi.useFakeTimers();
});

describe('AdPopup', () => {
  const mockT = (key: string) => {
    const map: Record<string, string> = {
      advertising: 'Advertising',
      adClose: 'Close ad',
    };
    return map[key] ?? key;
  };

  it('shows the popup when ad is enabled with photo after delay', () => {
    render(<AdPopup t={mockT} />);

    act(() => fireAd({ delaySeconds: 0 }));
    act(() => { vi.runAllTimers(); });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders the close button', () => {
    render(<AdPopup t={mockT} />);

    act(() => fireAd({ delaySeconds: 0 }));
    act(() => { vi.runAllTimers(); });

    expect(screen.getByRole('button', { name: 'Close ad' })).toBeInTheDocument();
  });

  it('closes the popup when the close button is clicked', async () => {
    vi.useRealTimers();
    render(<AdPopup t={mockT} />);

    act(() => fireAd({ delaySeconds: 0 }));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Close ad' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('does not show the popup when ad is disabled', () => {
    render(<AdPopup t={mockT} />);

    act(() => fireAd({ enabled: false }));
    act(() => { vi.runAllTimers(); });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not show the popup when ad has no photo', () => {
    render(<AdPopup t={mockT} />);

    act(() => fireAd({ photo: '' }));
    act(() => { vi.runAllTimers(); });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('respects the configured delay', () => {
    render(<AdPopup t={mockT} />);

    act(() => fireAd({ delaySeconds: 5 }));
    act(() => { vi.advanceTimersByTime(1); });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(5000); });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('still shows the popup when a stale StrictMode subscription fires after the live one', () => {
    // React StrictMode (dev) mounts the effect twice: the first subscription
    // becomes stale after its cleanup, but its in-flight callback can still
    // arrive later. It must not cancel the live subscription's pending timer.
    render(
      <StrictMode>
        <AdPopup t={mockT} />
      </StrictMode>
    );

    const stale = subscribeCbs[0];
    const live = subscribeCbs[subscribeCbs.length - 1];

    // Live subscription schedules the popup first, then the stale one fires
    // afterwards (the order that used to clear the shared timer).
    act(() => live?.({ photo: 'data:image/webp;base64,test', delaySeconds: 0, enabled: true }));
    act(() => stale?.({ photo: 'data:image/webp;base64,test', delaySeconds: 0, enabled: true }));
    act(() => { vi.runAllTimers(); });

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});