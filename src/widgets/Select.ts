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
import { formatAriaProperties } from '@dojo/widgets/common/util';
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

	private _onBlur(event?: Event) {
		this.properties.onBlur && this.properties.onBlur(() => {
			event && event.preventDefault();
		});
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
		option && this.selectOption(option);
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
					onblur: this._onBlur,
					onchange: this._onNativeChange,
					onfocus: this._onFocus
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

	protected selectOption(option: SelectOption) {
		const { onValue } = this.properties;

		onValue && onValue(option.value || '');
	}

	protected renderEnhancedSelect(isFocused: boolean): DNode[] {
		const {
			options = [],
			value
		} = this.properties;

		const [option] = options.filter(o => o.value === value);
		const activeIndex = options.map(o => o.value).indexOf(value);

		return [
			v('div', {
				classes: this.theme(css.selectedText),
				tabIndex: 0
			}, [
				option ? option.label : null
			]),
			v('div', {
					classes: this.theme([
						css.menu,
						isFocused ? css.menuOpen : null
					])
				},
				[
					w(Listbox, {
						getOptionDisabled: (option: SelectOption) => option.disabled || false,
						getOptionId: (option: SelectOption) => option.value || '',
						getOptionLabel: (option: SelectOption) => option.label || option.value,
						getOptionSelected: (option: SelectOption) => value === option.value,
						onOptionSelect: (option: SelectOption) => this.selectOption(option),
						optionData: options,
						activeIndex: activeIndex < 0 ? undefined : activeIndex
					})
				])
		];
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
		const focus = this.meta(Focus).get('root');

		const hasValue = focus.containsFocus || Boolean(value);

		const rootClasses = [
			css.root,
			disabled ? css.disabled : null,
			invalid ? css.invalid : null
		];

		const children = [
			v('span', { classes: this.theme(css.arrow) }, []),
			...enhanced ? this.renderEnhancedSelect(focus.containsFocus) : this.renderNativeSelect(),
			label
				? w(
				Label,
				{
					extraClasses: { root: `${this.theme(css.label)} ${this.theme(hasValue ? css.labelHasValue : null)}` },
					theme,
					disabled,
					focused: focus.containsFocus,
					invalid,
					readOnly,
					required,
					forId: widgetId
				},
				[label]
				)
				: null
		];

		return v(
			'div',
			{
				key: 'root',
				classes: this.theme(rootClasses)
			},
			children
		);
	}
}

export default Select;
