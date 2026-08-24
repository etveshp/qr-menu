import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { LanguageSelector } from '../LanguageSelector';

afterEach(() => {
  cleanup();
});

describe('LanguageSelector', () => {
  it('shows the current language label collapsed', () => {
    render(<LanguageSelector currentLang="hu" />);
    expect(screen.getByText('HU')).toBeInTheDocument();
  });

  it('opens the list and shows all options', () => {
    render(<LanguageSelector currentLang="uk" />);
    fireEvent.click(screen.getByText('UA'));
    expect(screen.getByText('HU')).toBeInTheDocument();
    expect(screen.getByText('EN')).toBeInTheDocument();
  });

  it('calls onChange with the selected language', () => {
    const onChange = vi.fn();
    render(<LanguageSelector currentLang="uk" onChange={onChange} />);
    fireEvent.click(screen.getByText('UA'));
    fireEvent.click(screen.getAllByText('HU')[0]);
    expect(onChange).toHaveBeenCalledWith('hu');
  });

  it('normalizes "ua" to "uk"', () => {
    render(<LanguageSelector currentLang="ua" />);
    expect(screen.getByText('UA')).toBeInTheDocument();
  });

  it('respects custom options', () => {
    render(<LanguageSelector currentLang="uk" options={['uk', 'en']} />);
    fireEvent.click(screen.getByText('UA'));
    expect(screen.getByText('EN')).toBeInTheDocument();
    expect(screen.queryByText('HU')).not.toBeInTheDocument();
  });
});