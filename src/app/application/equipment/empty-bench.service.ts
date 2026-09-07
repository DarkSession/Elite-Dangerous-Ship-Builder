import { Injectable, inject } from '@angular/core';
import { TabOwnershipCoordinator } from '../build-library/tab-ownership.coordinator';
import { LoadoutAutosaveService } from './loadout-autosave.service';
import { LoadoutLinkCoordinator } from './loadout-link.coordinator';
import { LoadoutStore } from './loadout.store';

/**
 * Taking the loadout off the bench, for the next one.
 *
 * Two ways to reach the same bench. A Commander on the bench asks the equipment
 * tool's own tab for an empty one, and the bench comes back to the state it
 * holds before a suit is chosen, with the suit gate standing (017/FR-006); a
 * Commander who deletes the record the bench is autosaved into leaves it with
 * nowhere to be kept, and it goes the same way (017/FR-008). Both are here so
 * that what the loadout leaves behind — this tab's claim on its record and the
 * loadout the address carries — goes with it either time.
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
    //
    // And only once that write has landed. What makes this action safe to offer
    // without asking is that the loadout stays as the record it is autosaved
    // to; where the store cannot hold it, clearing the bench would lose work
    // instead. The bench then stays as it is, and the notice already on it says
    // why (017/FR-006).
    if (!this.#autosave.flush()) {
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

  /**
   * Lets the bench go of a record deleted on this page, and says whether it did.
   *
   * The opposite event to a record discarded in another tab, and it takes the
   * opposite answer: a Commander who deletes the record the bench autosaves
   * into decided that here, so keeping the loadout would leave it with nowhere
   * to be saved and writing it back would undo what they confirmed
   * (001/FR-009).
   *
   * Nothing is flushed on the way out. There is nowhere to flush it to, which
   * is the whole of the event.
   *
   * What is deleted is the record, not the address. A loadout the address still
   * carries opens again from there, as any loadout in an address does, and is
   * autosaved into a record of its own — the deleted one is never written back
   * (017/FR-008).
   */
  clearHolding(recordId: string): boolean {
    if (!this.#store.clearIfHolding(recordId)) {
      return false;
    }

    this.#ownership.release('equipment');
    // And out of the address this page is on, before anything watching the
    // bench reads it: a bench cleared while its own link stands reads that link
    // straight back onto itself.
    this.#links.publish();
    return true;
  }
}
