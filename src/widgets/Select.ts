import { WidgetBase } from '@dojo/framework/widget-core/WidgetBase';
import { diffProperty } from '@dojo/framework/widget-core/decorators/diffProperty';
import { reference } from '@dojo/framework/widget-core/diff';
import { DNode } from '@dojo/framework/widget-core/interfaces';
import {
	ThemedMixin,
	ThemedProperties,
	theme
} from '@dojo/framework/widget-core/mixins/Themed';
import {
	FocusMixin
} from '@dojo/framework/widget-core/mixins/Focus';
import Focus from '@dojo/framework/widget-core/meta/Focus';
import { v, w } from '@dojo/framework/widget-core/d';
import { uuid } from '@dojo/framework/core/util';
import { find } from '@dojo/framework/shim/array';
import { formatAriaProperties, Keys } from '@dojo/widgets/common/util';
import {
	CustomAriaProperties,
	LabeledProperties
} from '@dojo/widgets/common/interfaces';
import Label from '@dojo/widgets/label/index';
import Listbox from './Listbox';
import * as css from './styles/select.m.css';
import { customElement } from '@dojo/framework/widget-core/decorators/customElement';

export interface SelectOption {
	label?: string;
	value?: string;
	disabled?: boolean;
}

/**
 * @type SelectProperties
 *
 * Properties that can be set on a Select component
 *
 * @property options           Array of any type of data for the options
 * @property placeholder       Optional placeholder text, only valid for custom select widgets (useNativeElement must be false or undefined)
 * @property useNativeElement  Use the native <select> element if true
 * @property value           The current value
 */
export interface SelectProperties
	extends ThemedProperties,
		LabeledProperties,
		CustomAriaProperties {
	disabled?: boolean;
	invalid?: boolean;
	label?: string;
	name?: string;
	options?: SelectOption[];
	readOnly?: boolean;
	required?: boolean;
	widgetId?: string;
	value?: string;
	enhanced?: boolean;

	onBlur?(preventDefault: () => void): void;
	onFocus?(preventDefault: () => void): void;
	onValue?(value: string): void;
}

@theme(css)
@diffProperty('options', reference)
@customElement<SelectProperties>({
	tag: 'dojo-select',
	properties: [
		'theme',
		'aria',
		'extraClasses',
		'options',
		'readOnly',
		'required',
		'invalid',
		'disabled',
		'enhanced'
	],
	attributes: ['widgetId', 'label', 'value'],
	events: ['onBlur', 'onFocus']
})
export class Select extends ThemedMixin(FocusMixin(WidgetBase))<SelectProperties> {
	private _baseId = uuid();
	private _open = false;
	private _didContainFocus = false;
	private _focusIndex = 0;
	private _shouldFocusList = false;

	protected open(activeIndex?: number) {

		if (typeof activeIndex === 'undefined') {
			const { options = [], value } = this.properties;
			activeIndex = options.map(o => o.value).indexOf(value);
		}

		this._focusIndex = activeIndex;
		this._open = true;
		this._shouldFocusList = true;
		this.invalidate();
	}

	protected close() {
		this._open = false;
		this.invalidate();
	}

	private _onBlur(event?: Event) {
		this.properties.onBlur && this.properties.onBlur(() => {
			event && event.preventDefault();
		});

		if (this._open) {
			this.close();
		}
	}

	private _onFocus(event?: Event) {
		this.properties.onFocus && this.properties.onFocus(() => {
			event && event.preventDefault();
		});
	}

	// native select events
	private _onNativeChange(event: Event) {
		const { options = [] } = this.properties;
		event.stopPropagation();
		const value = (<HTMLInputElement>event.target).value;
		const option = find(
			options,
			(option: SelectOption) => option.value === value
		);
		option && this.enhancedSelectOption(option);
	}

	protected renderNativeSelect(): DNode[] {
		const {
			aria = {},
			disabled,
			widgetId = this._baseId,
			invalid,
			name,
			options = [],
			readOnly,
			required,
			value
		} = this.properties;

		return [
			v(
				'select',
				{
					key: 'select',
					...formatAriaProperties(aria),
					classes: this.theme([
						css.input,
						invalid ? css.selectInvalid : null
					]),
					disabled,
					focus: this.shouldFocus,
					'aria-invalid': invalid ? 'true' : null,
					id: widgetId,
					name,
					readonly: readOnly,
					'aria-readonly': readOnly ? 'true' : null,
					required,
					value,
					onchange: this._onNativeChange
				},
				[
					v('option', {
						value: '',
						disabled: true,
						selected: true
					}),
					...options.map((option) =>
						v(
							'option',
							{
								value: option.value,
								disabled: option.disabled,
								selected: option.value === value
							},
							[option.label]
						)
					)
				]
			)
		];
	}

