import { Injectable, computed, inject } from '@angular/core';
import { getSuitByFamily } from '@elite-dangerous-almanac/core/equipment/suits';
import { getPersonalModification } from '@elite-dangerous-almanac/core/equipment/modifications';
import type { PersonalMountKey } from '@elite-dangerous-almanac/core/equipment/suits';
import type { EquipmentLoadout } from '../../domain/equipment/loadout-link/equipment-loadout';
import type { EditTarget } from '../../domain/equipment/loadout/loadout-edit';
import { MODIFICATION_SLOT_COUNT } from '../../domain/equipment/loadout/loadout-edit';
import {
  CATALOGUE_MOUNTS,
  mountAvailability,
  mountPosition,
} from '../../domain/equipment/loadout/loadout-mounts';
import { materialRequirement } from '../../domain/equipment/readings/material-requirement';
import { publishedSuitGrades, suitReadings } from '../../domain/equipment/readings/suit-readings';
import { toolReadings } from '../../domain/equipment/readings/tool-readings';
import {
  fittedWeaponReadings,
  publishedWeaponGrades,
  weaponReadings,
} from '../../domain/equipment/readings/weapon-readings';
import { modifiersOf } from '../../domain/equipment/readings/fitted-modifiers';
import { Formatters } from '../../i18n/formatters/formatters';
import { GameTextPresenter, type GameTextPresentation } from '../../i18n/game-text.presenter';
import { MESSAGE_KEYS, type MessageKey } from '../../i18n/locale-registry';
import { MessageService } from '../../i18n/message.service';
import type { Metric } from '../../ui/components/metric-group/metric-group';
import type { MaterialLineView } from '../../ui/outfitting/material-lines';
import { LoadoutStore } from './loadout.store';
import { modificationCandidates, suitCandidates, weaponCandidates } from './candidate-query';

/** One row of the ledger: the suit, or one catalogue mount. */
export interface LedgerRowView {
  readonly target: EditTarget;
  /** The two-character code the canvas draws in the row's leading square. */
  readonly badge: string;
  /** The item's name, or the empty-mount message where there is none. */
  readonly name: GameTextPresentation | null;
  readonly emptyLabel: string | null;
  /** The code line under the name. */
  readonly meta: string;
  /** `G5`, or none for a mount with nothing on it. */
  readonly grade: string | null;
  /** `2/4`, or none for a mount with nothing on it. */
  readonly modifications: string | null;
  /** True where the worn suit does not carry this mount (FR-007). */
  readonly held: boolean;
  /** The whole row as one sentence, for a reader who cannot see the dimming. */
  readonly accessibleName: string;
}

/** One suit tool the worn suit carries. Stated, never chosen (FR-005a). */
export interface ToolRowView {
  readonly badge: string;
  readonly name: GameTextPresentation;
  readonly accessibleName: string;
}

/** The whole ledger, as both artboards draw it. */
export interface LedgerView {
  readonly suit: LedgerRowView | null;
  readonly weapons: readonly LedgerRowView[];
  readonly tools: readonly ToolRowView[];
  readonly weaponCount: number;
  readonly toolCount: number;
}

/** One of an item's four modification slots. */
export interface ModificationSlotView {
  readonly slot: number;
  readonly number: string;
  readonly locked: boolean;
  readonly name: GameTextPresentation | null;
  /** The placeholder where the slot holds nothing. */
  readonly emptyLabel: string | null;
  /** The status line: fitted, held, or the grade the slot wants. */
  readonly status: string;
  readonly accessibleName: string;
}

/** The selected item, as the middle column draws it. */
export interface ItemView {
  readonly target: EditTarget;
  readonly name: GameTextPresentation;
  readonly subtitle: string;
  /** Every grade the item publishes, lowest first, for the shared ladder. */
  readonly grades: readonly number[];
  readonly grade: number;
  /** The attribute grid, as the design system's own metric cells. */
  readonly attributes: readonly Metric[];
  readonly slotsHeading: string;
  /** `null` where the item unlocks no slot at any grade — the Flight Suit. */
  readonly slots: readonly ModificationSlotView[] | null;
  /** Said in place of four unexplained locked slots (spec Edge Cases). */
  readonly noUpgradeNotice: string | null;
  /** What the weapon chooser this item opens is called. */
  readonly chooserTitle: string;
}

