/**
 * Naming a mount a Commander is being told about.
 *
 * The ledger's labels are keyed by the package's own slot key. The keys the
 * ingress notices carry come from whatever named the mount in the file, the
 * link or the journal event that was read in — and the package matches slot
 * keys without regard to case, which is why `completeEngineeringGrade` accepts
 * `slot08_size4` for a mount the ledger lists as `Slot08_Size4`. Looking the
 * label up by exact key therefore missed, and the notice fell back to printing
 * the raw key: `The engineering on slot08_size4 was completed`. A slot key is
 * an identity, not something a Commander reads.
 *
 * So the lookup compares the way the package compares. A key with no label at
 * all still falls back to itself: a notice that named no mount would be worse
 * than one naming it awkwardly.
 */
export function slotName(labels: Readonly<Record<string, string>>, slotKey: string): string {
  const exact = labels[slotKey];
  if (exact !== undefined) {
    return exact;
  }
  const wanted = slotKey.toLowerCase();
  for (const [key, label] of Object.entries(labels)) {
    if (key.toLowerCase() === wanted) {
      return label;
    }
  }
  return slotKey;
}