	protected enhancedSelectOption(option: SelectOption) {
		const { onValue } = this.properties;

		onValue && onValue(option.value || '');

		this.close();
	}

	protected onEnhancedClick() {
		this.open();
	}

	protected renderEnhancedSelect(): DNode[] {
		const {
			options = [],
			value,
			aria = {},
			required,
			invalid
		} = this.properties;

		const [option] = options.filter(o => o.value === value);

		return [
			v('div', {
				key: 'select',
				classes: this.theme(css.selectedText),
				tabIndex: 0,
				onclick: this.onEnhancedClick,
				onkeydown: this.onEnhancedKeyDown,
				...formatAriaProperties(aria),
				'aria-expanded': `${this._open}`,
				'aria-haspopup': 'listbox',
				'aria-required': required ? 'true' : null,
				'aria-invalid': invalid ? 'true' : null,
				'aria-controls': this._baseId
			}, [
				option ? option.label : null
			])
		];
	}

	protected renderEnhancedDropdown() {
		const {
			options = [],
			value,
			widgetId = this._baseId
		} = this.properties;

		const focus = this._shouldFocusList;

		this._shouldFocusList = false;

		return v('div', {
			classes: this.theme([
				css.menu,
				this._open ? css.menuOpen : null
			])
		}, [
			w(Listbox, {
				widgetId,
				getOptionDisabled: (option: SelectOption) => option.disabled || false,
				getOptionId: (option: SelectOption) => option.value || '',
				getOptionLabel: (option: SelectOption) => option.label || option.value,
				getOptionSelected: (option: SelectOption) => value === option.value,
				onOptionSelect: (option: SelectOption) => this.enhancedSelectOption(option),
				onActiveIndexChange: this.onEnhancedActiveIndexChanged,
				optionData: options,
				activeIndex: this._focusIndex < 0 ? undefined : this._focusIndex,
				tabIndex: this._open ? 0 : -1,
				focus: focus ? () => true : () => false,
				onKeyDown: this.onEnhancedKeyDown
			})
		]);
	}

	protected onEnhancedActiveIndexChanged(index: number) {
		this._focusIndex = index;
		this.invalidate();
	}

	protected onEnhancedKeyDown(event: KeyboardEvent) {
		event.stopPropagation();

		if (!this._open) {
			if (event.which === Keys.Down) {
				this.open();
			}
			else if (event.which === Keys.Space) {
				this.open();
			}
		}
		else {
			if (event.which === Keys.Space || event.which === Keys.Escape) {
				this.close();
			}
		}
	}

	protected render(): DNode {
		const {
			label,
			disabled,
			widgetId = this._baseId,
			invalid,
			readOnly,
			required,
			theme,
			value,
			enhanced = false
		} = this.properties;
		const { containsFocus } = this.meta(Focus).get('root');

		if (containsFocus && !this._didContainFocus) {
			// was just focused
			this._onFocus();
		}
		else if (!containsFocus && this._didContainFocus) {
			// was just blurred
			this._onBlur();
		}

		this._didContainFocus = containsFocus;

		const hasValue = containsFocus || Boolean(value);

		const selectContainerClasses = [
			css.selectContainer,
			disabled ? css.disabled : null,
			invalid ? css.invalid : null,
			containsFocus ? css.focused : null
		];

		return v('div', {
			key: 'root',
			classes: this.theme(css.root)
		}, [
			v(
				'div',
				{
					key: 'container',
					classes: this.theme(selectContainerClasses)
				}, [
					v('span', { classes: this.theme(css.arrow) }, []),
					...enhanced ? this.renderEnhancedSelect() : this.renderNativeSelect(),
					label
						? w(
						Label,
						{
							key: 'label',
							extraClasses: { root: `${this.theme(css.label)} ${this.theme(hasValue ? css.labelHasValue : null)}` },
							theme,
							disabled,
							focused: containsFocus,
							invalid,
							readOnly,
							required,
							forId: widgetId
						},
						[label]
						)
						: null
				]),
			enhanced ? this.renderEnhancedDropdown() : null
		]);
	}
}

export default Select;
