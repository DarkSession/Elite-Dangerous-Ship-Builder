import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import {
  NavigationCancel,
  NavigationCancellationCode,
  NavigationSkipped,
  NavigationSkippedCode,
  NavigationStart,
  Router,
  type Event as RouterEvent,
} from '@angular/router';
import { ServedContentAdapter } from '../../platform/browser/served-content.adapter';
import { ServedDocumentStore } from './served-document.store';

/**
 * What the Commander is left on, for the outcomes no route table can produce.
 *
 * The rest of this behaviour is read over real navigations, in
 * `src/app/app-served-document.spec.ts`. What is read here is the one shape the
 * router will not raise there: a handover the router answers without
 * navigating. It raises that skip only for an address it has already navigated
 * to, and by then a screen has been presented and there is nothing left to
 * hold — so the pairing this store is written for has no instance a real router
 * can reach, at this moment in the session or any other.
 *
 * `navigation-waiting.store.spec.ts` drives its own codes the same way and for
 * the same reason.
 */
describe('ServedDocumentStore', () => {
  const events = new Subject<RouterEvent>();
  const served: readonly Node[] = [document.createTextNode('Anaconda')];

  const start = (id: number, url = '/ships') => events.next(new NavigationStart(id, url));

  /**
   * The cancellation the router raises on its way to a replacement.
   *
   * It comes before that replacement starts, because the cancellation is what
   * the handover consists of.
   */
  const supersede = (id: number, url = '/ships') =>
    events.next(new NavigationCancel(id, url, 'redirected', NavigationCancellationCode.Redirect));

  /** The answer the router gives a navigation to the address it is already at. */
  const skip = (id: number, url = '/ships') =>
    events.next(
      new NavigationSkipped(id, url, 'same url', NavigationSkippedCode.IgnoredSameUrlNavigation),
    );

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { events } as unknown as Router },
        {
          provide: ServedContentAdapter,
          useValue: { held: true, content: served, language: 'en' },
        },
      ],
    });
  });

  it('holds what the address served when the handover is answered without a navigation', () => {
    // 018/FR-005's own outcome, "What takes over is not a navigation". No
    // screen is presented by a skip, so the Commander is still owed what the
    // address served — and an implementation counting navigations run rather
    // than screens presented would call the pair finished and drop it.
    const store = TestBed.inject(ServedDocumentStore);

    start(1);
    supersede(1);
    skip(2);

    expect(store.held()).toBe(served);
  });
});
