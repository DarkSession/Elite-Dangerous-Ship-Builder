import {
  EDNB_BROADCAST_CHANNEL,
  EDNB_RECORD_KEY_PREFIX,
  EDNB_TAB_KEY,
  recordLockName,
  recordIdFromKey,
  recordKey,
} from './storage-keys';

describe('owned key space', () => {
  it('names a record key from its id and reads the id back', () => {
    const key = recordKey('7f3a');

    expect(key).toBe(`${EDNB_RECORD_KEY_PREFIX}7f3a`);
    expect(recordIdFromKey(key)).toBe('7f3a');
  });

  it('refuses a key this application does not own', () => {
    expect(recordIdFromKey('ednb:tab')).toBeNull();
    expect(recordIdFromKey('someone-else:record:7f3a')).toBeNull();
    expect(recordIdFromKey(EDNB_RECORD_KEY_PREFIX)).toBeNull();
  });

  it('locks per record rather than globally', () => {
    expect(recordLockName('a')).not.toBe(recordLockName('b'));
    expect(recordLockName('a')).toBe('ednb:record:a');
  });

  it('keeps the tab and channel names stable', () => {
    expect(EDNB_TAB_KEY).toBe('ednb:tab');
    expect(EDNB_BROADCAST_CHANNEL).toBe('ednb.persistence.v1');
  });
});
