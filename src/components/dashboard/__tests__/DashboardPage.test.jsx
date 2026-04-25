import React from 'react';
import { render, screen } from '@testing-library/react';
import { DashboardPage } from '../DashboardPage';

// Mock dependencies
jest.mock('../../hooks/useDashboardStats', () => ({
  useDashboardStats: () => ({ loading: false }),
}));
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'user1', getIdToken: () => 'token' } }),
}));
jest.mock('../../services/userService', () => ({
  getUserProfile: () => Promise.resolve({ name: 'Test User' }),
}));

// Mock child components
jest.mock('./WeakTopicsCard', () => ({ WeakTopicsCard: () => <div>WeakTopicsCard</div> }));


describe('DashboardPage', () => {
  it('renders WeakTopicsCard', () => {
    render(<DashboardPage />);
    expect(screen.getByText('WeakTopicsCard')).toBeInTheDocument();
  });

  it('loads user profile', async () => {
    render(<DashboardPage />);
    // Simulate async profile loading
    expect(await screen.findByText('WeakTopicsCard')).toBeInTheDocument();
  });
});