/** One resistance, as a signed figure beside a bar the figure does not need. */
export interface ResistanceView {
  readonly key: string;
  readonly label: string;
  readonly value: string;
  /** The bar's own length, as a fraction of full. Decoration. */
  readonly magnitude: number;
  readonly negative: boolean;
}

/** One weapon's contribution to the firepower block. */
export interface FirepowerRowView {
  readonly mount: string;
  readonly name: GameTextPresentation;
  readonly value: string;
}

/** The commander stats region. */
export interface CommanderStatsView {
  readonly shieldStrength: string;
  readonly shieldRegeneration: string;
  readonly resistances: readonly ResistanceView[];
  readonly firepower: readonly FirepowerRowView[];
}

/** The material requirements region: the list, its summary, and its absence. */
export interface MaterialsView {
  readonly lines: readonly MaterialLineView[];
  readonly summary: string | null;
  readonly emptyLabel: string;
}

/** One weapon a mount's chooser offers. */
export interface WeaponChoiceView {
  readonly symbol: string;
  readonly name: GameTextPresentation;
  readonly meta: string;
  readonly figure: string;
  readonly current: boolean;
}

/** One suit the suit chooser offers. */
export interface SuitChoiceView {
  readonly family: string;
  readonly name: GameTextPresentation;
  readonly meta: string;
  readonly figure: string;
  readonly current: boolean;
}

/** One recipe a modification slot's chooser offers. */
export interface ModificationChoiceView {
  readonly symbol: string;
  readonly name: GameTextPresentation;
  /** The engineers who grant it, as the package names them (FR-010). */
  readonly engineers: string;
  /** True where another slot on this item already holds it (FR-009). */
  readonly fitted: boolean;
  readonly current: boolean;
}

const RESISTANCES = [
  ['kineticResistance', 'kinetic'],
  ['thermalResistance', 'thermal'],
  ['plasmaResistance', 'plasma'],
  ['explosiveResistance', 'explosive'],
] as const;

/**
 * Everything the bench draws, in one view model.
 *
 * The regions ask this and nothing else: no component reaches
 * `@elite-dangerous-almanac/core`, and no component formats a number or resolves
 * a game noun for itself (constitution II, III and VI). Every figure here comes
 * from `domain/equipment/readings`, every game noun through `GameTextPresenter`,
 * and every owned word through `MessageService`.
 */
@Injectable({ providedIn: 'root' })
export class LoadoutPresenter {
  readonly #store = inject(LoadoutStore);
  readonly #text = inject(GameTextPresenter);
  readonly #messages = inject(MessageService);
  readonly #formatters = inject(Formatters);

