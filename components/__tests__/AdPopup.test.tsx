import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act, waitFor } from '@testing-library/react';
import { AdPopup } from '../menu/AdPopup';

let subscribeCb: ((ad: any) => void) | null = null;

vi.mock('@/lib/supabase', () => ({
  subscribeAdvertising: vi.fn((cb: (ad: any) => void) => {
    subscribeCb = cb;
    return () => { subscribeCb = null; };
  }),
}));

function fireAd(ad: { photo?: string; delaySeconds?: number; enabled?: boolean }) {
  subscribeCb?.({
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
  subscribeCb = null;
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
});