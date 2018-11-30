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
 * @property getOptionId       Function that accepts an option's data and index and returns a string id
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
	widgetId?: string;
	invalid?: boolean;
	name?: string;
	readOnly?: boolean;
	required?: boolean;
	focus?: (() => boolean);
	label?: string;

	getOptionId?(option: any, index: number): string;
	options?: SelectOption[];
	placeholder?: string;
	onBlur?(key?: string | number): void;
	onChange?(option: any, key?: string | number): void;
	onFocus?(key?: string | number): void;
	value?: string;
	onValue?(value?: string): void;
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
		'getOptionId',
		'readOnly',
		'required',
		'invalid',
		'disabled'
	],
	attributes: ['widgetId', 'placeholder', 'label', 'value'],
	events: ['onBlur', 'onChange', 'onFocus']
})
export class Select extends ThemedMixin(FocusMixin(WidgetBase))<SelectProperties> {
	private _baseId = uuid();

	private _onBlur(event: FocusEvent) {
		this.properties.onBlur && this.properties.onBlur(this.properties.key || '');
	}

	private _onFocus(event: FocusEvent) {
		this.properties.onFocus &&
		this.properties.onFocus(this.properties.key || '');
	}

	// native select events
	private _onNativeChange(event: Event) {
		const { key, options = [], onChange } = this.properties;
		event.stopPropagation();
		const value = (<HTMLInputElement>event.target).value;
		const option = find(
			options,
			(option: any, index: number) => option.value === value
		);
		option && onChange && onChange(option, key);
	}

	protected getRootClasses() {
		const { disabled, invalid, readOnly, required } = this.properties;
		const focus = this.meta(Focus).get('root');

		return [
			css.root,
			disabled ? css.disabled : null,
			focus.containsFocus ? css.focused : null,
			invalid === true ? css.invalid : null,
			invalid === false ? css.valid : null,
			readOnly ? css.readonly : null,
			required ? css.required : null
		];
	}

	protected renderExpandIcon(): DNode {
		return v('span', { classes: this.theme(css.arrow) }, []);
	}

	protected renderNativeSelect(): DNode[] {
		const {
			aria = {},
			disabled,
			getOptionId,
			widgetId = this._baseId,
			invalid,
			name,
			options = [],
			readOnly,
			required,
			value
		} = this.properties;

		/* create option nodes */
		const optionNodes = options.map((option, i) =>
			v(
				'option',
				{
					value: option.value,
					id: getOptionId ? getOptionId(option, i) : undefined,
					disabled: option.disabled,
					selected: option.value === value
				},
				[option.label]
			)
		);

		return [
			v('span', { classes: this.theme(css.arrow) }, []),
			v(
				'select',
				{
					...formatAriaProperties(aria),
					classes: this.theme(css.input),
					disabled,
					focus: this.shouldFocus,
					'aria-invalid': invalid ? 'true' : null,
					id: widgetId,
					name,
					readOnly,
					'aria-readonly': readOnly ? 'true' : null,
					required,
					value,
					onblur: this._onBlur,
					onchange: this._onNativeChange,
					onfocus: this._onFocus
				},
				optionNodes
			)
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
			theme
		} = this.properties;
		const focus = this.meta(Focus).get('root');

		const children = [
			...this.renderNativeSelect(),
			label
				? w(
				Label,
				{
					extraClasses: { root: css.label },
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
				classes: this.theme(this.getRootClasses())
			},
			children
		);
	}
}

export default Select;