  /** The ledger: the suit, one row per catalogue mount, and the suit's tools. */
  readonly ledger = computed<LedgerView>(() => {
    const loadout = this.#store.loadout();
    if (loadout === null) {
      return { suit: null, weapons: [], tools: [], weaponCount: 0, toolCount: 0 };
    }
    const tools = toolReadings(loadout.suitFamily).map((tool) => this.#toolRow(tool.id));
    return {
      suit: this.#suitRow(loadout),
      weapons: this.#mountRows(loadout),
      tools,
      weaponCount: getSuitByFamily(loadout.suitFamily)?.mounts.length ?? 0,
      toolCount: tools.length,
    };
  });

  /** The selected item, or nothing where the bench is empty or nothing is chosen. */
  readonly item = computed<ItemView | null>(() => {
    const loadout = this.#store.loadout();
    const target = this.#store.selected();
    if (loadout === null || target === null) return null;
    return target === 'suit' ? this.#suitItem(loadout) : this.#weaponItem(loadout, target);
  });

  /** The commander stats, or nothing where no suit is worn. */
  readonly stats = computed<CommanderStatsView | null>(() => {
    const loadout = this.#store.loadout();
    if (loadout === null) return null;
    const suit = suitReadings(loadout);
    if (suit === null) return null;

    return {
      shieldStrength: this.#formatters.decimal(suit.shieldStrength, 1),
      shieldRegeneration: this.#formatters.decimal(suit.shieldRegeneration, 2),
      resistances: RESISTANCES.map(([stat, damage]) => ({
        key: damage,
        label: this.#message(`equipment.damage.${damage}`),
        value: this.#formatters.signedPercent(suit[stat]),
        magnitude: Math.min(1, Math.abs(suit[stat])),
        negative: suit[stat] < 0,
      })),
      firepower: fittedWeaponReadings(loadout).map((weapon) => ({
        mount: weapon.mount,
        name: this.#text.personalWeaponName(weapon.symbol),
        value: this.#messages.message('equipment.stats.dps', {
          value: this.#formatters.decimal(weapon.metrics.damagePerSecond, 1),
        }),
      })),
    };
  });

  /** The micro resources the fitted modifications require. */
  readonly materials = computed<MaterialsView>(() => {
    const loadout = this.#store.loadout();
    const requirement =
      loadout === null ? { ingredients: [], types: 0, units: 0 } : materialRequirement(loadout);

    // Commonest first, as the canvas orders the block. The package sums in
    // first-seen order, which is the order recipes were fitted rather than
    // anything a Commander gathering a list would recognise.
    const collator = this.#formatters.collator();
    const ordered = [...requirement.ingredients].sort(
      (one, other) =>
        other.count - one.count ||
        collator.compare(this.#resourceName(one.symbol), this.#resourceName(other.symbol)),
    );

    return {
      lines: ordered.map((ingredient) => ({
        symbol: ingredient.symbol,
        name: this.#text.microResourceName(ingredient.symbol),
        // The package publishes a category for a micro resource and no rarity,
        // so the shared line carries none rather than an invented one.
        grade: null,
        count: this.#formatters.integer(ingredient.count),
      })),
      summary:
        requirement.types === 0
          ? null
          : this.#messages.message('equipment.materials.summary', {
              types: this.#formatters.integer(requirement.types),
              units: this.#formatters.integer(requirement.units),
            }),
      emptyLabel: this.#messages.message('equipment.materials.empty'),
    };
  });

  /** The suits the suit chooser offers, each with the shield it would give. */
  suitChoices(): readonly SuitChoiceView[] {
    const loadout = this.#store.loadout();
    return suitCandidates().map((family) => {
      const grades = publishedSuitGrades(family);
      const grade = Math.min(loadout?.suitGrade ?? 1, grades[grades.length - 1] ?? 1);
      const readings = suitReadings({
        suitFamily: family,
        suitGrade: grade,
        suitModifications: [null, null, null, null],
        weapons: [],
      });
      return {
        family,
        name: this.#text.suitName(family),
        meta: this.#suitMounts(family),
        figure:
          readings === null
            ? ''
            : this.#messages.message('equipment.chooser.shieldPoints', {
                value: this.#formatters.decimal(readings.shieldStrength, 1),
              }),
        current: loadout?.suitFamily === family,
      };
    });
  }

  /** The weapons one mount's chooser offers, each with the damage it would do. */
  weaponChoices(mount: PersonalMountKey): readonly WeaponChoiceView[] {
    const loadout = this.#store.loadout();
    const fitted = loadout?.weapons[mountPosition(mount)] ?? null;
    return weaponCandidates(mount).map((symbol) => {
      const grades = publishedWeaponGrades(symbol);
      const grade =
        fitted !== null && grades.includes(fitted.grade) ? fitted.grade : (grades[0] ?? 1);
      const readings = weaponReadings(
        mount,
        { symbol, grade, modifications: [null, null, null, null] },
        [],
      );
      return {
        symbol,
        name: this.#text.personalWeaponName(symbol),
        meta: readings === null ? '' : this.#weaponMeta(readings.weapon),
        figure:
          readings === null
            ? ''
            : this.#messages.message('equipment.stats.dps', {
                value: this.#formatters.decimal(readings.metrics.damagePerSecond, 1),
              }),
        current: fitted?.symbol === symbol,
      };
    });
  }

  /** The recipes one slot's chooser offers, with the engineers who grant each. */
  modificationChoices(target: EditTarget, slot: number): readonly ModificationChoiceView[] {
    const loadout = this.#store.loadout();
    if (loadout === null) return [];
    const held = this.#slots(loadout, target)?.[slot] ?? null;
    return modificationCandidates(loadout, target, slot).map((candidate) => ({
      symbol: candidate.symbol,
      name: this.#text.personalModificationName(candidate.symbol),
      engineers: (getPersonalModification(candidate.symbol)?.engineers ?? []).join(' · '),
      fitted: candidate.fitted,
      current: held === candidate.symbol,
    }));
  }

  /** What one modification chooser is called. */
  modificationChooserTitle(slot: number): string {
    return this.#messages.message('equipment.chooser.modification', {
      slot: this.#formatters.integer(slot + 1),
    });
  }

  #suitRow(loadout: EquipmentLoadout): LedgerRowView | null {
    const readings = suitReadings(loadout);
    if (readings === null) return null;
    const name = this.#text.suitName(loadout.suitFamily);
    const meta = this.#suitMounts(loadout.suitFamily);
    const used = readings.unlocked.length;
    return {
      target: 'suit',
      badge: this.#message('equipment.badge.suit'),
      name,
      emptyLabel: null,
      meta,
      grade: this.#grade(loadout.suitGrade),
      modifications: this.#modificationCount(used, readings.modificationSlots),
      held: false,
      accessibleName: [
        name.text ?? '',
        meta,
        this.#grade(loadout.suitGrade),
        this.#modificationSummary(used, readings.modificationSlots),
      ].join(' · '),
    };
  }

  #mountRows(loadout: EquipmentLoadout): readonly LedgerRowView[] {
    const availability = mountAvailability(loadout);
    const suitModifiers = modifiersOf(suitReadings(loadout)?.unlocked ?? []);
    return CATALOGUE_MOUNTS.flatMap((mount, position): LedgerRowView[] => {
      if (availability[position] === 'absent') return [];
      const fitted = loadout.weapons[position] ?? null;
      const held = availability[position] === 'held';
      const mountName = this.#text.personalMountName(mount).text ?? mount.key;
      const badge = this.#mountBadge(mount.key);

      if (fitted === null) {
        const empty = this.#message('equipment.mount.empty');
        return [
          {
            target: mount.key,
            badge,
            name: null,
            emptyLabel: empty,
            meta: this.#message('equipment.mount.choose'),
            grade: null,
            modifications: null,
            held: false,
            accessibleName: `${mountName} · ${empty}`,
          },
        ];
      }

      const readings = weaponReadings(mount.key, fitted, suitModifiers);
      const name = this.#text.personalWeaponName(fitted.symbol);
      // A held mount is drawn unavailable **with its weapon still named**: an
      // unavailable row whose content vanished would lose the very thing the
      // format retains (FR-007).
      const meta = held
        ? this.#messages.message('equipment.mount.held', { mount: mountName })
        : readings === null
          ? ''
          : this.#weaponMeta(readings.weapon);
      const used = readings?.unlocked.length ?? 0;
      const total = readings?.modificationSlots ?? 0;
      return [
        {
          target: mount.key,
          badge,
          name,
          emptyLabel: null,
          meta,
          grade: held ? this.#message('equipment.grade.none') : this.#grade(fitted.grade),
          modifications: held ? null : this.#modificationCount(used, total),
          held,
          accessibleName: [
            this.#messages.message('equipment.mount.selected', {
              mount: mountName,
              item: name.text ?? fitted.symbol,
            }),
            meta,
            held ? '' : this.#modificationSummary(used, total),
          ]
            .filter((part) => part.length > 0)
            .join(' · '),
        },
      ];
    });
  }

  #toolRow(id: string): ToolRowView {
    const name = this.#text.personalToolName(id);
    return {
      badge: this.#message('equipment.badge.tool'),
      name,
      // The dimming is not the only thing that says a tool cannot be swapped.
      accessibleName: this.#messages.message('equipment.tool.carried', {
        tool: name.text ?? id,
      }),
    };
  }

  #suitItem(loadout: EquipmentLoadout): ItemView | null {
    const readings = suitReadings(loadout);
    const suit = getSuitByFamily(loadout.suitFamily);
    if (readings === null || suit === null) return null;
    const grades = publishedSuitGrades(loadout.suitFamily);
    const everUnlocks = grades.some(
      (grade) => (suit.grades[String(grade) as '1']?.modificationSlots ?? 0) > 0,
    );
    const primary = suit.mounts.filter((mount) => mount.kind === 'primary').length;
    const secondary = suit.mounts.length - primary;

    return {
      target: 'suit',
      name: this.#text.suitName(loadout.suitFamily),
      subtitle: this.#suitMounts(loadout.suitFamily),
      grades,
      grade: loadout.suitGrade,
      attributes: [
        this.#attribute(
          'shieldStrength',
          'equipment.attribute.shieldStrength',
          this.#formatters.decimal(readings.shieldStrength, 1),
        ),
        this.#attribute(
          'shieldRegen',
          'equipment.attribute.shieldRegen',
          this.#messages.message('equipment.value.perSecond', {
            value: this.#formatters.decimal(readings.shieldRegeneration, 2),
          }),
        ),
        ...RESISTANCES.map(([stat, damage]) => ({
          id: damage,
          label: this.#messages.message('equipment.attribute.resistance', {
            damage: this.#message(`equipment.damage.${damage}`),
          }),
          value: this.#formatters.signedPercent(readings[stat]),
        })),
        this.#attribute(
          'weaponSlots',
          'equipment.attribute.weaponSlots',
          this.#messages.message('equipment.value.mounts', {
            primary: this.#formatters.integer(primary),
            secondary: this.#formatters.integer(secondary),
          }),
        ),
      ],
      slotsHeading: this.#slotsHeading(readings.unlocked.length, readings.modificationSlots),
      slots: everUnlocks
        ? this.#slotViews(loadout.suitModifications, readings.modificationSlots, grades, suit)
        : null,
      noUpgradeNotice: everUnlocks ? null : this.#message('equipment.item.noUpgrade'),
      chooserTitle: this.#message('equipment.chooser.suit'),
    };
  }

  #weaponItem(loadout: EquipmentLoadout, mount: PersonalMountKey): ItemView | null {
    const position = mountPosition(mount);
    const fitted = position < 0 ? null : (loadout.weapons[position] ?? null);
    // An empty mount is still an item: it is the one place a Commander opens
    // the chooser that fills it, so it states what the mount is and offers the
    // choice, with no grade ladder and no figure of its own to state.
    if (fitted === null) {
      const catalogue = CATALOGUE_MOUNTS[position];
      if (catalogue === undefined) return null;
      return {
        target: mount,
        name: this.#text.personalMountName(catalogue),
        subtitle: this.#message('equipment.mount.empty'),
        grades: [],
        grade: 0,
        attributes: [],
        slotsHeading: '',
        slots: null,
        noUpgradeNotice: null,
        chooserTitle: this.#message('equipment.mount.choose'),
      };
    }
    const suitModifiers = modifiersOf(suitReadings(loadout)?.unlocked ?? []);
    const readings = weaponReadings(mount, fitted, suitModifiers);
    if (readings === null) return null;
    const weapon = readings.weapon;
    const grades = publishedWeaponGrades(fitted.symbol);
    const metrics = readings.metrics;

    return {
      target: mount,
      name: this.#text.personalWeaponName(fitted.symbol),
      subtitle: this.#weaponMeta(weapon),
      grades,
      grade: fitted.grade,
      attributes: [
        this.#attribute(
          'damagePerShot',
          'equipment.attribute.damagePerShot',
          this.#formatters.figure(metrics.damagePerShot, 3),
        ),
        this.#attribute(
          'rateOfFire',
          'equipment.attribute.rateOfFire',
          this.#messages.message('equipment.value.perSecond', {
            value: this.#formatters.figure(metrics.rateOfFire, 2),
          }),
        ),
        this.#attribute(
          'sustainedDps',
          'equipment.attribute.sustainedDps',
          this.#formatters.decimal(metrics.sustainedDamagePerSecond, 1),
        ),
        this.#attribute(
          'headshotDamage',
          'equipment.attribute.headshotDamage',
          this.#formatters.figure(metrics.headshotDamagePerShot, 3),
        ),
        this.#attribute(
          'magazine',
          'equipment.attribute.magazine',
          this.#formatters.integer(readings.magazineSize),
        ),
        this.#attribute(
          'reserveAmmo',
          'equipment.attribute.reserveAmmo',
          this.#formatters.integer(readings.reserveAmmo),
        ),
        this.#attribute(
          'effectiveRange',
          'equipment.attribute.effectiveRange',
          this.#formatters.metres(readings.effectiveRange),
        ),
        this.#attribute(
          'dps',
          'equipment.attribute.dps',
          this.#formatters.decimal(metrics.damagePerSecond, 1),
        ),
      ],
      slotsHeading: this.#slotsHeading(readings.unlocked.length, readings.modificationSlots),
      slots: this.#slotViews(fitted.modifications, readings.modificationSlots, grades, weapon),
      noUpgradeNotice: null,
      chooserTitle: this.#message(
        weapon.slot === 'primary'
          ? 'equipment.chooser.weapon.primary'
          : 'equipment.chooser.weapon.secondary',
      ),
    };
  }

  #slotViews(
    slots: readonly (string | null)[],
    unlocked: number,
    grades: readonly number[],
    item: { readonly grades: Readonly<Record<string, { readonly modificationSlots: number }>> },
  ): readonly ModificationSlotView[] {
    return Array.from({ length: MODIFICATION_SLOT_COUNT }, (_, slot) => {
      const symbol = slots[slot] ?? null;
      const locked = slot >= unlocked;
      const number = this.#formatters.integer(slot + 1);
      const name = symbol === null ? null : this.#text.personalModificationName(symbol);
      // The lowest grade that opens this slot, asked of the item's own grades
      // rather than assumed to be the slot number plus one.
      const needed = grades.find(
        (grade) => (item.grades[String(grade)]?.modificationSlots ?? 0) > slot,
      );
      const status = locked
        ? needed === undefined
          ? this.#message('equipment.slot.locked')
          : this.#messages.message(
              symbol === null ? 'equipment.slot.requires' : 'equipment.slot.heldRequires',
              { grade: this.#formatters.integer(needed) },
            )
        : symbol === null
          ? this.#message('equipment.slot.choose')
          : this.#noChange(symbol);

      return {
        slot,
        number,
        locked,
        name,
        emptyLabel:
          symbol === null
            ? this.#message(locked ? 'equipment.slot.locked' : 'equipment.slot.empty')
            : null,
        status,
        accessibleName: [
          this.#messages.message('equipment.slot.number', { slot: number }),
          name?.text ?? this.#message(locked ? 'equipment.slot.locked' : 'equipment.slot.empty'),
          status,
        ].join(' · '),
      };
    });
  }

  /**
   * A recipe with no published magnitude is stated as fitted with no numeric
   * change — never as a zero, a dash meaning zero, or an invented figure
   * (constitution IV).
   */
  #noChange(symbol: string): string {
    const modifiers = getPersonalModification(symbol)?.modifiers ?? [];
    return this.#message(
      modifiers.length === 0 ? 'equipment.slot.noChange' : 'equipment.slot.fitted',
    );
  }

  #attribute(id: string, label: MessageKey, value: string): Metric {
    return { id, label: this.#message(label), value };
  }

  #slots(loadout: EquipmentLoadout, target: EditTarget): readonly (string | null)[] | null {
    if (target === 'suit') return loadout.suitModifications;
    const position = mountPosition(target);
    return position < 0 ? null : (loadout.weapons[position]?.modifications ?? null);
  }

  #suitMounts(family: string): string {
    const suit = getSuitByFamily(family);
    const primary = suit?.mounts.filter((mount) => mount.kind === 'primary').length ?? 0;
    const secondary = (suit?.mounts.length ?? 0) - primary;
    return this.#messages.message('equipment.suit.mounts', {
      primary: this.#formatters.integer(primary),
      secondary: this.#formatters.integer(secondary),
    });
  }

  #weaponMeta(weapon: {
    readonly class: string;
    readonly damageType: string;
    readonly fireMode: string;
  }): string {
    return this.#messages.message('equipment.weapon.meta', {
      class: this.#message(`equipment.class.${weapon.class}`),
      damage: this.#message(`equipment.damage.${weapon.damageType}`),
      fireMode: this.#message(`equipment.fireMode.${weapon.fireMode}`),
    });
  }

  /**
   * The two-character code the canvas draws in a row's leading square.
   *
   * Keyed by the mount's own journal `SlotName`, so a mount the catalogue gains
   * simply has no code until one is written for it — a square with a guessed
   * code in it would be this application inventing a name for a mount.
   */
  #mountBadge(key: string): string {
    const message = `equipment.badge.${key}`;
    return MESSAGE_KEYS.includes(message as MessageKey)
      ? this.#messages.message(message as MessageKey)
      : '';
  }

  #grade(grade: number): string {
    return this.#messages.message('equipment.grade.short', {
      grade: this.#formatters.integer(grade),
    });
  }

  #modificationCount(used: number, total: number): string {
    return this.#messages.message('equipment.modifications.count', {
      used: this.#formatters.integer(used),
      total: this.#formatters.integer(total),
    });
  }

  #modificationSummary(used: number, total: number): string {
    return this.#messages.message('equipment.modifications.summary', {
      used: this.#formatters.integer(used),
      total: this.#formatters.integer(total),
    });
  }

  #slotsHeading(used: number, total: number): string {
    return this.#messages.message('equipment.slots.heading', {
      used: this.#formatters.integer(used),
      total: this.#formatters.integer(total),
    });
  }

  #resourceName(symbol: string): string {
    return this.#text.microResourceName(symbol).text ?? symbol;
  }

  #message(key: string): string {
    return this.#messages.message(key as MessageKey);
  }
}
