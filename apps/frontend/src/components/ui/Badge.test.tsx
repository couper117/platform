import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import Badge from './Badge';

describe('<Badge>', () => {
  it('renders its children', () => {
    const { getByText } = render(<Badge>U17</Badge>);
    expect(getByText('U17')).toBeTruthy();
  });

  it('merges a custom className onto the chip', () => {
    const { container } = render(<Badge className="test-class">x</Badge>);
    expect(container.querySelector('span')?.className).toContain('test-class');
  });

  it('forwards arbitrary attributes (title, data-*)', () => {
    const { container } = render(<Badge title="hello">x</Badge>);
    expect(container.querySelector('span')?.getAttribute('title')).toBe('hello');
  });
});
