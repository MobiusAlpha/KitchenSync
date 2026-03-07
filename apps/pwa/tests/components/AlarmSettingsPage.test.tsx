/**
 * T070a — Contract tests for AlarmSettingsPage.
 * Verifies the page renders the defaultEnabled toggle and persists changes via SettingsRepository.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AlarmSettingsPage } from '../../src/pages/AlarmSettingsPage.js';
import { SettingsRepository } from '../../src/storage/SettingsRepository.js';

// Mock SettingsRepository so tests don't require IndexedDB
vi.mock('../../src/storage/SettingsRepository.js', () => ({
  SettingsRepository: {
    read: vi.fn(),
    write: vi.fn(),
  },
}));

const mockedSettings = vi.mocked(SettingsRepository);

async function renderPage() {
  render(<AlarmSettingsPage />);
  // Wait for the useEffect to load settings
  await waitFor(() =>
    expect(screen.getByLabelText(/enable alarms by default/i)).toBeInTheDocument(),
  );
}

describe('AlarmSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedSettings.read.mockResolvedValue({ id: 'global', defaultEnabled: true });
    mockedSettings.write.mockResolvedValue(undefined);
  });

  it('renders the Settings heading', async () => {
    await renderPage();
    expect(screen.getByRole('heading', { name: /settings/i })).toBeInTheDocument();
  });

  it('renders the global alarm toggle checked when defaultEnabled=true', async () => {
    await renderPage();
    const toggle = screen.getByLabelText(/enable alarms by default/i) as HTMLInputElement;
    expect(toggle.checked).toBe(true);
  });

  it('renders the Save button', async () => {
    await renderPage();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('calls SettingsRepository.write with toggled value when Save is clicked', async () => {
    await renderPage();
    const toggle = screen.getByLabelText(/enable alarms by default/i);
    await userEvent.click(toggle);
    const saveBtn = screen.getByRole('button', { name: /save/i });
    await userEvent.click(saveBtn);
    expect(mockedSettings.write).toHaveBeenCalledWith({ id: 'global', defaultEnabled: false });
  });
});
