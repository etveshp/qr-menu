import { createElement, useState, Component, type ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('next/link', () => ({
  default: ({ href, children }: { href?: unknown; children?: ReactNode }) =>
    createElement('a', { href: typeof href === 'string' ? href : '#' }, children),
}));

import ErrorPage from '../error';
import GlobalError from '../global-error';
import NotFound from '../not-found';

function Bomb({ armed }: { armed: boolean }) {
  if (armed) throw new Error('boom');
  return <div>Живий вміст</div>;
}

class TestBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  reset = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) {
      return <ErrorPage error={new Error('boom')} reset={this.reset} />;
    }
    return this.props.children;
  }
}

function Harness() {
  const [armed, setArmed] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setArmed(true)}>
        Зламати
      </button>
      <Bomb armed={armed} />
    </>
  );
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('app/error', () => {
  it('renders the fallback with both actions', () => {
    render(<ErrorPage error={new Error('x')} reset={vi.fn()} />);
    expect(screen.getByText('Щось пішло не так')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Спробувати знову' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'До меню' })).toHaveAttribute('href', '/');
  });

  it('calls reset when «Спробувати знову» is pressed', () => {
    const reset = vi.fn();
    render(<ErrorPage error={new Error('x')} reset={reset} />);
    fireEvent.click(screen.getByRole('button', { name: 'Спробувати знову' }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});

describe('app/global-error', () => {
  it('renders a full-document fallback', () => {
    const html = renderToStaticMarkup(<GlobalError error={new Error('x')} reset={vi.fn()} />);
    expect(html).toContain('Щось пішло не так');
    expect(html).toContain('<html');
    expect(html).toContain('Спробувати знову');
  });
});

describe('app/not-found', () => {
  it('renders the 404 page with a link to the menu', () => {
    render(<NotFound />);
    expect(screen.getByText('Сторінку не знайдено')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'До меню' })).toHaveAttribute('href', '/');
  });
});

describe('error boundary integration', () => {
  it('shows the fallback on a render error and recovers via reset', () => {
    render(
      <TestBoundary>
        <Harness />
      </TestBoundary>
    );
    expect(screen.getByText('Живий вміст')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Зламати' }));
    expect(screen.getByText('Щось пішло не так')).toBeInTheDocument();
    expect(screen.queryByText('Живий вміст')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Спробувати знову' }));
    expect(screen.getByText('Живий вміст')).toBeInTheDocument();
  });
});
