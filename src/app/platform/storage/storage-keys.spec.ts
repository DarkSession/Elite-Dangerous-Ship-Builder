import {
  EDSB_BROADCAST_CHANNEL,
  EDSB_RECORD_KEY_PREFIX,
  EDSB_TAB_KEY,
  recordLockName,
  recordIdFromKey,
  recordKey,
} from './storage-keys';

describe('owned key space', () => {
  it('names a record key from its id and reads the id back', () => {
    const key = recordKey('7f3a');

    expect(key).toBe(`${EDSB_RECORD_KEY_PREFIX}7f3a`);
    expect(recordIdFromKey(key)).toBe('7f3a');
  });

  it('refuses a key this application does not own', () => {
    expect(recordIdFromKey('edsb:tab')).toBeNull();
    expect(recordIdFromKey('someone-else:record:7f3a')).toBeNull();
    expect(recordIdFromKey(EDSB_RECORD_KEY_PREFIX)).toBeNull();
  });

  it('locks per record rather than globally', () => {
    expect(recordLockName('a')).not.toBe(recordLockName('b'));
    expect(recordLockName('a')).toBe('edsb:record:a');
  });

  it('keeps the tab and channel names stable', () => {
    expect(EDSB_TAB_KEY).toBe('edsb:tab');
    expect(EDSB_BROADCAST_CHANNEL).toBe('edsb.persistence.v1');
  });
});
