import { Injectable, inject } from '@angular/core';
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
 * The tape goes with it, as it does when a loadout is opened from a record or a
 * link: the choices before it belong to a loadout that is no longer on the
 * bench, and undoing onto one would restore something the Commander never had
 * here.
 *
 * An application-layer action rather than a method on the page, because the
 * tool bar reaches it: the shell dispatches the action the registry declares
 * beside the tool and imports no bench component to do it.
 */
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
}
