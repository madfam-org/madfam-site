import { EcosystemFlowDiagram } from '../ecosystem/EcosystemFlowDiagram';
import { render } from '@/test-utils/providers';

describe('EcosystemFlowDiagram', () => {
  it('renders every step at full strength when no step is highlighted', () => {
    const { container } = render(<EcosystemFlowDiagram variant="full" />, { locale: 'es' });
    expect(container.querySelectorAll('[role="listitem"]').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('.opacity-50').length).toBe(0);
  });

  it('mutes the other steps when one is highlighted', () => {
    const { container } = render(<EcosystemFlowDiagram variant="full" highlightSlug="dhanam" />, {
      locale: 'es',
    });
    expect(container.querySelectorAll('.opacity-50').length).toBeGreaterThan(0);
  });
});
