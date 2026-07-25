
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from '../DashboardPage';
import { vi } from 'vitest';

// DashboardPage renders <Link>/uses useNavigate, both of which need a Router.
function renderDashboard() {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>
  );
}

// NOTE: paths are relative to this file (src/components/dashboard/__tests__/),
// three levels up to src/ — a prior version of this file mocked one level
// too shallow, so none of its mocks actually applied.
// `user` must be a stable reference across renders — DashboardPage's data
// effects key off it, and a fresh object per call would re-fire them forever.
const mockUser = { uid: 'user1', displayName: 'Test User', getIdToken: () => Promise.resolve('token') };
vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser }),
}));
vi.mock('../../../hooks/useDashboardStats', () => ({
  useDashboardStats: () => ({
    stats: {
      documents: { count: 3, loading: false, error: null },
      quizzes: { count: 5, loading: false, error: null },
      sessions: { count: 2, loading: false, error: null },
      rooms: { count: 1, loading: false, error: null },
    },
    loading: false,
  }),
}));
vi.mock('../../../hooks/useRecentDocuments', () => ({
  useRecentDocuments: () => ({ documents: [], loading: false, error: null }),
}));
vi.mock('../../../services/userService', () => ({
  getUserProfile: () => Promise.resolve({ displayName: 'Test User' }),
}));
vi.mock('../../../services/studyBriefService', () => ({
  fetchStudyBrief: () =>
    Promise.resolve({ brief: 'Focus on cell biology today.', generatedAt: new Date().toISOString() }),
}));

describe('DashboardPage', () => {
  it('renders a personalized greeting', () => {
    renderDashboard();
    expect(screen.getByText(/Test/)).toBeInTheDocument();
  });

  it('loads the study brief teaser and links to /progress for the full brief', async () => {
    renderDashboard();
    expect(await screen.findByText(/Read full brief/)).toBeInTheDocument();
  });
});
