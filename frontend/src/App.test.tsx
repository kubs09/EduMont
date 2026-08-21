import { render, screen } from '@testing-library/react';
import App from './App';

test('renders EduMont header', () => {
  render(<App />);
  const headerText = screen.getByRole('heading', { name: /^EduMont$/i });
  expect(headerText).toBeInTheDocument();
});
