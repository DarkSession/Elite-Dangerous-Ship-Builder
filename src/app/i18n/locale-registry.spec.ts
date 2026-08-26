import { PLACEHOLDER, interpolate } from './locale-registry';

describe('interpolate', () => {
  it('substitutes a placeholder however it is spaced, and coerces a number', () => {
    expect(interpolate('{{ page }} · {{app}}', { page: 'Build', app: 'Ship Builder' })).toBe(
      'Build · Ship Builder',
    );
    expect(interpolate('{{count}} modules', { count: 7 })).toBe('7 modules');
  });

  it('resolves a placeholder with no parameter to nothing, never to its own name', () => {
    // A Commander reading `{{amount}}` is the fabricated value the constitution
    // forbids, and echoing the key would be worse than saying nothing.
    expect(interpolate('{{amount}} CR', {})).toBe(' CR');
    expect(interpolate('{{amount}} CR', { amount: null as unknown as string })).toBe(' CR');
    expect(interpolate('{{amount}} CR', { other: 1 })).toBe(' CR');
  });

  it('does not resolve a name off the prototype chain', () => {
    expect(interpolate('{{toString}}', {})).toBe('');
  });

  it('keeps a replacement pattern in a value literal', () => {
    // The replacer is a function, so `$&` is text a Commander typed and not an
    // instruction to the regular expression engine.
    expect(interpolate('{{name}}', { name: '$& $1' })).toBe('$& $1');
  });

  it('renders a value that is itself a placeholder rather than reading it again', () => {
    // One pass. A build name a Commander typed as `{{page}}` is their text.
    expect(interpolate('{{page}}', { page: '{{page}}' })).toBe('{{page}}');
  });

  it('shares one grammar with the validator, whatever it last matched', () => {
    // A `/g` pattern carries `lastIndex`; both readers must still agree.
    expect([...'{{a}} {{b}}'.matchAll(PLACEHOLDER)].map(([, name]) => name)).toEqual(['a', 'b']);
    expect(interpolate('{{a}} {{b}}', { a: '1', b: '2' })).toBe('1 2');
    expect([...'{{a}} {{b}}'.matchAll(PLACEHOLDER)].map(([, name]) => name)).toEqual(['a', 'b']);
  });
});
