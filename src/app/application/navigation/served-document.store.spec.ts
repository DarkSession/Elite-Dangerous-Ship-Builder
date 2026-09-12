import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import {
  NavigationCancel,
  NavigationCancellationCode,
  NavigationEnd,
  NavigationError,
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
   * The cancellation a guard raises on its way to the address it named.
   *
   * It comes before that replacement starts, because the cancellation is what
   * the handover consists of.
   */
  const redirect = (id: number, url = '/ships') =>
    events.next(new NavigationCancel(id, url, 'redirected', NavigationCancellationCode.Redirect));

  /** The cancellation a second press raises over the press still running. */
  const supersede = (id: number, url = '/ships') =>
    events.next(
      new NavigationCancel(
        id,
        url,
        'superseded',
        NavigationCancellationCode.SupersededByNewNavigation,
      ),
    );

  /** A screen presented, which is the one thing that ends the hold. */
  const present = (id: number, url = '/ships') => events.next(new NavigationEnd(id, url, url));

  /** A navigation ending with no screen to show for it. */
  const fail = (id: number, url = '/ships') =>
    events.next(new NavigationError(id, url, new Error('The chunk could not be fetched.')));

  /** The answer the router gives a navigation to the address it is already at. */
  const skip = (id: number, url = '/ships') =>
    events.next(
      new NavigationSkipped(id, url, 'same url', NavigationSkippedCode.IgnoredSameUrlNavigation),
    );

  let released = 0;

  beforeEach(() => {
    released = 0;
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { events } as unknown as Router },
        {
          provide: ServedContentAdapter,
          useValue: {
            held: true,
            content: served,
            language: 'en',
            height: 512,
            release: () => {
              released += 1;
            },
          },
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
    redirect(1);
    skip(2);

    expect(store.held()).toBe(served);
  });

  it('puts nothing back while one press is superseded by the next', () => {
    // A handover is not an ending, and the copy going back at the moment the
    // first press is cancelled would stand the served document over the screen
    // the second press is on its way to presenting. What decides is the
    // replacement (023/FR-001, 018/FR-005).
    const store = TestBed.inject(ServedDocumentStore);

    start(1);
    supersede(1);

    expect(store.held()).toBeNull();

    fail(2);

    expect(store.held()).toBe(served);
  });

  it('drops the copy once a screen is presented, and not before', () => {
    // The offer and the nodes are two things. Clearing the signal alone leaves
    // a clone of the whole served document in memory for the life of the page,
    // for a Commander who can no longer be returned to it (023/FR-001).
    const store = TestBed.inject(ServedDocumentStore);

    start(1);

    expect(released, 'the copy went before a screen stood in the outlet').toBe(0);

    present(1);

    expect(store.held()).toBeNull();
    expect(released, 'the copy was kept after the screen it stood in for arrived').toBe(1);
  });
});
