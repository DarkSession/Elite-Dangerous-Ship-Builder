import { Injectable, inject } from '@angular/core';
import type { PersistenceStatus } from '../build-library/working-record.port';
import { TabOwnershipCoordinator } from '../build-library/tab-ownership.coordinator';
import { LoadoutAutosaveService } from './loadout-autosave.service';
import { LoadoutLinkCoordinator } from './loadout-link.coordinator';
import { LoadoutStore } from './loadout.store';

/**
 * Starting an empty bench, for the next loadout.
 *
 * What the equipment tool's own tab does for a Commander already on the bench:
 * the bench comes back to the state it holds before a suit is chosen, with the
 * suit gate standing (017/FR-006).
 *
 * Nothing is confirmed, and nothing needs to be. The loadout that was on the
 * bench is written to the record it is autosaved into before it leaves, so it
 * stays in the saved list and can be opened again — there is nothing to lose
 * and so nothing to ask about. A named record it was opened from is not
 * touched at all: autosave never writes to one.
 *
 * Which is why the bench stays as it is where that write cannot happen. A
 * blocked store, a full one and a paused autosave each leave the loadout in
 * nothing, and clearing the bench would then be the loss the action is offered
 * on the promise of avoiding. The notice already on the bench says why.
 *
 * The tape goes with it, as it does when a loadout is opened from a record or a
 * link: the choices before it belong to a loadout that is no longer on the
 * bench, and undoing onto one would restore something the Commander never had
 * here.
 *
 * An application-layer action rather than a method on the page, because the
 * tool bar reaches it: the shell dispatches the action the registry declares
 * beside the tool and imports no bench component to do it.
 */
/** The states that say the last write did not land. */
const UNWRITTEN: ReadonlySet<PersistenceStatus> = new Set<PersistenceStatus>([
  'quota-full',
  'unavailable',
  'write-failed',
  'record-deleted-externally',
]);

@Injectable({ providedIn: 'root' })
export class EmptyBenchService {
  readonly #store = inject(LoadoutStore);
  readonly #autosave = inject(LoadoutAutosaveService);
  readonly #links = inject(LoadoutLinkCoordinator);
  readonly #ownership = inject(TabOwnershipCoordinator);

  /** Empties the bench, or does nothing at all when it is already empty. */
  start(): void {
    if (!this.#store.hasLoadout()) {
      return;
    }

    // Before the bench lets go of it. A loadout that has just been changed has
    // a write owed on it, and this is the last moment anything holds it.
    this.#autosave.flush();

    // And only once it is somewhere. What makes this action safe to offer
    // without asking is that the loadout stays as the record it is autosaved
    // to; where the store cannot hold it, clearing the bench would lose work
    // instead. The bench stays as it is, and the notice already on it says why
    // (017/FR-006).
    if (!this.#kept()) {
      return;
    }

    this.#store.open(null);
    // And out of this tab's claim, or the next page built here would restore
    // the loadout that was just cleared. The record stays where it is: it is
    // what makes clearing the bench cost nothing (017/FR-006).
    this.#ownership.release('equipment');
    // And out of the address, by replacement rather than by a new entry: a
    // Commander pressing BACK meant to leave the bench, not to walk back
    // through the loadouts it has held (FR-020).
    this.#links.publish();
  }

  /** Whether the loadout on the bench is in a record that can be opened again. */
  #kept(): boolean {
    return !this.#autosave.paused() && !UNWRITTEN.has(this.#store.persistence());
  }
}
