import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitForElementToBeRemoved } from '@testing-library/react';
import { ToastProvider, useToast } from '../Toast';

afterEach(() => {
  cleanup();
});

function ToastTrigger() {
  const { showToast, showGreetingToast } = useToast();
  return (
    <>
      <button type="button" onClick={() => showToast('Тестове повідомлення', 'success')}>
        show
      </button>
      <button type="button" onClick={() => showGreetingToast('Ласкаво просимо!', 'Раді вас бачити ☕', 'customer')}>
        greet
      </button>
    </>
  );
}

describe('ToastProvider', () => {
  it('renders a toast message after showToast is called', () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'show' }));

    expect(screen.getByText('Тестове повідомлення')).toBeInTheDocument();
  });

  it('removes a toast when its close button is clicked', async () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'show' }));
    expect(screen.getByText('Тестове повідомлення')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button')[2]);
    await waitForElementToBeRemoved(() => screen.queryByText('Тестове повідомлення'));
  });

  it('renders a greeting toast with title and message', () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'greet' }));

    expect(screen.getByText('Ласкаво просимо!')).toBeInTheDocument();
    expect(screen.getByText('Раді вас бачити ☕')).toBeInTheDocument();
  });
});
